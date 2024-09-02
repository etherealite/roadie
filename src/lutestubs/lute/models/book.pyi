from typing import Self, Any

from sqlalchemy.orm import Mapped
from flask_sqlalchemy import SQLAlchemy
from lute.db import db
from lute.models.language import Language

DBType = SQLAlchemy

db: DBType

booktags: DBType.Table

class BookTag(db.Model):
    "Term tags."
    __tablename__: str
    id: db.Column
    text: db.Column
    comment: db.Column

    @staticmethod
    def make_book_tag(text: str, comment: str = "") -> Self: ...
    
    @staticmethod
    def find_by_text(text: str) -> Self | None: ...
    
    @staticmethod
    def find_or_create_by_text(text: str) -> Self: ...

class Book(db.Model):
    """
    Book entity.
    """
    __tablename__: str
    id: db.Column
    title: db.Column
    language_id: db.Column
    source_uri: db.Column
    current_tx_id: db.Column
    archived: db.Column
    audio_filename: db.Column
    audio_current_pos: db.Column
    audio_bookmarks: db.Column
    language: Mapped[Language]
    texts: Mapped[list[Any]]
    book_tags: Mapped[list[BookTag]]

    def __init__(self, title: str | None = None, language: db.Model | None = None, source_uri: str | None = None) -> None: ...
    
    def __repr__(self) -> str: ...
    
    def remove_all_book_tags(self) -> None: ...
    
    def add_book_tag(self, book_tag: BookTag) -> None: ...
    
    def remove_book_tag(self, book_tag: BookTag) -> None: ...
    
    @property
    def page_count(self) -> int: ...
    
    def page_in_range(self, n: int) -> int: ...

    
    def remove_page(self, pagenum: int) -> None: ...
    
    @property
    def is_supported(self) -> bool: ...
    
    @staticmethod
    def create_book(title: str, language: db.Model, fulltext: str, max_word_tokens_per_text: int = 250) -> Self: ...
    
    @staticmethod
    def find(book_id: int) -> Self | None: ...



class Text(db.Model):
    """
    Each page in a Book.
    """
    __tablename__: str
    id: db.Column
    _text: db.Column
    order: db.Column
    _read_date: db.Column
    bk_id: db.Column
    word_count: db.Column

    book: Mapped[Book]
    bookmarks: Mapped[list[Any]]
    sentences: Mapped[list[Sentence]]

    def __init__(self, book: Any, text: str, order: int = 1) -> None: ...
    
    @property
    def title(self) -> str: ...
    
    @property
    def text(self) -> str: ...
    
    @text.setter
    def text(self, s: str) -> None: ...
    
    @property
    def read_date(self) -> Any: ...
    
    @read_date.setter
    def read_date(self, s: Any) -> None: ...
    
    def _get_parsed_tokens(self) -> Any: ...
    
    def _load_sentences_from_tokens(self, parsedtokens: Any) -> None: ...
    
    def load_sentences(self) -> None: ...
    
    def _add_sentence(self, sentence: Any) -> None: ...
    
    def _remove_sentences(self) -> None: ...
    
    @staticmethod
    def find(text_id: int) -> Self | None: ...



class Sentence(db.Model):
    """
    Parsed sentences for a given Text.

    The Sentence contains the parsed tokens, joined by the zero-width string.
    """
    __tablename__: str
    id: db.Column
    tx_id: db.Column
    order: db.Column
    text_content: db.Column

    text: Mapped[Any]

    def __init__(self, text_content: str = "", text: Any | None = None, order: int = 1) -> None: ...
    
    @staticmethod
    def from_tokens(tokens: Any, senumber: int) -> Self: ...