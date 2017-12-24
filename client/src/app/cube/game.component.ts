import { AfterViewInit, Component, ElementRef, Input, ViewChild, HostListener } from '@angular/core';
import { RenderService } from './render.service';
import { Vector3 } from 'three';

const FORWARD_KEY = 'w';
const LEFT_KEY = 'a';
const RIGHT_KEY = 'd';

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
        switch (event.key.toLowerCase()) {
            case FORWARD_KEY:
                this.renderService.acceleratorPressed();
                break;
            case LEFT_KEY:
            // TODO: Turn left
            case RIGHT_KEY:
            // TODO: Turn left
            default:
                // Nothing to do.
                break;
        }
    }

    @HostListener('window:keyup', ['$event'])
    public onKeyUp(event: KeyboardEvent) {
        // TODO: determine behavior when a and d are pressed at the same time.
        switch (event.key.toLowerCase()) {
            case FORWARD_KEY:
                this.renderService.acceleratorReleased();
                break;
            case LEFT_KEY:
                // TODO: return steering wheel to 0.
                break;
            case RIGHT_KEY:
                // TODO: return steering wheel to 0.
                break;
            default:
                // Nothing to do.
                break;
        }
    }

    public ngAfterViewInit() {
        this.renderService.initialize(this.containerRef.nativeElement);
    }
}
