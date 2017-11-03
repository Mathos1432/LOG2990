import { Injectable } from '@angular/core';
import { Offside } from '../classes/offside';
import { Physics } from '../classes/physics';
import { GameAudio } from '../classes/audio';
import { ObjectLoader } from '../classes/objectLoader';
import { Score } from '../classes/score';
import { GameCelebration } from '../classes/gameCelebration';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

// const INTENSITY = 35;
// const DISTANCE = 15;
// const ANGLE = 0.78;
// const EXPONANT = 0.5;
// const DECAY = 1;
// const LIGHT = 0x0000;

const BLACK = 0x000000;
const RED = 0xFF0000;
//const GREEN = 0x00B133;
//const OFFSET_FIX = 6;
//const OFFSET_Z = 15;
const RADIUS = 4.51;
//Toutes les distances ont été prises dans les reglements officiels de curling canada
const DISTANCE_HOUSE_END = 160;
const DISTANCE_HOUSELINE_END = 100;
const DISTANCE_HOGLINE_END = 370;
// const DISTANCE_HACK_END = 30;
// const HOG_LINE_WIDTH = 3.33;
// const LINE_WIDTH = 0.75;
// const INNER_RING_SMALL_RADIUS = 7.5;
// const INNER_RING_RADIUS = 20;
// const OUTER_RING_SMALL_RADIUS = 40;
// const OUTER_RING_RADIUS = 60;
const ICE_LENGTH = 1380;
const ICE_WIDTH = 140;
// const ICE_HEIGHT = -3;

const NSTONE = 8;
const STONE_SCORING_COLOR = 0xb15507;

const MAX_LINE_ANGLE = 15 * (Math.PI / 180);
// const MOUSE_X_MULTIPLICATOR_FACTOR = -550;
// const DASHED_LINE_MAX_LENGTH = 300;

@Injectable()
export class RenderService {
    activeCamera: THREE.Camera;
    perspectiveCamera: THREE.Camera;
    orthographicCamera: THREE.Camera;
    scene: THREE.Scene;
    renderer: THREE.Renderer;

    gameAudio: GameAudio;
    offside: Offside;
    physics: Physics;
    score: Score;
    objectLoader: ObjectLoader;
    gameCelebration: GameCelebration;

    yellowStones: any[];
    redStones: any[];
    stonesOnIce: any[];
    movingStones: any[];

    currentStoneOnIce: any;
    mouse: any;
    direction: THREE.Vector3;
    posMouseOnIce: THREE.Vector3;
    rayCast: THREE.Raycaster;

    speed: number;
    spinVelocity: number;
    frictionCounter: number;
    spinCounter: number;
    nSet: number;
    dashSizeFactor: number;
    broomOffset: number;

    endTurn$: Observable<boolean>;
    private isEndTurn: Subject<boolean>;

    checkSweep: boolean;
    isRotating: boolean;
    isMoving: boolean;
    isOrthoView: boolean;
    isHit: boolean;
    isOnIce: boolean;
    isCelebration: boolean;
    isDoingFadeout: boolean;
    isSetThrow: boolean;
    isMaxDashLine: boolean;
    isBroomGoingLeft: boolean;
    isBroomMoving: boolean;
    broomTimeout: any;

    light: THREE.AmbientLight;
    spotlight: THREE.SpotLight;

    broomPos: THREE.Vector3;

    constructor() {
        this.isEndTurn = new Subject<boolean>();
        this.endTurn$ = this.isEndTurn.asObservable();
    }

    public init(): void {
        this.scene = new THREE.Scene();
        this.perspectiveCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
        // this.orthographicCamera = new THREE.OrthographicCamera(-750, 750, -250, 200, 470, - 10000)
        this.orthographicCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.activeCamera = this.perspectiveCamera;
        this.positionCamera(new THREE.Vector3(0, 50, -100));
        this.activeCamera.up = new THREE.Vector3(0, 10, 0);
        this.activeCamera.lookAt(new THREE.Vector3(0, 0, 100));
        this.mouse = new THREE.Vector2();
        this.rayCast = new THREE.Raycaster();


        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth * 0.95, window.innerHeight * 0.95);
        document.body.appendChild(this.renderer.domElement);

