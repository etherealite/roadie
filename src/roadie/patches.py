import wrapt

from jinja2.ext import Extension

class PreprocessExtension(Extension):
    def preprocess(self, source, name, filename=None):
        # Modify the template source before parsing
        modified_source = source.replace('apple-mobile-web-app-capable', 'poop')
        return modified_source
    
jinja_options = dict(extensions=[PreprocessExtension])

#@wrapt.when_imported('flask')
def hook(flask):
    flask.Flask.jinja_options = {
        **flask.Flask.jinja_options, **jinja_options
    }