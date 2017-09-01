import { AfterViewInit, Component, ElementRef, Input, ViewChild, HostListener } from '@angular/core';
import {RenderService} from './render.service';

@Component({
  moduleId: module.id,
  selector: 'app-cube-component',
  templateUrl: './cube.component.html',
  styleUrls: ['./cube.component.css']
})

export class CubeComponent implements AfterViewInit {

  constructor(private renderService: RenderService) {
  }

  private get container(): HTMLDivElement {
    return this.containerRef.nativeElement;
  }

  @ViewChild('container')
  private containerRef: ElementRef;

  @Input()
  public rotationSpeedX = 0.005;

  @Input()
  public rotationSpeedY = 0.01;

  @HostListener('window:resize', ['$event'])
  public onResize() {
    this.renderService.onResize();
  }

  public ngAfterViewInit() {
    this.renderService.initialize(this.container, this.rotationSpeedX, this.rotationSpeedY);
  }
}
