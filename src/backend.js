import {AnkiConnect} from './yomitan.js';

/**
 * @import * as backend from "./types/backend"
 * @import * as anki from "./types/yomitan/anki"
 */

/**needed or above '@import' will be considered unused */
// @ts-ignore
let tsignore;

/**
 * @typedef {backend.Word} Word
 * @typedef {backend.ConnectNote} ConnectNote
 * @typedef {backend.UnSavedConnectNote} UnSavedConnectNote
 * @typedef {backend.ParsedSentence} ParsedSentence
 * @typedef {backend.ParsedWord} ParsedWord
 * @typedef {backend.ParsedPage} ParsedPage
 * @typedef {backend.ParsedBook} ParsedBook
 */

/**
 * 
 * @param {number} size 
 * @param {number} startAt 
 * @returns 
 */
function range(size, startAt = 0) {
    return [...Array(size).keys()].map(i => i + startAt);
}

/** 
 * @param {any} value
 * @returns {Boolean}
 */
function isHTMLElement(value) {
    return value instanceof HTMLElement;
}

/**
 * @param {String} html the HTML to parse
 * @return {HTMLCollection}
 */
function parseHTMLString(html) {
    // Then set up a new template element.
    const template = document.createElement('template');
    template.innerHTML = html;
    const result = template.content.children;
  
    return result;
}

/**
 * A semaphore for limiting concurrency.
 * @class
 */
class Semaphore {
    /**
     * Creates a new Semaphore instance.
     * @param {number} maxConcurrency - The maximum allowed concurrency.
     */
    constructor(maxConcurrency) {
        this.maxConcurrency = maxConcurrency
        this.currentConcurrency = 0
        /**
         * @type {Array<() => void>}
         */
        this.queue = []
    }

    /**
     * Acquires a concurrency slot.
     * @returns {Promise<void>} - Resolves when a slot is acquired.
     */
    async acquire() {
        return new Promise((resolve) => {
            if (this.currentConcurrency < this.maxConcurrency) {
                this.currentConcurrency++
                resolve()
            } else {
                this.queue.push(resolve)
            }
        })
    }

    /**
     * Releases a concurrency slot.
     */
    release() {
        if (this.queue.length > 0) {
            const resolve = this.queue.shift()
            resolve?.()
        } else {
            this.currentConcurrency--
        }
    }
}

/**
 * @param {(...args: any) => Promise<any>} asyncFunc
 * @param {number} rate
 */
// function rateLimit(asyncFunc, rate) {
//     const semaphore = new Semaphore(rate)
//     /** @param {...*} args */
//     return async function process( ...args) {
//         await semaphore.acquire()
//         try {
//             return await asyncFunc(...args)
//         } finally {
//             semaphore.release()
//         }
//     }
// }

/**
 * 
 * @param {number} rate - The maximum allowed concurrency.
 */
function makeLimit(rate) {
    const semaphore = new Semaphore(rate);

    /** @param {(...args: any) => Promise<any>} func */
    return function newLimit(func) {
        /** @param {...*} args */
        return async function (...args) {
            await semaphore.acquire();
            try {
                return await func(...args);
            } finally {
                semaphore.release();
            }           
        }
    }
}

const requestLimit = makeLimit(8);

/**
 * @param {string} bookid
 * @param {number} pageCount
 */
async function fetchBookMarkup(bookid, pageCount) {
    /**
     * @param {any} pageNumber
     */
    async function fetchPage(pageNumber) {
        let url = `/read/renderpage/${bookid}/${pageNumber}`;
        return requestLimit(async () => {
            return fetch(url).then(response => {
                return response.text();
            })
        })();
    }
    const pageNumbers = range(pageCount, 1);
    return (await Promise.all(pageNumbers.map(fetchPage)));
}

/**
 * Use popup termpopup route to get definitions.
 * 
 * @param {String[]} wids
 * @returns {Promise<Map<string, string>>}
 */
async function fetchTermPopup(wids) {
    /**
     * @param {any} wid
     * @returns {Promise<[string, string]>}
     */
    function fetchById(wid) {
        let url = `/read/termpopup/${wid}`;
        return fetch(url)
            .then(response => response.text())
            .then(text => [wid, text]);
    }
    const entries = await Promise.all(wids.map(fetchById))
    return new Map(entries);
}

/**
 * Scrapes the learning words from the Anki deck.
 * @param {String} BookName
 * @param {String[]} pages - The pages of the deck.
 * @return {ParsedBook}
 */
