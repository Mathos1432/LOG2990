import * as express from "express";
import {Message} from "../../../commun/communication/message";
import "reflect-metadata";
import { injectable, } from "inversify";

module Route {
    @injectable()
    export class Index {

        public helloWorld(req: express.Request, res: express.Response, next: express.NextFunction) {
            const message = new Message();
            message.title = "Hello";
            message.body = "World";
            res.send(JSON.stringify(message));
        }
    }
}

export = Route;
