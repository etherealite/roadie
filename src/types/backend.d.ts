export type Sentence = {
    id: string;
    text: string;
};

export type Word = {
    wid: string;
    text: string;
    status: string;
    sentence: string;
    popupInfo: string;
};

export type ConnectNote = {
    id: string;
    deckName: string;
    modelName: string;
    fields: Record<string, any>;
    tags: string[];
};

export type UnSavedConnectNote = Omit<ConnectNote, 'id'>;


export type ParsedWord = {
    wid: string;
    text: string;
    status: string;
};

export type ParsedSentence = [string, ParsedWord[]];

export type ParsedPage = ParsedSentence[];

export type ParsedBook = [string, ParsedPage[]];

export type ParseError = {
    message: string,
    parent: Element | null,
};

export type ParseResult = {
    parsedParent: element
    element: Element,
    result: ParsedWord | ParsedSentence | ParsedPage | ParsedBook | null;
    error: ParseError | null;
};

export type ParseFunction = (node: Element) => ParseResult | null;

export type ParseReducer = (arr: ParseResult[], el: Element) => ParseResult[];