"""
This type stub file was generated by pyright.
"""

"""
Common form methods.
"""
def language_choices(dummy_entry_placeholder=...): # -> list[tuple[int, str]] | list[tuple[Any, Any]]:
    """
    Return the list of languages for select boxes.

    If only one lang exists, only return that,
    otherwise add a '-' dummy entry at the top.
    """
    ...

def valid_current_language_id(): # -> int:
    """
    Get the current language id from UserSetting, ensuring
    it's still valid.  If not, change it.
    """
    ...

