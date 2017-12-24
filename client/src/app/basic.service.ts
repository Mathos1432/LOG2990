import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { Message } from '../../../commun/communication/message';
const BASE_URL = 'http://localhost:3000/';

@Injectable()
export class BasicService {

    constructor(private http: Http) { }

    public basicGet(): Promise<Message> {
        return this.http.get(BASE_URL + "basic")
            .toPromise()
            .then(response => response.json() as Message)
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}
