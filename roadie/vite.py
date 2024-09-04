from flask import Flask
import subprocess
import atexit
import signal
from textwrap import dedent

NPM_BIN_PATH = "/path/to/npm"  # Update this to your actual npm path

class NPMError(Exception):
    pass

def create_npm_runner(cwd="", npm_bin_path=NPM_BIN_PATH):
    def run(*args):
        process = None

        def terminate_process():
            if process and process.poll() is None:  # Check if the process is still running
                process.send_signal(signal.SIGTERM)  # Send SIGTERM for graceful shutdown
                try:
                    process.wait(timeout=10)  # Wait for the process to terminate
                except subprocess.TimeoutExpired:
                    process.kill()  # Force kill if it doesn't terminate in time

        try:
            _args = [npm_bin_path, *list(args)]
            process = subprocess.Popen(_args, cwd=cwd)
            atexit.register(terminate_process)
        except OSError as e:
            if e.filename == npm_bin_path:
                msg = """
                It looks like node.js and/or npm is not installed or cannot be found.
                Visit https://nodejs.org to download and install node.js for your system.
                """
            elif e.filename == cwd:
                msg = f"""
                It looks like the current working directory for vite is not correct.
                cwd: {cwd}
                """
            else:
                msg = f"""
                An error occurred while running npm.
                cwd: {cwd}
                npm_bin_path: {npm_bin_path}
                """

            raise NPMError(dedent(msg))

    return run

app = Flask(__name__)

@app.before_first_request
def start_npm_process():
    app.npm_runner = create_npm_runner(cwd="/path/to/project")
    app.npm_runner("install")

@app.teardown_appcontext
def stop_npm_process(exception=None):
    if hasattr(app, 'npm_runner'):
        app.npm_runner.terminate_process()

if __name__ == "__main__":
    app.run()