function parseBookTree(BookName, pages) {
    /**
     * @param {Node} node
     * @returns {backend.ParsedWord?}
     */
    function parseWordElement(node) {
        if (!isHTMLElement(node)) return null;

        const el = /** @type {HTMLElement} */ (node);

        const wid = el.getAttribute('data-wid');
        const text = el.textContent;
        const status = el.getAttribute('data-status-class');
        if (!wid || !text || !status) {
            return null;
        }
        return {wid, text, status};
    }

    /**
     * @param {Node} node
     * @returns {ParsedSentence?}
    */
    function parseSentenceElement(node) {
        if (!isHTMLElement(node)) return null;
        const el = /** @type {HTMLElement} */ (node);

        if (!el.childNodes.length || !el.id.length) return null;

        return [
            el.id,
            Array
                .from(el.querySelectorAll('span[data-wid]'))
                .map(parseWordElement)
                .filter(word => word !== null)
        ];
    }

    /**
     * @param {Node} node
     * @returns {ParsedPage?}
     */
    function parsePageElement(node) {
        if (!isHTMLElement(node)) return null;

        const pageHtmlElement = /** @type {HTMLElement} */(node);

        return (
            Array.from(
                pageHtmlElement.querySelectorAll('.textsentence')
            )
                .map(parseSentenceElement)
                .filter(sentence => sentence !== null)
        );
    }
    
    const pageDivs = pages.map((page) => {
        return parseHTMLString('<div>' + page + '</div>')?.[0];
    });

    return [
        BookName, 
        pageDivs.map(parsePageElement).filter(page => page !== null)
    ];
}

/**
 * Traverses a tree-like structure and yields each node encountered.
 * @param {ParsedBook} node - The root node of the book.
 */
function walk(node) {
    const levels = Object.freeze({
        BOOK: 0,
        PAGE: 1,
        SENTENCE: 2,
        WORD:3,
    });

    /**
     * Recursive helper function for walking through nodes.
     * @param {any} node - The current node.
     */
    function walker(node, level = levels.BOOK) {
        if (Array.isArray(node)) {
            let constructing = false;
            if (level === levels.BOOK) {
                
            }
            const transformed = [];
            for (const child of node) {
                if (Array.isArray(child)) {
                    transformed.push(walker(child));
                } else {
                    return child;
                }
            }
        } else {
            return node;
        }
    }
    walker(node);
}

function transformParsedBook(parsedBook) {

    const [bookName, parsedPages] = parsedBook;
    const transformed = {bookName};
    for (const parsedPage of parsedPages) {
        transformParsedPage(parsedPage, resolver);
    }
    return {
        /**
         * all terms in the book
         */
        terms() {
        },
        /**
         * unique terms in the book
         */
        uniqueTerms() {
        },
    }
}

function 

/**
 *
 * @param {string} bookid 
 * @param {string} bookName
 * @param {number} pageCount 
 * @returns {Promise<Word[]>}
 */
async function processBookWords(bookid, bookName, pageCount) {
    const pageMarkup = await fetchBookMarkup(bookid, pageCount);
    const bookTree = parseBookTree(bookName, pageMarkup);

    for (const node of walk(bookTree)) {
        console.log(node);
    }

    return;

    const popupInfo = await fetchTermPopup(
        wordExtracts.map((extract) => extract.wid)
    );
    return wordExtracts.map((extract) => {
        const {wid, text, status, sentences} = extract;
        const sentence = sentences.values().next().value;
        const popup = popupInfo.get(wid);
        /** @type {Word} */
        return {wid, text, status, sentence, popup};
    });
}


/**
 * @param {{host: string, deckName: string, modelName: string}} options
 */
function ankiClient({host, deckName, modelName}) {
    /** Example param values */
    // const host = 'http://127.0.0.1:8765';
    // const deckName = 'lute3';
    // const modelName = 'Basic (and reversed card)';

    let anki = new AnkiConnect();
    anki.enabled = true;
    anki.server = host;


    async function diagnostics() {
        /** @type {anki.Note[]} */
        const notes =  [
            {
                "deckName": deckName,
                "modelName": modelName,
                "fields": {
                    "Front": "front content",
                    "Back": "back content"
                },
                "tags": [
                    "yomichan"
                ],
                "options": {
                    "allowDuplicate": false,
                    "duplicateScope": "deck",
                    "duplicateScopeOptions": {
                        "deckName": null,
                        "checkChildren": false,
                        "checkAllModels": false
                    }
                }
            }
        ];

        const [canAddBasic] = await anki.canAddNotes(notes)
        return {
            connected: await anki.isConnected(),
            canAddBasicNote: canAddBasic,
        };
    }

    return {
        diagnostics,
        /**
         * @param {string} query
         */
        async findNotes(query) {
            return await anki.findNotes(query)
        },
        /**
         * @param {any[]} noteIds
         */
        async notesInfo(noteIds) {
            return await anki.notesInfo(noteIds)
        }
    };
}

