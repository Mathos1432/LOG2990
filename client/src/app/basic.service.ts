import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import {Message} from '../../../commun/communication/message';

@Injectable()
export class BasicService {

  constructor(private http: Http) { }

  private url = 'http://localhost:3000/basic';

  public basicGet(): Promise<Message> {
    return this.http.get(this.url)
    .toPromise()
    .then(response => response.json() as Message)
    .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

}
