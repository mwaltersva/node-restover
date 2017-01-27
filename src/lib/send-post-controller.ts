import {Application, Request, Response, NextFunction} from 'express';
import {validateRequestBody} from './request-validation';
import {PushoverRequest} from './pushover-request.interface';

const config = require('../../config.json');

export function sendPostController(app: Application, req: Request, res: Response, next: NextFunction) {
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
