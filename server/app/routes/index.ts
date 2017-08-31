import * as express from 'express';
import {Message} from "../../../commun/communication/message"

module Route {

    export class Index {

        constructor() {
        }

        public index(req: express.Request, res: express.Response, next: express.NextFunction) {
            var message = new Message()
            message.title = "Hello";
            message.body = "World"
            res.send(JSON.stringify(message));
        }
    }
}

export = Route;
