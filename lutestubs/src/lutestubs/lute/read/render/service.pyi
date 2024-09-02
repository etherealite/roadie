from lute.read.render.renderable_calculator import TextItem
from lute.read.render.service import RenderableSentence

RenderableParagraph = list[RenderableSentence]

def get_paragraphs(s, language) -> list[RenderableParagraph]: ...