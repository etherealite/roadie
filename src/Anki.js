import {AnkiConnect} from './yomitan.js';

/**
 * @import * as anki from "./types/yomitan/anki"
 */

/**needed or above '@import' will be considered unused */
// @ts-ignore
let tsignore;

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