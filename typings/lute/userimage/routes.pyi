"""
This type stub file was generated by pyright.
"""

"""
User images routes.

User images are stored in the database as /userimages/langid/term, but
with no jpeg extension.  Reason: the old symfony code couldn't manage
urls with periods.
"""
bp = ...
@bp.route("/<int:lgid>/<term>", methods=["GET"])
def get_image(lgid, term): # -> Response:
    "Serve the image from the data/userimages directory."
    ...

