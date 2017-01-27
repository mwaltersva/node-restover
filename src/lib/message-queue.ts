import * as rp from 'request-promise'
import {RequestPromise} from 'request-promise';

import {PushoverRequest} from './pushover-request.interface';

const config = require('../../config.json');

export function messageLoop(messageQueue: Array<PushoverRequest>) {
    let shouldRun: boolean = true;
    let lastRun: number = new Date().getTime();
    let consecutiveErrors: number = 0;

    setInterval(async() => {
        /*
         Send messages if the time since the last send has been at least <config.sendInterval>
         Pushover asks that we don't abuse their API
         */
        let now: number = new Date().getTime();
        if (!shouldRun || now - lastRun < config.sendInterval || messageQueue.length === 0) return false;

        shouldRun = false;
        lastRun = now;

        try {
            let response = await processMessageQueue(messageQueue);
            console.log(response);
            shouldRun = true;
            consecutiveErrors = 0;
        } catch (err) {
            console.error(err);
            consecutiveErrors++;

            exitOnConsecutiveErrors(consecutiveErrors);

            if (err.statusCode >= 500) {
                messageQueue.unshift(err.options.body);
            }

            shouldRun = true;
        }
    }, config.loopInterval);
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
