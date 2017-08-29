import * as express from 'express';

module Route {

    export class Index {

        constructor() {
        }

        public index(req: express.Request, res: express.Response, next: express.NextFunction) {
            res.send('Hello world');
        }
    }
}

export = Route;
