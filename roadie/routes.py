import itertools

from collections.abc import Generator, Iterator

from flask import Blueprint, flash, request, render_template, redirect, jsonify
import click

from lute.models.book import Book, Text
from lute.models.term import Term
from lute.models.term import Term, Status
from lute.read.render.service import get_paragraphs, RenderableSentence
from lute.read.render.renderable_calculator import TextItem


bp: Blueprint = Blueprint("roadie", __name__, static_folder='static', static_url_path='/roadie/static')


@bp.route("/studylist/<int:bookid>", methods=["GET"])
def studylist(bookid: int) -> str:
    terms = book_study_terms(bookid)
    return "heloooo"


RenderableParagraph = list[RenderableSentence]


def book_textitems_gen(bookid: int) -> tuple[Generator[TextItem, None, None], int]:
    book = Book.find(bookid)
    page_len = len(book.texts)
    texts: Generator[str, None, None] = (txt.text for txt in book.texts)
    paragraphs: Generator[list[RenderableParagraph], None, None] = itertools.chain.from_iterable(
        (get_paragraphs(text, book.language) for text in texts)
    )
    sentences: Generator[RenderableSentence, None, None] = itertools.chain.from_iterable(paragraphs)
    textitems: Generator[TextItem, None, None] = itertools.chain.from_iterable(
        (sentence.textitems for sentence in sentences)
    )

    return textitems, page_len


def book_study_terms(textitems):
    terms: Generator[Term, None, None] = (textitem.term for textitem in textitems if textitem.term)
    study_terms: dict[int, TextItem] = {
        term.id: term for term in terms if term.status not in (
            Status.UNKNOWN, Status.WELLKNOWN, Status.IGNORED,
        )
    }
    return [term for term in study_terms.values()]


@bp.cli.command("do")
def book_words():
    list(book_textitems_gen(4)[0])