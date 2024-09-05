



import logging
from pathlib import Path
from textwrap import dedent


# from werkzeug.middleware.profiler import ProfilerMiddleware
from flask import Flask


from lute.app_factory import create_app as lute_create_app

from .routes import bp as roady_bp
from .read.routes import bp as roady_read_bp
from .override import OverrideLute

from .vite import Vite


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


def create_app () -> Flask:
    config_file = create_dev_config()
    app: Flask = lute_create_app(config_file)
    override = OverrideLute()
    override.init_lute_app(app)
    vite = Vite()
    vite.init_app(app)

    app.register_blueprint(roady_bp)
    app.register_blueprint(roady_read_bp)
    # app.wsgi_app = ProfilerMiddleware(app.wsgi_app, sort_by=('cumtime',), restrictions=(.10,))
    return app