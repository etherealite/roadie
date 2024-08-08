import { LitElement, html, css } from "lit-element"
import { ref, createRef } from 'lit/directives/ref.js'
import { repeat } from 'lit/directives/repeat.js'
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    TableController,
  } from '@tanstack/lit-table'
import install from '@twind/with-web-components'
import config from './twind.config'


/**
 * @import * as litTable from '@tanstack/lit-table
 */

const withTwind = install(config);

class RoadyElement extends withTwind(LitElement) {}

export const createPageIndicator = ({current, max, onPageTurn}) => {
    const pageIndinator = new PageIndicator();
    pageIndinator.current = current;
    pageIndinator.next = current;
    pageIndinator.max = max;
    pageIndinator.onPageTurn = onPageTurn;
    return pageIndinator;
}

export class PageIndicator extends RoadyElement {
    static styles = css`
        :host {
            font-weight: 500;
            font-size: 1.1rem;
            box-sizing: border-box;
            color: var(--font-color, black)
            font: 100%/1.25 "Lucida Grande",Arial,sans-serif,STHeiti,"Arial Unicode MS",MingLiu;
            font-size: 0.9rem;
            text-wrap: nowrap;
        }
        input {
            font-weight: 500;
            font-size: 0.9rem;
            font-weight: 500;
            background-color: rgba(255, 255, 255, 0.3);
            border-radius: 5px;
            border-width: 1px;
            border-color: rgba(0, 0, 0, 0.5);
            padding: 0ch .2ch;
            background-blend-mode: lighten;
            color: var(--font-color, black);
            text-align: center;
            display: inline-block;
        }
        @media screen and (max-width: 980px) {
            input {
                font-size: 1.1rem;
            }
            :host {
                font-size: 1.1rem;
            }
        }
    `;

    static get properties() {
        return {
            max: { type: Number },
            current: { type: String },
            next: { type: String },
        }
    }

    constructor() {
        super();
        this.max = 0;
        this.next = '0';
        this.current = '0';
        this.onPageTurn = () => {};
    }

    onChange() {
        let nextInt = parseInt(this.next);
        /**
         * if we get a NaN just reset to current page 
         * and skip the callback.
        */
        if (isNaN(nextInt)) {
            this.next = this.current;
            return;
        }
        else if (nextInt > this.max) {
            nextInt = this.max;
        }
        else if(nextInt < 1) {
            nextInt = 1;
        }

        this.next = nextInt.toString();

        /** skip call back if no change would be made */
        if (nextInt === parseInt(this.current)) {
            return;
        }

        this.onPageTurn({
            next: parseInt(this.next),
            current: parseInt(this.current)
        });
    }

    /**
     * @param {Event} event
     */
    onBlur(event) {
        if (this.next === '') {
            this.next = this.current;
        }
        this.onChange();
    }

    /** @param {Event} event */
    onInput(event) { this.next = event.target.value; }

    /**
     * Prevent bubbling and 'submit' on enter.
     * @param {Event} event 
     */
    onKeyDown(event) {
        event.stopPropagation();
        if (event.key === 'Enter') {
            const input = this.inputRef.value;
            input.blur();
        }
    }

    onFocus(event) { this.next = ''; }

    changeCurrent(newCurrent) {
        this.current = newCurrent;
        this.next = newCurrent;
    }

    inputRef = createRef();
    render() {
        const inputWidth = this.max.toString().length;
        const input = html`<input 
            ${ref(this.inputRef)}
            @input=${this.onInput}
            @blur=${this.onBlur}
            @keydown=${this.onKeyDown}
            @change=${this.onChange}
            @focus=${this.onFocus}
            maxlength="${inputWidth}"
            style="width: ${inputWidth}ch;"
            .value=${this.next} 
        />`;

        return html`<div>
            ${input}/${this.max}
        </div>`;
    }
}


class Dialog extends RoadyElement {
    static styles = css``;

    static properties = {
        isOpen: { type: Boolean },
    }

    constructor() {
        super();
        this.isOpen = false;
    }

    render() {
        return html`
        <dialog ?open=${this.isOpen}>
            <slot></slot>
        </dialog>
        `;
    }
}


/**
 * @typedef {{
 * wid: string,
 * term: string,
 * parent: string,
 * translation: string
 * }} Term
 */

/** @type {Term[]} */
const data = [
    {
        wid: '1',
        term: 'hello',
        parent: 'world',
        translation: 'bonjour'
    },
    {
        wid: '2',
        term: 'world',
        parent: null,
        translation: 'monde'
    }
];

/**
 * @type {litTable.ColumnHelper<Term>}
 */
const columnHelper = createColumnHelper();

const columns = [
    columnHelper.display({
        id: 'select',
        header: ({table}) => html`
            <input
                type="checkbox"
            />`,
        cell: ({row}) => html`
            <input
                type="checkbox"
            />`,
    }),
    columnHelper.accessor('term', {
        header: 'Term',
        cell: row => row.term,
    })
];

/**
 * 
 * @see https://medium.com/@morkadosh/build-beautiful-accessible-tables-that-work-everywhere-with-lit-tanstack-table-and-twind-1275049d53a1
 *      for example litelment datatable implementation example.
 */

class TermTable extends RoadyElement {

}
export class ReaderStudyList extends LitElement {
    static styles = css``;

    static properties = {};

    constructor() {
        super();

    }

    renderTable() {
        return html`
            <table>
                <thead>
                    <tr>
                        <th><input type="checkbox"></th>
                        <th>
        `;
    }
    render() {
        return html`
            <roadie-dialog>
                <div>Study List</div>
                ${this.renderTable()}
            </roadie-dialog>
        `;
    }

}


export function createDrawerItem()  {

    function click(event) {
        event.preventDefault();
    }
    return html`
        <a @click=${click} class="reading-menu-item roadie-reading-menu-item" href="">
            Study List
        </a>
    `;
};

/**
 * Card Reviewer
 * 
 * @todo
 *   - make deck state stored in local storage so that
 *     it can be restored when the user returns to the page.
 * 
 */
class CardReviewer extends LitElement {
    static styles = css``;

    /**
     * Card is rated Again
     * 
     * insert card with bias toward the first third of the deck.
     */
    rateAgain() {}

    /**
     * Card is rated hard
     * 
     * insert card with bias toward the final third of the deck.
     */
    rateHard() {}

    /**
     * Card is rated good
     * 
     * remove the card from the deck
     */
    rateGood() {}


    render() {
        return html`<div>
            <div class="card-container">
                <slot></slot>
            </div>
            <div class="buttons">
                <button>Again</button>
                <button>Hard</button>
                <button>Good</button>
            </div>
        </div>`;
    }
}

export function registerComponents() {
    customElements.define("roadie-page-indicator", PageIndicator);
    customElements.define("roadie-dialog", Dialog);
    customElements.define("roadie-reader-study-list", ReaderStudyList);
}