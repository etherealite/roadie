"""
This type stub file was generated by pyright.
"""

from lute.models.book import Text

"""
Reading helpers.
"""
def set_unknowns_to_known(text: Text): # -> None:
    """
    Given a text, create new Terms with status Well-Known
    for any new Terms.
    """
    ...

def bulk_status_update(text: Text, terms_text_array, new_status): # -> None:
    """
    Given a text and list of terms, update or create new terms
    and set the status.
    """
    ...

def start_reading(dbbook, pagenum, db_session): # -> list:
    "Start reading a page in the book, getting paragraphs."
    ...

def get_popup_data(termid): # -> dict[str, Any]:
    "Get the data necessary to render a term popup."
    ...

