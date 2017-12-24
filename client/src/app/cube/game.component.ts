import { AfterViewInit, Component, ElementRef, Input, ViewChild, HostListener } from '@angular/core';
import { RenderService } from './render.service';
import { Vector3 } from 'three';

@Component({
    moduleId: module.id,
    selector: 'app-game-component',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.css']
})

export class GameComponent implements AfterViewInit {

    @ViewChild('container')
    private containerRef: ElementRef;

    constructor(private renderService: RenderService) { }

    @HostListener('window:resize', ['$event'])
    public onResize() {
        this.renderService.onResize();
    }

    @HostListener('window:keydown', ['$event'])
    public onKeyDown(event: KeyboardEvent) {
        this.renderService.handleKeyDown(event);
    }

    @HostListener('window:keyup', ['$event'])
    public onKeyUp(event: KeyboardEvent) {
        this.renderService.handleKeyUp(event);
    }

    public ngAfterViewInit() {
        this.renderService.initialize(this.containerRef.nativeElement);
    }
}