        this.light = new THREE.AmbientLight(0xFFFFFFF);
        this.light.position.set(0, 100, 100);
        this.scene.add(this.light);

        this.gameAudio = GameAudio.getInstance();
        this.offside = new Offside();
        this.physics = new Physics(ICE_LENGTH);
        this.score = new Score();
        this.objectLoader = new ObjectLoader();
        this.gameCelebration = new GameCelebration(this.scene);

        this.redStones = [];
        this.yellowStones = [];
        this.stonesOnIce = [];
        this.movingStones = [];

        this.speed = 1.5;
        this.frictionCounter = 0;
        this.spinCounter = 0;
        this.dashSizeFactor = 0;
        this.broomOffset = 0;
        this.isBroomGoingLeft = false;

        this.isMoving = false;
        this.isRotating = false;
        this.isHit = false;
        this.isOrthoView = false;
        this.isCelebration = false;
        this.checkSweep = false;

        this.isDoingFadeout = false;
        this.isSetThrow = false;

        this.spinVelocity = 0;
        this.direction = new THREE.Vector3(0, 0, 1);
        this.nSet = 0;
        this.broomPos = new THREE.Vector3();

        this.objectLoader.setStone(this.scene, this.yellowStones, this.redStones, NSTONE);
        this.objectLoader.createBroom(this.scene, new THREE.Vector3(0, 1000, 0)).then((s) => {
            this.objectLoader.changeBroomColor(this.scene, RED);
        });
        this.objectLoader.loadSkyBox(this.scene);
        this.objectLoader.loadIce(this.scene);
        this.objectLoader.createHack(this.scene);

        this.addLights();
        this.animate();

