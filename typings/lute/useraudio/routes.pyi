"""
This type stub file was generated by pyright.
"""

"""
User audio routes.

User audio files are stored in the database in books table.
"""
bp = ...
@bp.route("/stream/<int:bookid>", methods=["GET"])
def stream(bookid): # -> Response:
    "Serve the audio, no caching."
    ...

