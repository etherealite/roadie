"""
This type stub file was generated by pyright.
"""

from flask_wtf import FlaskForm

"""
Book create/edit forms.
"""
class NewBookForm(FlaskForm):
    """
    New book.  All fields can be entered.
    """
    language_id = ...
    title = ...
    desc = ...
    text = ...
    textfile = ...
    max_page_tokens = ...
    source_uri = ...
    audiofile = ...
    book_tags = ...
    def __init__(self, *args, **kwargs) -> None:
        "Call the constructor of the superclass (FlaskForm)"
        ...
    
    def populate_obj(self, obj): # -> None:
        "Call the populate_obj method from the parent class, then mine."
        ...
    
    def validate_language_id(self, field): # -> None:
        "Language must be set."
        ...
    
    def validate_text(self, field): # -> None:
        "Throw if missing text and textfile, or if have both."
        ...
    


class EditBookForm(FlaskForm):
    """
    Edit existing book.  Only a few fields can be changed.
    """
    title = ...
    source_uri = ...
    book_tags = ...
    audiofile = ...
    audio_filename = ...
    def __init__(self, *args, **kwargs) -> None:
        "Call the constructor of the superclass (FlaskForm)"
        ...
    
    def populate_obj(self, obj): # -> None:
        "Call the populate_obj method from the parent class, then mine."
        ...
    


