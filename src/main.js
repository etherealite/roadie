// import './style.css';
import * as backend from './backend.js';
// import { setupCounter } from './counter';
const re = /\/read\/(\d+)/;
if (re.test(window.location.pathname)) {
    const host = 'http://127.0.0.1:8765';
    const deckName = 'lute3';
    const modelName = 'Basic (and reversed card)';
    backend.config.ankiConnect.host = host;
    backend.config.ankiConnect.deckName = deckName;
    backend.config.ankiConnect.modelName = modelName;

    // @ts-ignore
    window.roadie = {
        ...backend
    };
}