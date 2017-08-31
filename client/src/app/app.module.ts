import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { CubeComponent } from './cube/cube.component';

import {RenderService} from './cube/render.service';
import {BasicService} from './basic.service';


@NgModule({
  declarations: [
    AppComponent,
    CubeComponent
  ],
  imports: [
    BrowserModule,
    HttpModule
  ],
  providers: [
    RenderService,
    BasicService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
