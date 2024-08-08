/**
 * @import * as BookExtractor from './types/BookExtractor'
 */
/**needed or above '@import' will be considered unused */
// @ts-ignore
let tsignore;



/**
 * @param {String} html the HTML to parse
 * @return {HTMLTemplateElement}
 */
function templateFromString(html) {
    // Then set up a new template element.
    const template = document.createElement('template');
    template.innerHTML = html;

    return template;
}


/**
 * @param {string} HTMLString - valid html document in string form.
 * @return {{
 *    bookId: string,
 *    bookName: string,
 *    pageCount: number,
 *    jpeaneseReading: boolean,
 * }}
*/
export function extractReaderHTMLString(HTMLString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(HTMLString, 'text/html');

    const countInput = doc.querySelector('#page_count');

    const pageCount = countInput instanceof HTMLInputElement ? 
        parseInt(countInput.value) : null;

    const bookInput = doc.querySelector('#book_id');
    const bookId = bookInput instanceof HTMLInputElement ?
        bookInput.value : null;

    const bookName = doc
        .querySelector('#headertexttitle')?.textContent;

    /** @type {RegExp} */
    const regex = /const\s+LUTE_USER_SETTINGS\s*=\s*({[^}]+})/;

    const settingsMatch = Array
        .from(doc.querySelectorAll('head script'))
        .map(script => regex.exec(script.textContent))
        .find(match => match !== null);


    /** @type {Object} */
    const settings = JSON.parse(settingsMatch?.[1] ?? '{}');

    const japaneseReading = Object
        .hasOwn(settings, 'japanese_reading') ? true : false


    const errors = [];

    if (!bookName) {
        errors.push('Book name is missing or empty.');
    }

    if (!bookId) {
        errors.push('Book ID is missing or empty.');
    }

    if (pageCount === null || isNaN(pageCount)) {
        errors.push('can\'t get page count.');
    }

    if (!Object.keys(settings).length) {
       errors.push('failed to read `LUTE_USER_SETTINGS` variable');
    }

    if (errors.length) {
        throw new Error(`
            Book properties could not be extracted: 
            ${errors.map(error => error.message).join('\n')}
        `);
    }
    return {bookName, bookId, pageCount, japaneseReading};
}



export function parsePageString(pageString) {

    /** TODO get rid of errorLog */
    const errorLog = [];

    function createResult({value, source, type, errors, innerResults}) {
        const result =  {
            value,
            source,
            type,
            innerResults,
        };

        const refsAdded = [];
        for (const errorString of errors) {
            const error = [errorString, result];
            refsAdded.push(error);
            errorLog.push(error)
        }

        result.errors = refsAdded;
    
        return result;
    }

    function wrongParamTypeResult(element, type, msg) {
        return createResult({
            value: null,
            source: element,
            type,
            errors: [msg],
            innerResults: [],
        });
    }


    function parseTextItemElement(element) {
        if (!(element instanceof HTMLElement)) {
            return wrongParamTypeResult(element, "textItem", 'source Not an HTMLElement');
        }

        const text = element.textContent;
        if(text === null || text.length === 0) {
            return wrongParamTypeResult(element, "textItem", 'has no text content');
        }

        const errors = [];

        const wid = element.getAttribute('data-wid');
        const status = element.getAttribute('data-status-class');

        let isWord = false;
        if (element.classList.contains('word')) {

            if(!wid) {
                errors.push('word with no data-wid');
            }
            if(!status) {
                errors.push('word with no data-status-class');
            }
            isWord = wid && status;
        }

        return createResult({
            value: isWord ? {wid, text, status} : text,
            source: element,
            type: 'textItem',
            errors: errors,
            innerResults: [],
            parseFunc: parseTextItemElement,
        });
    }

    function parseSentenceElement(element) {
        if (!(element instanceof HTMLElement)) {
            return wrongParamTypeResult(element, 'sentence', 'source Not an HTMLElement');
        }

        if (!element.id) {
            return wrongParamTypeResult(element, 'sentence', 'sentence element id is missing');
            
        }
        if (!/^sent_\d+/.test(element.id)) {
            return wrongParamTypeResult(element, 'sentence', 'sentence element id doesn\'t start with sent_');
            
        }


        const textItemResults = Array.from(
            element.querySelectorAll('.textitem')
        ).map(parseTextItemElement);

        return createResult({
            value: {id: element.id, textItems: textItemResults.map(t => t.value)},
            source: element,
            type: 'sentence',
            errors: [],
            innerResults: textItemResults,
        });
    }

    function parseParagraphElement(element) {
        if (!(element instanceof HTMLElement)) {
            return wrongParamTypeResult(element, 'paragraph', 'source Not an HTMLElement');
        }
        const sentenceResults = Array.from(
            element.querySelectorAll('.textsentence')
        ).map(parseSentenceElement);



        return createResult({
            value: sentenceResults.map(s => s.value),
            source: element,
            type: 'paragraph',
            errors: [],
            innerResults: sentenceResults,
        });
    }

    function parsePageTemplate(element) {
        if (!(element instanceof HTMLTemplateElement)) {
            return wrongParamTypeResult(element, 'page','source Not an HTMLElement');
        }

        const paraElements = Array.from(element.content.children)
            .filter(el => el instanceof HTMLParagraphElement);

        const paragraphsResults = paraElements.map(parseParagraphElement);

        return createResult({
            value: paragraphsResults.map(p => p.value),
            source: element,
            type: 'page',
            errors: [],
            innerResults: paragraphsResults,
        });
    }

    return parsePageTemplate(templateFromString(pageString));
};

/**
 * 
 * @param {BookExtractor.ParseResult} tree 
 * @param {(tree: BookExtractor.ParseResult) => void} func
 */
export function walkTree(tree, func) {
    func(tree);
    for (const innerTree of tree.innerResults) {
        /** @type {BookExtractor.ParseResult} */
        walkTree(innerTree, func);
    }
}


/** @param {BookExtractor.ParseResult[]} parsedPages */
export function structureNewBook(parsedPages) {
    const book = {
        pages: [],
        paragraphs: [],
        sentences: new Map(),
        terms: [],
        uniqueTerms: new Map(),
        parseErrors: [],
    };
    walkTree(parsedPages, (node) => {
        if (node.type === 'page') {
            book.pages.push(node);
        } else if (node.type === 'paragraph') {
            book.paragraphs.push(node);
        } else if (node.type === 'sentence') {
            book.sentences.set(node.value.id, node);
        } else if (node.type === 'textItem') {
            if (typeof node.value === 'Object') {
                book.terms.push(node.value);
            }
        }
        if (node.errors.length) {
            book.parseErrors.push(...node.errors);
        }
    });
    return book;
}
export const usedGlobals = [
    'DOMParser',
    'document',
    'HTMLElement',
    'HTMLInputElement',
    'HTMLParagraphElement',
    'HTMLTemplateElement',
    'NodeList',
];