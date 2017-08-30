import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { CubeComponent } from './cube/cube.component';

import {RenderService} from "./cube/render.service"

@NgModule({
  declarations: [
    AppComponent,
    CubeComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [RenderService],
  bootstrap: [AppComponent]
})
export class AppModule { }
