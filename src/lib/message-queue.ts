import * as rp from 'request-promise'
import {RequestPromise} from 'request-promise';

import {PushoverRequest} from './pushover-request.interface';

const config = require('../../config.json');

export function messageLoop(messageQueue: Array<PushoverRequest>) {
    let shouldRun: boolean = true;
    let lastRun: number = new Date().getTime();
    let consecutiveErrors: number = 0;

    setInterval(() => {
        let now: number = new Date().getTime();
        if (!shouldRun || now - lastRun < 5000 || messageQueue.length === 0) return false;

        shouldRun = false;
        lastRun = now;
        processMessageQueue(messageQueue)
            .then(result => {
                console.log(result);
                shouldRun = true;
                consecutiveErrors = 0;
            })
            .catch(err => {
                console.error(err);
                consecutiveErrors++;

                if (consecutiveErrors >= config.maxConsecutiveErrors) {
                    console.log('Max error limit hit, exiting');
                    process.exit(1);
                }

                if (err.statusCode >= 500) {
                    messageQueue.unshift(err.options.body);
                }

                shouldRun = true;
            })
    }, config.loopInterval);
}

export function processMessageQueue(messageQueue: Array<PushoverRequest>): Promise<Array<any>> {
    let messages: Array<PushoverRequest> = messageQueue.splice(0, config.maxMessagesToSend);

    let promises: Array<RequestPromise> = messages
        .map(message => {
            return sendMessage(message);
        });

    return Promise
        .all(promises);
}

export function sendMessage(msg: PushoverRequest): RequestPromise {
    return rp({
        method: 'POST',
        uri: 'https://api.pushover.net/1/messages.json',
        form: msg,
    });
}