export const config = {
    ankiConnect: {
        host: '',
        deckName: '',
        modelName: '',
    },
};


/** The properties of a book
 * @param {Document} doc
 * @typedef {Object} BookProps
 * @property {number} pageCount - The number of pages in the book.
 * @property {string} bookId - The ID of the book.
 * @property {string} bookName - The name of the book.
 * @returns {BookProps}
 */
function extractBookProps(doc) {

    const countInput = doc.querySelector('#page_count');
    // const pageCount = isHTMLInputElement(countInput) ? parseInt(countInput.value) : null;
    const pageCount = countInput instanceof HTMLInputElement ? 
        parseInt(countInput.value) : null;

    const bookInput = doc.querySelector('#book_id');
    const bookId = bookInput instanceof HTMLInputElement ?
        bookInput.value : null;

    const bookName = doc
        .querySelector('#headertexttitle')?.textContent;
    

    if (!bookName) {
        throw new Error('Book name is missing or empty.');
    }

    if (pageCount === null || isNaN(pageCount)) {
        throw new Error('Invalid page count.');
    }

    if (!bookId) {
        throw new Error('Book ID is missing or empty.');
    }

    return {bookName, bookId, pageCount};
}


/**
 * Check to see if notes exist
 * 
 * Check to see if we have already created notes for this book
 * in the anki deck.
 */
export async function existingAnkiNotes() {
    const {bookId} = extractBookProps(document);
    const anki = ankiClient(config.ankiConnect);
    const noteIds = await anki.findNotes(`tag:lute3::bookId::${bookId}`);
    const notes = await anki.notesInfo(noteIds);
    return notes;
}


/**
 * 
 * @param {{words: Word[], bookId: string, bookName: string}} param0 
 * @returns 
 */
export async function genBookScopedNotes({words, bookId, bookName}) {
    let bookTags = [
        `lute3::bookId::${bookId}`,
        `lute3::bookName::${bookName}`
    ];


    /**
     * @param {Word} word
     * @returns {[UnSavedConnectNote, UnSavedConnectNote]}
     */
    function createNotes({
        wid,
        text,
        sentence,
    }) {
        const baseNote = {
            deckName: config.ankiConnect.deckName,
            modelName: config.ankiConnect.modelName,
            fields: {
                'Front': '',
                'Back': '',
            },
            tags: [...bookTags, `lute3::wid::${wid}`],
        };
        /** @type {UnSavedConnectNote} */
        const wordCard = {...baseNote,
            fields: {
                'Front': text,
                'Back': sentence,
            },
            tags: [...baseNote.tags, `lute3::noteType::word`],
        };
        /** @type {UnSavedConnectNote} */
        const sentenceCard = {...baseNote,
            fields: {
                'Front': sentence,
                'Back': text,
            },
            tags: [...baseNote.tags, `lute3::noteType::sentence`],
        };
        return [wordCard, sentenceCard];
    }

    return words.flatMap(createNotes);;
}

/** 
 * Find changes to replicate Book Terms to Anki Deck
 */
export async function ankiDifference() {
    /** 
     * @param {anki.NoteInfo[]} notes 
     * @returns {Map<string, ConnectNote>}
    */
    function indexNoteCollection(notes) {
        const index = new Map();
        for (const note of notes) {
            const widTag = note.tags.find(tag => tag.startsWith('lute3::wid::'));
            let wid = '';
            if (widTag) {
                wid = widTag.split('::')[2];
            }
            if (wid) {
                index.set(wid, note);
            }
        }
        return index;
    }

    const { pageCount, bookId, bookName } = extractBookProps(document);
    const words = await processBookWords(bookId, bookName, pageCount);
    const ankiNotes = await existingAnkiNotes();
    const nullFreeAnkiNotes = ankiNotes.filter(note => note !== null);
    const noteIndex = indexNoteCollection(nullFreeAnkiNotes);

    const NoteWordIds = new Set(noteIndex.keys());
    const bookWordIds = new Set(words.map(word => word.wid));

    const additionWids = bookWordIds.difference(NoteWordIds);
    const removalWids = NoteWordIds.difference(bookWordIds);

    const additionNotes = genBookScopedNotes({
        words: words.filter(word => additionWids.has(word.wid)),
        bookId,
        bookName,
    });

    const removalNotes = Array.from(noteIndex.entries()).filter(
        ([wid, _]) => removalWids.has(wid)
    ).map(([_, note]) => note);

    return {additionNotes, removalNotes};
}