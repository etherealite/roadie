"""
This type stub file was generated by pyright.
"""

"""
/book routes.
"""
bp = ...
def datatables_source(is_archived): # -> Response:
    "Get datatables json for books."
    ...

@bp.route("/datatables/active", methods=["POST"])
def datatables_active_source(): # -> Response:
    "Datatables data for active books."
    ...

@bp.route("/archived", methods=["GET"])
def archived(): # -> str:
    "List archived books."
    ...

@bp.route("/datatables/Archived", methods=["POST"])
def datatables_archived_source(): # -> Response:
    "Datatables data for archived books."
    ...

@bp.route("/new", methods=["GET", "POST"])
def new(): # -> Response | str:
    "Create a new book, either from text or from a file."
    ...

@bp.route("/edit/<int:bookid>", methods=["GET", "POST"])
def edit(bookid): # -> Response | str:
    "Edit a book - can only change a few fields."
    ...

@bp.route("/import_webpage", methods=["GET", "POST"])
def import_webpage(): # -> str:
    ...

@bp.route("/archive/<int:bookid>", methods=["POST"])
def archive(bookid): # -> Response:
    "Archive a book."
    ...

@bp.route("/unarchive/<int:bookid>", methods=["POST"])
def unarchive(bookid): # -> Response:
    "Archive a book."
    ...

@bp.route("/delete/<int:bookid>", methods=["POST"])
def delete(bookid): # -> Response:
    "Archive a book."
    ...

