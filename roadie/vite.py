import shutil
import subprocess
import atexit
import signal
from types import SimpleNamespace
from textwrap import dedent
from typing import Callable, TypedDict

from flask import Flask
from flask_vite import Vite as FlaskVite


class Vite:
    def __init__(self):
        self.runner = Runner()
    def init_app(self, app: Flask):
        wraped_vite = FlaskVite()
        wraped_vite.init_app(app)

        @app.before_request
        def start_npm_process() -> None:
            if not self.runner.running:
                self.runner.run("dev")

class Runner:
    def __init__(self):
        self.running: bool = False
    def run(self, *args: str) -> None:
        npm_bin_path: str | None = shutil.which("npm")

        if npm_bin_path is None:
            raise EnvironmentError("npm is not found in the PATH. Please ensure npm is installed and available in your PATH.")



        process: subprocess.Popen | None = None

        def terminate_process() -> None:
            if process and process.poll() is None:  # Check if the process is still running
                process.send_signal(signal.SIGTERM)  # Send SIGTERM for graceful shutdown
                try:
                    process.wait(timeout=10)  # Wait for the process to terminate
                except subprocess.TimeoutExpired:
                    process.kill()  # Force kill if it doesn't terminate in time


        _args = [npm_bin_path, *args]
        process = subprocess.Popen(_args)
        self.running = True
        atexit.register(terminate_process)