import itertools

from collections.abc import Generator, Iterator

from flask import Blueprint, flash, request, render_template, redirect, jsonify, abort

from lute.models.book import Book, Text
from lute.models.term import Term
from lute.models.term import Term, Status
from lute.db import db
from lute.read.render.service import get_paragraphs, RenderableSentence
from lute.read.service import start_reading
from lute.read.render.renderable_calculator import TextItem
from lute.read.routes import bp as lute_bp

# import lutestubs.lute.read.render

from lute.read.render.service import RenderableSentence
RenderableParagraph = list[RenderableSentence]
# RenderableParagraphs = list[RenderableParagraph]

bp = Blueprint("roadie_read", __name__, url_prefix="/roadie/read")


def serializable_paragraphs(paragraphs: list[RenderableParagraph]) -> Iterator:
    def textitem_dict(textitem: TextItem) -> dict:
        return dict(
            wo_id=textitem.wo_id,
            html_display_text=textitem.html_display_text,
            wo_status=textitem.wo_status,
        )

    def sentence_dict(sentence: RenderableSentence) -> Iterator:
        textitems = sentence.textitems
        return dict(
            sentence_id=sentence.sentence_id,
            textitems=[
                textitem_dict(textitem) for textitem in textitems
            ],
        )

    def serializable_paragraph(paragraph: RenderableParagraph) -> Iterator:
        return (sentence_dict(sentence) for sentence in paragraph)

    return (
        list(serializable_paragraph(paragraph)) for paragraph in paragraphs
    )


@bp.route('/book/<int:bookid>/page/<int:pagenum>')
def page_data(bookid: int, pagenum: int) -> str:
    book = Book.find(bookid)
    if book is None:
        abort(404, description="book not found")

    paragraphs = start_reading(book, pagenum, db.session)
    return list(serializable_paragraphs(paragraphs))
