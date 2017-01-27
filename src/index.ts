import * as express from 'express';
import {Application, Request, Response, NextFunction} from 'express';
import * as helmet from 'helmet';
import * as bodyParser from 'body-parser';
import {sendPostController} from './lib/send-post-controller';
import {messageLoop} from './lib/message-queue';

const config = require('../config.json');

const app: Application = express();

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