        window.addEventListener('mousemove', onmousemove => {
            if (this.isSetThrow) {
                this.onMouseMove(onmousemove);
            }
            else if (this.isMoving) {
                this.updateBroomPos(onmousemove);
            }
        });
        window.addEventListener('resize', _ => this.onResize());
    }

    public removeCanvas(): void {
        document.body.removeChild(this.renderer.domElement);
    }

    public addLights() {
        this.objectLoader.addSpotlight(new THREE.Vector3(-85, 60, 110), this.scene);
        this.objectLoader.addSpotlight(new THREE.Vector3(85, 60, 110), this.scene);
        for (let i = 0; i < 13; i++) {
            this.objectLoader.addSpotlight(new THREE.Vector3(0, 60, 100 + i * 100), this.scene);
        }
    }

    public onResize(): void {
        const width = window.innerWidth * 0.95;
        const height = window.innerHeight * 0.95;
        this.renderer.setSize(width, height);
    }

    public positionCamera(coordinates: THREE.Vector3) {
        this.activeCamera.position.set(coordinates.x, coordinates.y, coordinates.z);
    }

    public throwingStone(): void { // Pour partir le mouvement d'une pierre
        this.updateStoneParameters();
        this.isMoving = true;
        this.removeLights(this.stonesOnIce);
        if (this.objectLoader.dashedLine !== null) {
            this.scene.remove(this.objectLoader.dashedLine);
        }
    }

    public onMouseMove(event: any): void {
        if (this.isSetThrow) {
            this.mouse.x = ((event.clientX / window.innerWidth) * 2 - 1) * -550;
            this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            if (this.mouse.x < 1380 * Math.tan(MAX_LINE_ANGLE) && this.mouse.x > -1380 * Math.tan(MAX_LINE_ANGLE)) {
                this.mouse.y = 1380;
                if (ICE_WIDTH / 2 < Math.abs(this.mouse.x)) {
                    this.mouse.y = 1380 * ((ICE_WIDTH / 2) / Math.abs(this.mouse.x));
                    if (ICE_WIDTH / 2 < this.mouse.x) {
                        this.mouse.x = ICE_WIDTH / 2;
                    }
                    else {
                        this.mouse.x = ICE_WIDTH / 2 * -1;
                    }
                }
                else {
                    this.mouse.y = this.verifyStoneInTheWay(this.mouse.x);
                }
                this.posMouseOnIce = new THREE.Vector3(this.mouse.x, 0, this.mouse.y);
                this.objectLoader.addDashedLine(this.scene, this.posMouseOnIce);
            }
        }
    }

    public updateBroomPos(event: any) {
        this.broomPos = new THREE.Vector3((
            event.clientX - this.renderer.domElement.offsetLeft) / this.renderer.domElement.width * 2 - 1,
            -(event.clientY - this.renderer.domElement.offsetTop) / this.renderer.domElement.height * 2 + 1,
            0.5);
    }

    public broomOnMouse(): void {
        let mouse3D = this.broomPos.clone();
        mouse3D.unproject(this.activeCamera);
        mouse3D.sub(this.activeCamera.position);
        mouse3D.normalize();
        let rayCast = new THREE.Raycaster();
        rayCast.setFromCamera(mouse3D, this.activeCamera);
        let intersects = rayCast.intersectObject(this.scene, true);
        let position = new THREE.Vector3(0, 0, ICE_LENGTH - DISTANCE_HOUSE_END);
        if (intersects.length > 0) {
            position = new THREE.Vector3(-intersects[0].point.x, 0, intersects[0].point.z);
        }
        if (this.currentStoneOnIce.color === "red") {
            this.sweepBroom(position);
        }
    }

    public limitDashLineSideIce(mouseX: number, mouseY: number): number {
        let mouseXAbs = Math.abs(mouseX);
        if (ICE_WIDTH / 2 < mouseXAbs) {
            return mouseY * ((ICE_WIDTH / 2) / mouseXAbs);
        }
        else {
            return mouseY;
        }
    }

    updateDashLine() {
        if (this.dashSizeFactor > 100) {
            this.isMaxDashLine = false;
        }
        else if (this.dashSizeFactor <= 0) {
            this.isMaxDashLine = true;
        }
        if (this.isMaxDashLine) {
            ((this.objectLoader.dashedLine.material) as THREE.LineDashedMaterial).gapSize += 0.01;
            this.dashSizeFactor++;
        }
        else {
            ((this.objectLoader.dashedLine.material) as THREE.LineDashedMaterial).gapSize -= 0.01;
            this.dashSizeFactor--;
        }
    }

    public verifyStoneInTheWay(mouseX: number): number {
        let maxDistance = 1380;
        for (let stoneOnIce of this.stonesOnIce) {
            if (stoneOnIce.stone.position.z === 75) { //Evite la position initiale
                continue;
            }
            if (stoneOnIce.stone.position.x + stoneOnIce.radius > mouseX
                && stoneOnIce.stone.position.x - stoneOnIce.radius < mouseX) {
                if (stoneOnIce.stone.position.z < maxDistance) {
                    maxDistance = stoneOnIce.stone.position.z;
                }
            }
        }
        return maxDistance;
    }

    public moveStone(): void {
        if (this.currentStoneOnIce.color === "red") {
            this.broomOnMouse();
        }
        let self = this;
        if (this.movingStones.length === 0) {
            this.isMoving = false;
            this.isOnIce = false;
            this.isEndTurn.next(true);
            this.illuminateStones(this.score.getScoringStones(this.stonesOnIce));
        }
        else {
            for (let movingStone of this.movingStones) {
                if (movingStone.speed <= 0) {
                    movingStone.speed = 0;
                    movingStone.stoneThrown = false;
                    this.gameAudio.stopGlide();
                    if (this.offside.verifyHogLine(movingStone.stone.position.z, movingStone.radius)) {
                        if (movingStone.promiseCounter === 0) {
                            //Le promise counter empeche d'entrer dans la fonction plus d'une fois
                            movingStone.stoneThrown = false;
                            this.gameAudio.stopGlide();
                            let promise = this.offside.fadeoutPromise(movingStone);
                            promise.then(function (isDone) {
                                self.removeStone(movingStone);
                            });
                            movingStone.promiseCounter++;
                        }
                    }
                    else {
                        let indexMoving = this.movingStones.indexOf(movingStone);
                        this.movingStones.splice(indexMoving, 1);
                    }
                    continue;
                }
                movingStone.stone.position.x += movingStone.direction.x * movingStone.speed;
                movingStone.stone.position.y += movingStone.direction.y * movingStone.speed;
                movingStone.stone.position.z += movingStone.direction.z * movingStone.speed;

                if (movingStone.stoneThrown) {
                    this.gameAudio.playGlide(movingStone.speed);
                }

                movingStone.speed = this.physics.applyFriction(movingStone.speed, movingStone.stone.position);
                this.gameAudio.decreaseGlide(movingStone.speed);

                if (this.spinCounter % 1234 === 0) {
                    this.physics.spin(movingStone, this.spinVelocity);
                }
                if (this.offside.offsideMoving(movingStone)) {
                    if (movingStone.promiseCounter === 0) {
                        movingStone.stoneThrown = false;
                        this.gameAudio.stopGlide();
                        let promise1 = this.offside.fadeoutPromise(movingStone);
                        promise1.then(function (isDone) {
                            self.removeStone(movingStone);
                        });
                        movingStone.promiseCounter++;
                    }
                }
                for (let stoneOnIce of this.stonesOnIce) {
                    if (stoneOnIce === movingStone) {
                        continue;
                    }
                    if (this.physics.collision(movingStone, stoneOnIce)) {
                        this.gameAudio.playCollision(movingStone.speed);
                        let newSpeed = this.physics.getCollisionSpeed(movingStone.speed);
                        stoneOnIce.isHit = true;
                        stoneOnIce.speed = newSpeed;
                        movingStone.speed *= 0.1;
                        this.movingStones.push(stoneOnIce);
                    }
                }
                this.followCamera(movingStone);
            }
        }
    }

    public illuminateStones(winningStones: any) {
        if (winningStones !== null) {
            for (let stoneScoring of winningStones) {
                for (let i = 0; i < 3; i++) {
                    let mesh = (stoneScoring.stoneOnIce.stone.children[0].children[i] as THREE.Mesh);
                    (((mesh).material) as THREE.MeshPhongMaterial).emissive.setHex(STONE_SCORING_COLOR);
                }
            }
        }
    }

    public removeLights(stones: any) {
        if (stones !== null) {
            for (let stone of stones) {
                for (let i = 0; i < 3; i++) {
                    let mesh = (stone.stone.children[0].children[i] as THREE.Mesh);
                    (((mesh).material) as THREE.MeshPhongMaterial).emissive.setHex(BLACK);
                }
            }
        }
    }

    public followCamera(movingStone: any) {
        if (movingStone.stoneThrown && !this.isOrthoView) {
            this.positionCamera(new THREE.Vector3(
                this.activeCamera.position.x + movingStone.direction.x * movingStone.speed,
                this.activeCamera.position.y + movingStone.direction.y * movingStone.speed,
                this.activeCamera.position.z + movingStone.direction.z * movingStone.speed));
        }
    }

    public removeStone(movingStone: any) {
        if (movingStone.stoneThrown) {
            this.gameAudio.stopGlide();
        }
        let indexMoving1 = this.movingStones.indexOf(movingStone);
        this.movingStones.splice(indexMoving1, 1);
        let indexOnIce = this.stonesOnIce.indexOf(movingStone);
        this.stonesOnIce.splice(indexOnIce, 1);
    }

    public updateStoneParameters() {
        this.currentStoneOnIce.direction.x = this.direction.x;
        this.currentStoneOnIce.direction.y = this.direction.y;
        this.currentStoneOnIce.direction.z = this.direction.z;
        this.currentStoneOnIce.speed = this.speed;
        this.currentStoneOnIce.stoneThrown = true;
    }

    public reset(stones: any[], isYellow: boolean) {
        let z = 75;
        this.removeLights(stones);
        this.scene.getObjectByName("skybox").rotation.y += Math.PI / 2;
        for (let currentStone of stones) {
            if (isYellow) {
                currentStone.stone.position.x = -75;
            }
            else {
                currentStone.stone.position.x = 75; //Rouge
            }
            currentStone.stone.position.y = 0;
            currentStone.stone.position.z = z;
            currentStone.promiseCounter = 0;
            for (let i = 0; i < 3; i++) {
                (currentStone.stone.children[0].children[i] as THREE.Mesh).material.opacity = 1;
            }
            z = z + 10;
        }
        // this.positionCamera(new THREE.Vector3(0, 50, -100));
        this.isOnIce = false;
        this.movingStones.length = 0;
        this.stonesOnIce.length = 0;
    }

    public putStoneOnIce(isYellowTurn: boolean, indexRed: number, indexYellow: number): void {
        this.stopCelebration();
        this.positionCamera(new THREE.Vector3(0, 50, -75));
        this.isOrthoView = false;
        if (isYellowTurn) {
            this.scene.getObjectByName("broom").position.set(0, 1000, 0);
            this.currentStoneOnIce = this.yellowStones[indexYellow];
            this.currentStoneOnIce.stone.rotateZ(-Math.PI / 2);
        }
        else {
            this.currentStoneOnIce = this.redStones[indexRed];
        }
        this.currentStoneOnIce.stone.rotation.z = (Math.PI / 2);
        this.currentStoneOnIce.stone.position.set(0, 0, 75);
        this.currentStoneOnIce.stone.direction = new THREE.Vector3(0, 0, 1);
        this.movingStones.push(this.currentStoneOnIce);
        this.stonesOnIce.push(this.currentStoneOnIce);
        this.isOnIce = true;
    }

    public toggleCelebration() {
        if (this.isCelebration) {
            this.stopCelebration();
        }
        else {
            this.startCelebration();
        }
    }

    public stopCelebration(): void {
        this.isCelebration = false;
        this.gameCelebration.reset(this.redStones);
    }

    public startCelebration(): void {
        this.isCelebration = true;
        this.isOnIce = false;
        this.positionCamera(new THREE.Vector3(0, 50, ICE_LENGTH - DISTANCE_HOGLINE_END));
        this.activeCamera.lookAt(new THREE.Vector3(0, 0, ICE_LENGTH - DISTANCE_HOUSE_END));
    }

    public toggleOrthogonalCam(): void {
        if (this.isOrthoView) {
            this.isOrthoView = false;
        }
        else {
            this.isOrthoView = true;
        }
    }

    public toggleRotation(): void {
        if (this.isRotating) {
            this.removeRotation();
        }
        else {
            this.isRotating = true;
            this.spinVelocity = -0.5;
        }
    }

    public rotate(): void {
        this.currentStoneOnIce.stone.rotation.z += this.spinVelocity * Math.PI / 180;
    }

    public getMinSpeed(): number {
        let from = new THREE.Vector3(0, 0, 75);
        let target = new THREE.Vector3(0, 0, ICE_LENGTH - DISTANCE_HOGLINE_END);
        return this.physics.getMinSpeedToHit(target, from);
    }

    public getMaxSpeed(): number {
        let from = new THREE.Vector3(0, 0, 75);
        let target = new THREE.Vector3(0, 0, ICE_LENGTH - DISTANCE_HOUSELINE_END);
        return this.physics.getMinSpeedToHit(target, from);
    }

    public distanceToVector(start: THREE.Vector3, end: THREE.Vector3, point: THREE.Vector3): any {
        return Math.abs((end.z - start.z) * point.x - (end.x - start.x) * point.z + end.x * start.z - end.z * start.x) /
            Math.sqrt(Math.pow(end.z - start.z, 2) + Math.pow(end.x - start.x, 2));
    }

    public isValidSweep(broomPosition: THREE.Vector3): boolean {
        let isValidSweep = false;
        for (let i = 0; i < this.movingStones.length; i++) {
            let positionStone = this.movingStones[i].stone.position;
            let directionStone = this.movingStones[i].stone.direction;
            let distanceBroomMax = new THREE.Vector3(
                positionStone.x + 50 * directionStone.x,
                positionStone.y + 50 * directionStone.y,
                positionStone.z + 50 * directionStone.z);
            let distance = new THREE.Vector3(
                broomPosition.x - positionStone.x,
                broomPosition.y - positionStone.y,
                broomPosition.z - positionStone.z);
            let distanceSide = this.distanceToVector(positionStone, distanceBroomMax, broomPosition);
            let isCloseToStone = Math.abs(broomPosition.x) < distanceBroomMax.x || broomPosition.z < distanceBroomMax.z;
            let isBeforeBroom = Math.abs(distance.x) > 0 || distance.z > 0;
            isValidSweep = isCloseToStone && isBeforeBroom && (distanceSide <= 2 * RADIUS);
        }
        return isValidSweep;
    }

    public sweepBroom(position: THREE.Vector3) {
        let broomPosition = this.scene.getObjectByName("broom").position;
        this.checkSweep = this.objectLoader.checkIfCanSweep(this.scene, position);
        if (this.checkSweep) {
            if (this.isBroomMoving) {
                if (this.isValidSweep(broomPosition)) {
                    this.physics.reduceFriction(broomPosition, true);
                }
                if (this.isBroomGoingLeft) {
                    if (this.broomOffset >= 2 * RADIUS) {
                        this.isBroomMoving = false;
                        this.gameAudio.stopBroom();
                    }
                    else {
                        this.broomOffset += 0.3;
                        this.gameAudio.playBroom();
                    }
                }
                else {
                    this.broomOffset -= 0.3;
                    this.gameAudio.playBroom();
                    if (this.broomOffset <= 0) {
                        this.gameAudio.stopBroom();
                        this.isBroomMoving = false;
                    }
                }
            }
        }
        broomPosition.set(position.x + this.broomOffset, position.y, position.z);
    }

    public animate(): void {
        window.requestAnimationFrame(_ => this.animate());
        if (this.objectLoader.dashedLine !== undefined) {
            this.updateDashLine();
        }

        if (this.isOrthoView) {
            this.activeCamera = this.orthographicCamera;
            if (this.isMoving) {
                this.positionCamera(new THREE.Vector3(0, 470, ICE_LENGTH / 2));
                this.activeCamera.lookAt(new THREE.Vector3(0, 0, ICE_LENGTH / 2));
                this.activeCamera.rotateZ(-Math.PI / 2);
            }
            else {
                this.positionCamera(new THREE.Vector3(0, 150, ICE_LENGTH - DISTANCE_HOUSE_END - 30));
                this.activeCamera.lookAt(new THREE.Vector3(0, 0, ICE_LENGTH - DISTANCE_HOUSE_END - 30));
                this.activeCamera.rotateZ(Math.PI);
            }
        }
        else if (this.isOnIce) {
            this.activeCamera = this.perspectiveCamera;
            this.positionCamera(new THREE.Vector3(
                this.currentStoneOnIce.stone.position.x,
                50,
                this.currentStoneOnIce.stone.position.z - 100));
            this.activeCamera.lookAt(new THREE.Vector3(
                this.currentStoneOnIce.stone.position.x,
                this.currentStoneOnIce.stone.position.y + 10,
                this.currentStoneOnIce.stone.position.z + 50)); //Vue Plonge
        }
        else {
            this.activeCamera = this.perspectiveCamera;
        }

        if (this.isCelebration) {
            this.activeCamera = this.perspectiveCamera;
            this.gameCelebration.update();
            this.gameCelebration.jumpStone(this.redStones);
            this.gameAudio.playCelebration();
        }
        else {
            this.gameAudio.stopCelebration();
        }
        if (this.isMoving) {
            this.moveStone();
            if (this.isRotating) {
                this.rotate();
            }
        }
        this.render();
    }

    public render(): void {
        this.renderer.render(this.scene, this.activeCamera);
    }

    public resetStones(): void {
        let isYellow = true;
        this.reset(this.yellowStones, isYellow);
        this.reset(this.redStones, !isYellow);
    }

    public getStonesOnIce(): any[] {
        return this.stonesOnIce;
    }

    public removeRotation(): void {
        this.spinVelocity = 0;
        this.isRotating = false;
    }
}
