import { registerComponents, createPageIndicator, createDrawerItem  } from './Components.js';
import {render} from 'lit-element';
import './style.css';

registerComponents();

const re = /\/read\/(\d+)/;
if (re.test(window.location.pathname)) {
    const host = 'http://127.0.0.1:8765';
    const deckName = 'lute3';
    const modelName = 'Basic (and reversed card)';
    // Backend.config.ankiConnect.host = host;
    // Backend.config.ankiConnect.deckName = deckName;
    // Backend.config.ankiConnect.modelName = modelName;

    // @ts-ignore
    window.roadie = {
    };

    
    window.addEventListener('load', onLoad);

}

function observeReaderDOM () {

    return {

    }
}


function onLoad () {
    const drawerMenuList = document
        .querySelector('#reading_menu > ul');
    const beforeItem = drawerMenuList.children?.[4];

    if (
        drawerMenuList instanceof HTMLElement &&
        beforeItem instanceof HTMLElement
    ) {
        render(createDrawerItem(), drawerMenuList,
            { renderBefore: beforeItem }
        );
    }


    const enableReplaceIndicator = true;
    /** rendering controls */
    const lutePageNum = document.querySelector('#page_num');
    const lutePageCount = document.querySelector('#page_count');
    const renderingControls = document.querySelector('#rendering_controls');

    /** ui elements */
    const luteNowReading = document.querySelector('.reading_header_page');
    const luteIndicator = document.querySelector('#page_indicator');

    const initPageNum = lutePageNum?.value ?? parseInt(lutePageNum.value);
    const maxPage = lutePageCount?.value ?? parseInt(lutePageCount.value);

    if(
        enableReplaceIndicator &&
        !isNaN(initPageNum) &&
        !isNaN(maxPage) &&
        luteNowReading instanceof HTMLElement &&
        luteIndicator instanceof HTMLElement &&
        typeof goto_relative_page === 'function'
    ) {

        function onPageTurn({next, current}) {
            const relative = next - current;
            goto_relative_page(relative);
        }

        const roadyIndicator = createPageIndicator({
            max: maxPage,
            current: initPageNum,
            onPageTurn: onPageTurn,
        });

        luteIndicator.style.display = 'none';
        render(roadyIndicator, luteNowReading);
    
        const renderObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) { 
                if (mutation.type === 'childList') {
                    if (!isNaN(lutePageNum.value)) {
                        const current = lutePageNum.value;
                        roadyIndicator.changeCurrent(current);
                    }
                }
              }
        });
        renderObserver.observe(renderingControls, {childList: true });

        const indicatorObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {  
                if (mutation.type === 'childList') {
                    const innerText = luteIndicator.innerText;
                    if (innerText && innerText.length) {
                        const [current, _] = luteIndicator.innerText.split('/');
                        roadyIndicator.changeCurrent(current);
                    }
                }
              }
        });
        indicatorObserver.observe(luteIndicator, {childList: true });
    }
    else if (enableReplaceIndicator) {
        throw new Error('Failed to steup page indicator');
    }


    const footerNextPage = document.querySelector('#footerNextPage');
    const footerMarkRestAsKnownNextPage = document.querySelector('#footerMarkRestAsKnownNextPage');
    if (
        footerNextPage instanceof HTMLElement &&
        footerMarkRestAsKnownNextPage instanceof HTMLElement
    ) {
        footerNextPage.style.setProperty('font-size', '2.5rem');
        footerMarkRestAsKnownNextPage.style.setProperty('font-size', '1.5rem');
    }
    else {
        throw new Error('Failed to increase footer nav buttons size');
    }
}


/**
 * Not using this yet, some of this code could be useful
 * in the future.
 * @deprecated
 */
function JishoIframeObserver() {
    const dictObserver = new MutationObserver((mutations) => {
        const srcMutation = mutations.find(mutation => {
            return mutation.type === 'attributes' && mutation.attributeName === 'src';
        });

        if (srcMutation) {
            srcMutation.target
        }
        
    })
    
    /**
     * @global
     */
    LookupButton;

    /** @type {string[] | null} */
    let termDicts;
    if (
        typeof LookupButton !== 'undefined' &&
        Object.hasOwn(LookupButton, 'TERM_DICTS') &&
        LookupButton.TERM_DICTS instanceof Array
    ) {
        termDicts = LookupButton.TERM_DICTS;
    }


    const dictFrames = document.querySelectorAll('#dictframes > iframe');
    if (termDicts !== null && dictFrames.length) {
        termDicts.forEach((urlTemplate, index) => {
            const cleanString = urlTemplate.replace('*http', 'http')
                .replace('###', 'word');
            if ((new URL(cleanString)).host === 'jisho.org') {
                dictObserver.observe(dictFrames[index], { attributes: true });
            }
        })
    }
    else {
        console.log(termDicts);
        console.log(dictFrames);
        console.error("can't attach jisho iframe mutation observer");
    }  
}