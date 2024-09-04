

import roadie.patches

import logging
from pathlib import Path
from textwrap import dedent

from jinja2 import FileSystemLoader
from werkzeug.middleware.profiler import ProfilerMiddleware
from flask import Flask
from flask import g
from flask_vite import Vite
from lute.app_factory import create_app as lute_create_app
from lute.config.app_config import AppConfig

from roadie.routes import bp as roady_bp
from roadie.read.routes import bp as roady_read_bp

log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)

module_root = Path(__file__).parent
asset_path = module_root / 'static'


def create_dev_config() -> Path:

    data_dir = module_root.parent / '.lutedata'
    genconfig_file = data_dir / '_gen_lute_config.yml'

    config_yml = dedent(f"""
        # Generated file DO NOT EDIT!

        # The environment.  Either 'prod' or 'dev'
        ENV: dev

        # The database file name.
        # For tests, this must be "test_<name>.db" (e.g test_lute.db).
        # REQUIRED
        DBNAME: lute.db

        # Folder where data should be stored.
        # If not set, this returns the "app data" folder
        # as indicated by PlatformDirs.user_data_dir
        # (ref https://pypi.org/project/platformdirs/).
        # OPTIONAL (but REQUIRED for docker and developer tests)
        DATAPATH: {data_dir}

        # Folder where backups should be stored.
        # OPTIONAL (but REQUIRED for docker)
        # BACKUP_PATH: yourpathhere

        # Set IS_DOCKER: true if this is run in a container.
        IS_DOCKER: false
        """
    )
    data_dir.mkdir(parents=True, exist_ok=True)
    with genconfig_file.open('w') as file:
        file.write(config_yml)

    return genconfig_file

def override_context_processor():
    head_after_scripts = dedent(f"""
        <link rel="stylesheet" type="text/css" href="/{asset_path}/styles.css" />                   
    """)
    return dict(head_after_scripts=head_after_scripts)


def create_app () -> Flask:
    config_file = create_dev_config()
    app: Flask = lute_create_app(config_file)
    app.jinja_loader = FileSystemLoader([
        str(module_root / 'templates' / 'overrides'),
        str(Path(app.root_path, app.template_folder)),
    ])
    vite = Vite()
    vite.init_app(app)
    app.context_processor(override_context_processor)
    app.register_blueprint(roady_bp)
    app.register_blueprint(roady_read_bp)
    # app.wsgi_app = ProfilerMiddleware(app.wsgi_app, sort_by=('cumtime',), restrictions=(.10,))
    return app