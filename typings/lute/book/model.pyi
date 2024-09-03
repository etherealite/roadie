"""
This type stub file was generated by pyright.
"""

"""
Book domain objects.
"""
class Book:
    """
    A book domain object, to create/edit lute.models.book.Books.

    Book language can be specified either by language_id, or
    language_name.  language_name is useful for loading books via
    scripts/api.  language_id takes precedence.
    """
    def __init__(self) -> None:
        ...
    
    def __repr__(self): # -> str:
        ...
    
    def add_tag(self, tag): # -> None:
        ...
    


class Repository:
    """
    Maps Book BO to and from lute.model.Book.
    """
    def __init__(self, _db) -> None:
        ...
    
    def load(self, book_id): # -> Book:
        "Loads a Book business object for the DBBook."
        ...
    
    def get_book_tags(self): # -> list:
        "Get all available book tags, helper method."
        ...
    
    def add(self, book): # -> Book | None:
        """
        Add a book to be saved to the db session.
        Returns DBBook for tests and verification only,
        clients should not change it.
        """
        ...
    
    def delete(self, book): # -> None:
        """
        Delete.
        """
        ...
    
    def commit(self): # -> None:
        """
        Commit everything.
        """
        ...
    


