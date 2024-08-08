

export type ParseResult = {
    value: any,
    source: Element,
    type: "page" | "paragraph" | "sentence" | "textItem",
    errors: [],
    innerResults: [ParseResult],
    parseFunc: Function,
};

export type Book = {
    id: string,
    name: string,
    pages: Page[],
};

export type Page = {
    number: number,
    text: string,
    paragraphs: Paragraph[],
};

export type Paragraph = {
    text: string,
    sentences: Sentence[],
    terms: Term[],
    page: Page,
};

export type Sentence = {
    id: string,
    text: string,
    terms: Term[],
    paragraph: Paragraph,
};

export type Term = {
    id: string,
    text: string,
    sentences: Sentence,
};