import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

import {assert, expect, test} from 'vitest'
import {JSDOM} from 'jsdom';

import {
    extractReaderHTMLString,
    parsePageString,
    walkTree,
    structureNewBook,
    usedGlobals,
} from '../src/BookExtractor.js';
import { parse } from 'node:path';

function readFixture(filename) {
    const url = new URL(`./fixtures/${filename}`, import.meta.url);
    return readFileSync(fileURLToPath(url), 'utf-8');
}


const globalDOM = new JSDOM();

function patchGlobals(checkObjs) {
    for (const key of checkObjs) {
        if (!globalThis.hasOwnProperty(key)) {
            const domInterfaceObj = globalDOM.window[key];
            if (domInterfaceObj) {
                globalThis[key] = domInterfaceObj
            }
            else {
                throw new Error(`Can't find implementation for ${key}`);
            }
        }
    }
}



patchGlobals(usedGlobals);


test('extractReaderHTMLString', async () => {
    const htmltext = readFixture('read.html');
    const BookProps = extractReaderHTMLString(htmltext);
    const {bookName, bookId, pageCount, japaneseReading} = BookProps;

    expect(bookName).toEqual('Test Book Name');
    expect(bookId).toEqual('2');
    expect(pageCount).toEqual(2);
    expect(japaneseReading).toEqual(true);
});

test('parsePageString', async () => {

    const htmltext = readFixture('renderpage.html');
    const parseTree = parsePageString(htmltext);
    walkTree(parseTree, function(ParseResult) {
        assert(ParseResult);
        expect(ParseResult).toHaveProperty('value');
    })
});

test('structureNewBook', async () => {
    const {bookId, bookName, pageCount} = extractReaderHTMLString(readFixture('read.html'));
    const htmltext = readFixture('renderpage.html');
    const parseTree = parsePageString(htmltext);

    const book = structureNewBook(parseTree);

    console.log(book.uniqueTerms)

});