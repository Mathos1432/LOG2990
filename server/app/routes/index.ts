import * as express from 'express';
import {Message} from '../../../commun/communication/message';

module Route {

    export class Index {

        public index(req: express.Request, res: express.Response, next: express.NextFunction) {
            const message = new Message();
            message.title = 'Hello';
            message.body = 'World';
            res.send(JSON.stringify(message));
        }
    }
}

export = Route;
