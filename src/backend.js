import * as BookExtractor from './BookExtractor.js';
/**
 * @import * as backend from "./types/backend.js"
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

const luteRequestLimit = makeLimit(8);

/**
 * @param {string} bookid
 * @param {number} pageCount
 * @returns {Promise<string>[]}
 */
function fetchBookMarkup(bookid, pageCount) {
    /**
     * @param {any} pageNumber
     */
    async function fetchPage(pageNumber) {
        let url = `/read/renderpage/${bookid}/${pageNumber}`;
        return luteRequestLimit(async () => {
            return fetch(url).then(response => {
                return response.text();
            })
        })();
    }
    const pageNumbers = range(pageCount, 1);
    return pageNumbers.map(fetchPage);
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
    const entries = await Promise.all(wids.map(luteRequestLimit(fetchById)))
    return new Map(entries);
}

/**
 *
 * @param {string} bookid 
 * @param {string} bookName
 * @param {number} pageCount 
 * @returns {Promise<Word[]>}
 */
async function processBookWords(bookid, bookName, pageCount) {
    const pageMarkupPs = fetchBookMarkup(bookid, pageCount);
    const BookPages = ParseBookPage(bookName, pageMarkup);

    console.log(bookTree);
    // for (const node of walk(bookTree)) {
    //     console.log(node);
    // }

    // return;

    // const popupInfo = await fetchTermPopup(
    //     wordExtracts.map((extract) => extract.wid)
    // );
    // return wordExtracts.map((extract) => {
    //     const {wid, text, status, sentences} = extract;
    //     const sentence = sentences.values().next().value;
    //     const popup = popupInfo.get(wid);
    //     /** @type {Word} */
    //     return {wid, text, status, sentence, popup};
    // });
}


export {config } from './Anki.js';