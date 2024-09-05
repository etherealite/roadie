from textwrap import dedent
from pathlib import Path

from jinja2 import FileSystemLoader
from flask import Flask


class OverrideLute:
    def __init__(self, asset_path) -> None:
        self.asset_path = asset_path

    def init_lute_app(self, app: Flask) -> None:
        asset_path = self.asset_path

        def override_context_processor(asset_path):
            head_after_scripts = dedent(f"""
                <link rel="stylesheet" type="text/css" href="/{asset_path}/styles.css" />                   
            """)
            return dict(head_after_scripts=head_after_scripts)

        app.context_processor(override_context_processor)
        app.jinja_loader = FileSystemLoader([
            str(Path(__file__).parent / 'templates'),
            str(Path(app.root_path, app.template_folder)),
        ])