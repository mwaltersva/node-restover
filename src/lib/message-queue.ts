import * as rp from 'request-promise'
import {RequestPromise} from 'request-promise';

import {PushoverRequest} from './pushover-request.interface';

const config = require('../../config.json');

interface LoopState {
    shouldRun: boolean;
    lastRun: number;
    consecutiveErrors: number;
    messageQueue: Array<PushoverRequest>;
}

export function messageLoop(messageQueue: Array<PushoverRequest>) {
    let state = {
        shouldRun: true,
        lastRun: new Date().getTime(),
        consecutiveErrors: 0,
        messageQueue
    };

    /*
     Start a loop that will process the message queue
     */
    setInterval(() => {
        return loopTick(state);
    }, config.loopInterval);
}

export async function loopTick(state: LoopState) {
    /*
     Send messages if the time since the last send has been at least <config.sendInterval>
     Pushover asks that we don't abuse their API
     */
    let now: number = new Date().getTime();
    if (!state.shouldRun || now - state.lastRun < config.sendInterval || state.messageQueue.length === 0) return false;

    state.shouldRun = false;
    state.lastRun = now;

    try {
        let response = await processMessageQueue(state.messageQueue);
        console.log(response);
        state.shouldRun = true;
        state.consecutiveErrors = 0;
    } catch (err) {
        console.error(err);
        state.consecutiveErrors++;

        exitOnConsecutiveErrors(state.consecutiveErrors);

        if (err.statusCode >= 500) {
            state.messageQueue.unshift(err.options.body);
        }

        state.shouldRun = true;
    }
}

export function processMessageQueue(messageQueue: Array<PushoverRequest>): Promise<Array<any>> {
    // Pushover asks that we don't abuse their API, so only process <config.maxMessagesToSend> at once
    let messages: Array<PushoverRequest> = messageQueue.splice(0, config.maxMessagesToSend);

    let promises: Array<RequestPromise> = messages
        .map(message => {
            return sendMessage(message);
        });

    return Promise
        .all(promises);
}

export function sendMessage(msg: PushoverRequest) {
    return rp({
        method: 'POST',
        uri: 'https://api.pushover.net/1/messages.json',
        form: msg,
    });
}

function exitOnConsecutiveErrors(consecutiveErrors: number) {
    // If we're receiving a ton of errors, lets just quit.
    if (consecutiveErrors >= config.maxConsecutiveErrors) {
        console.log('Max error limit hit, exiting');
        process.exit(1);
    }
}
