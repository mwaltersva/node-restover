import * as express from 'express';
import {Application, Request, Response, NextFunction} from 'express';
import * as helmet from 'helmet';
import * as bodyParser from 'body-parser';
import * as rp from 'request-promise';
import {RequestPromise} from 'request-promise';
import * as Promise from 'bluebird';

import {validateRequestBody} from './lib/request-validation';
import {PushoverRequest} from './lib/pushover-request.interface';

let config = require('../config.json');

let app: Application = express();

app.use(helmet());
app.use(bodyParser.json());

app.locals.messageQueue = [];

app.post('/send', (req: Request, res: Response, next: NextFunction) => {
    sendPostController(app, req, res, next);
});

app.use((err) => {
    console.error(err);
});

messageLoop(app.locals.messageQueue);
app.listen(config.port);

function sendPostController(app: Application, req: Request, res: Response, next: NextFunction) {
    if (!validateRequestBody(req.body)) {
        res.status(400);
        res.send({
            success: false,
            message: 'Malformed request body. must be: { token: string, user: string, message: string }'
        });
        return next(new Error('Malformed request body: ' + JSON.stringify(req.body)));
    }

    let body: PushoverRequest = {
        token: config.token,
        user: config.user,
        message: req.body.message,
        device: req.body.device,
        title: req.body.title,
        url: req.body.url,
        url_title: req.body.url_title,
        priority: req.body.priority,
        timestamp: req.body.timestamp,
        sound: req.body.sound
    };

    app.locals.messageQueue.push(body);

    return res.send({
        success: true,
        message: 'Your notification has been queued'
    });
}

function messageLoop(messageQueue: Array<PushoverRequest>) {
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

function processMessageQueue(messageQueue: Array<PushoverRequest>): Promise<Array<any>> {
    let messages: Array<PushoverRequest> = messageQueue.splice(0, config.maxMessagesToSend);

    let promises: Array<RequestPromise> = messages
        .map(message => {
            return sendMessage(message);
        });

    return Promise
        .all(promises);
}

function sendMessage(msg: PushoverRequest): RequestPromise {
    return rp({
        method: 'POST',
        uri: 'https://api.pushover.net/1/messages.json',
        form: msg,
    });
}
