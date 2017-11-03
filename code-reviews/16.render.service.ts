import { Injectable } from '@angular/core';
import { WorldLoaderService } from '../services/world-loader.service';
import { GameService } from '../services/game.service';
import { MathFunctions } from '../math.functions';

@Injectable()
export class RenderService {
        cameraX = 600;
        cameraY = 300;
        cameraZ = 0;
        orthogonalHeight = 2000;

        renderDistance = 20000;
        objectsHidingPosition = new THREE.Vector3(6000, 0, 0);
        stoneAnimationEndDistance = -2000;
        stonesTotal = 10;
        PI = 3.14159265359;

        broomXOffset = 100;
        broomZOffset = 25;
        broomingZoneSize = 25;
        broomingSpeed = 0.3;

        snowfallSpeed = 2;
        snowResetHeight = -300;

        colorWhite = 0xffffff;
        colorBlack = 0x000000;

        dashedLineSpeed = 10;

        maxStoneSpeed = 1;
        speedMinimumThreshold = 0.3; //Pourcentage
        stoneRadius = 50;

        strengthBarWidth = 15;
        strengthBarHeight = 101;
        strengthBarBorderWidth = 1;
        strengthBarGrowthSpeed = 1;
        strengthBarXPosition = 50;
        strengthBarYPosition = (this.strengthBarHeight - this.strengthBarBorderWidth) / 2 - this.strengthBarBorderWidth;

    private throwTest = false;
    private perspectiveTest = true;

    private scene: THREE.Scene;
    private barScene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private barCamera: THREE.OrthographicCamera;
    private barMaterial: THREE.MeshBasicMaterial;

    private renderer: THREE.WebGLRenderer;
    private material: THREE.MeshBasicMaterial;
    private lineGeometry: THREE.Geometry;

    private windEffect = 0.1;

    private useAngle: boolean;
    private camX: number;
    private camY: number;
    private camZ: number;
    private _wf: boolean;
    private clock: THREE.Clock;
    private timeIncrement = 0;

    private objectLoader: THREE.ObjectLoader;
    private textureLoader: THREE.TextureLoader;
    private loadingDone: boolean;

    private isLit: boolean;

    private isCalculatingAngle = false;
    private throwAngle: number;
    private isChargingThrow = false;
    private throwIsStrongEnough = false;
    private throwing = false;
    private throwVector: THREE.Vector3;
    private mouseX: number;
    private mouseY: number;

    private mouseDown: boolean;
    private music: HTMLAudioElement;

    private stoneTranslationSpeed = 0;
    private stoneRotationSpeed: number;
    private stoneNumber: number;
    private allThrown: boolean;
    private created: THREE.Mesh[];

    private stoneList: THREE.Mesh[] = [];

    constructor(private worldLoader: WorldLoaderService, public gameService: GameService){}

    public init(container: HTMLElement) {
        let thisRenderServiceObject = this;
        THREE.DefaultLoadingManager.onLoad = function() {
            thisRenderServiceObject.loadingDone = true;
        };
        THREE.DefaultLoadingManager.onStart = function() {
            thisRenderServiceObject.loadingDone = false;
        };
        this.useAngle = false;
        this.clock = new THREE.Clock();
        this.textureLoader = new THREE.TextureLoader();

        this.renderer = new THREE.WebGLRenderer({ antialias: true, devicePixelRatio: window.devicePixelRatio });
        this.renderer.autoClear = false; //Permettre de render 2 scenes se chevauchant

        this.renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8, true);

        this.camX = this.cameraX;
        this.camY = this.cameraY;
        this.camZ = this.cameraZ;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, this.renderDistance);
        this.barCamera = new THREE.OrthographicCamera(-100, 100, -100, 100, 0, 600);

        this.scene = new THREE.Scene();
        this.barScene = new THREE.Scene();

        this.stoneRotationSpeed = 0.1;

        /*Add lights*/
        this.addLights();

        /*Add models*/
        this.worldLoader.init(this.scene);

        this.setCameraToPerspective();

        // Array to hold our created objects from the factory
        this.created = [];

        /** Load Stones */
        this.objectLoader = new THREE.ObjectLoader();
        this.stoneNumber = 0;
        this.allThrown = false;
        this.loadRedCurlingStones();

        /*Load broom*/
        this.loadBroom();

        /*Load bar*/
        this.loadStrengthBar();
        this.hideBar();

        /*Load Dashed Line*/
        this.loadDashedLine();

        // Inser the canvas into the DOM
        if (container.getElementsByTagName('canvas').length === 0) {
            container.appendChild(this.renderer.domElement);
        }
        this.clock.start();

        this.animate();

        // bind to window resizes
        window.addEventListener('resize', _ => this.onResize());

    }

    animate(): void {
        window.requestAnimationFrame(_ => this.animate());
        if (this.loadingDone){
        this.verifyCursorPosition();
        if (this.isCalculatingAngle) {
            this.showDashedLine();
            this.animateDashedLine();
            this.setStoneAngle();
        }
        else{
            this.hideDashedLine();
        }
        if ((this.throwing && !this.isCalculatingAngle)) {
            this.rotateStone();
            this.moveStone();
        }
        if (this.isChargingThrow){
            this.animateBar();
        }
        this.adjustCamera();
        this.animateSnow();
        this.animateBroom();
        this.render();
        }
    }

    onWindowResize() {
        let factor = 0.8;
        let newWidth: number = window.innerWidth * factor;
        let newHeight: number = window.innerHeight * factor;

        this.camera.aspect = newWidth / newHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(newWidth, newHeight);
    }

    render(): void {
        this.renderer.clear();
        this.renderer.render(this.barScene, this.barCamera);
        this.renderer.render(this.scene, this.camera);
    }

    toggleWireFrame(): void {
        this._wf = !this._wf;
        this.material.wireframe = this._wf;
        this.material.needsUpdate = true;
    }

    onResize() {
        const width = window.innerWidth * 0.95;
        const height = window.innerHeight - 90;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    public loadRedCurlingStones(): void {
        for (let i = 0; i < 10; i++){
            this.objectLoader.load('/assets/models/json/curlingStoneRed.json', obj => {
                obj.position.set(0, 20, 0);
                obj.scale.set(30, 30, 30);
                this.scene.add(obj);
                obj.name = "stone" + i;
                (obj as THREE.Mesh).material = new THREE.MeshPhongMaterial({
                    wireframe: false,
                    shininess: 0.2,
                });
            });
        }
    }

    public loadBroom(): void {
         this.objectLoader.load('/assets/models/json/broom.json', obj => {
            obj.position.copy(this.objectsHidingPosition);
            obj.scale.set(60, 60, 60);
            this.scene.add(obj);
            obj.name = "broom";
            (obj as THREE.Mesh).material = new THREE.MeshPhongMaterial({
                wireframe: false,
                shininess: 0.2,
             });
         });
    }

    public loadDashedLine(): void {
        let lineMaterial = new THREE.LineDashedMaterial({dashSize: 50, gapSize: 50, linewidth: 1});
        this.lineGeometry = new THREE.Geometry();
        this.lineGeometry.vertices.push(
            new THREE.Vector3(-2000, 10, 0),
            new THREE.Vector3(0, 10, 0),
        );
        this.lineGeometry.verticesNeedUpdate = true;
        this.lineGeometry.computeLineDistances();
        let dashedLine = new THREE.LineSegments( this.lineGeometry, lineMaterial);
        dashedLine.name = "dashedline";
        this.scene.add(dashedLine);
    }

    public loadStrengthBar(): void {
        let barPlaneGeometryBackground = new THREE.PlaneGeometry(this.strengthBarWidth, this.strengthBarHeight, 32);
        let barMaterialBackground = new THREE.MeshBasicMaterial( {color: this.colorBlack, side: THREE.DoubleSide} );
        let barPlaneBackground = new THREE.Mesh(barPlaneGeometryBackground, barMaterialBackground);
        barPlaneBackground.name = "strengthBarBackground";
        barPlaneBackground.position.setX(this.strengthBarXPosition);
        this.barScene.add(barPlaneBackground);

        let barPlaneGeometry = new THREE.PlaneGeometry(this.strengthBarWidth - this.strengthBarBorderWidth, 1, 32);
        this.barMaterial = new THREE.MeshBasicMaterial( {color: this.colorBlack, side: THREE.DoubleSide} );
        this.barMaterial.color.g = 1;
        let barPlane = new THREE.Mesh(barPlaneGeometry, this.barMaterial);
        barPlane.name = "strengthBar";
        barPlane.position.setX(this.strengthBarXPosition);
        barPlane.position.setY(this.strengthBarYPosition);
        this.barScene.add(barPlane);
    }

    public hideBar(): void {
        let barPlane = this.barScene.getObjectByName("strengthBar");
        let barPlaneBackground = this.barScene.getObjectByName("strengthBarBackground");
        barPlane.visible = false;
        barPlaneBackground.visible = false;
    }

    public showBar(): void {
        let barPlane = this.barScene.getObjectByName("strengthBar");
        let barPlaneBackground = this.barScene.getObjectByName("strengthBarBackground");
        barPlane.visible = true;
        barPlaneBackground.visible = true;
        this.resetStoneSpeed();
    }

    public animateBar(): void {
        let barPlane = this.barScene.getObjectByName("strengthBar");
        if (barPlane.position.y + barPlane.scale.y < this.strengthBarHeight - 2 * this.strengthBarBorderWidth){
            barPlane.scale.y += this.strengthBarGrowthSpeed;
            barPlane.position.y -= this.strengthBarGrowthSpeed / 2;
            this.barMaterial.color.r += this.strengthBarGrowthSpeed / 100;
            this.barMaterial.color.g -= this.strengthBarGrowthSpeed / 100;
            this.setStoneSpeed();
        }
    }

    public resetBar(): void {
        let barPlane = this.barScene.getObjectByName("strengthBar");
        barPlane.scale.y = 1;
        barPlane.position.setY(this.strengthBarYPosition);
        this.barMaterial.color = new THREE.Color(0x000000);
        this.barMaterial.color.g = 1;
    }

    public setStoneSpeed(): void {
        //La barre est a y = 50 au depart et y = 0 a la fin;
        let barPlane = this.barScene.getObjectByName("strengthBar");
        let barPercent = ((- barPlane.position.y + 50) * 2 ) / 100;
        this.stoneTranslationSpeed = this.maxStoneSpeed * barPercent;
        if (barPercent > this.speedMinimumThreshold){
            this.throwIsStrongEnough = true;
        }
        else {
            this.throwIsStrongEnough = false;
        }
    }

    public resetStoneSpeed(): void {
        this.stoneTranslationSpeed = 0;
    }

    public animateSnow(): void {
        for (let i = 0; i < this.worldLoader.snowFlakesCount; i++) {
            this.worldLoader.geometry.verticesNeedUpdate = true;
            this.worldLoader.geometry.vertices[i].set(
                this.worldLoader.geometry.vertices[i].x + this.windEffect,
                this.worldLoader.geometry.vertices[i].y - this.snowfallSpeed,
                this.worldLoader.geometry.vertices[i].z + this.windEffect
            );
                if (this.worldLoader.geometry.vertices[i].y < this.snowResetHeight) {
                    this.resetSnowParticle(i);
            }
            this.worldLoader.geometry.verticesNeedUpdate = true;
        }
    }

    private resetSnowParticle(particle: number): void {
        let posX = Math.random() * this.worldLoader.snowCubeDimension - this.worldLoader.snowCubeDimension / 2 ,
            posY = Math.random() * this.worldLoader.snowCubeDimension ,
            posZ = Math.random() * this.worldLoader.snowCubeDimension - this.worldLoader.snowCubeDimension / 2 ;
        this.worldLoader.geometry.vertices[particle].set(posX, posY, posZ);
    }

    public rotateStone(): void {
        if (!this.allThrown){
            let stone = this.scene.getObjectByName("stone" + this.stoneNumber);
            stone.rotateZ(this.stoneRotationSpeed * this.gameService.spinDirection);
        }
    }

    public moveStone(): void {
        if (!this.allThrown){
            let stone = this.scene.getObjectByName("stone" + this.stoneNumber);
            stone.position.x -= this.throwVector.x * this.stoneTranslationSpeed;
            stone.position.z -= this.throwVector.z * this.stoneTranslationSpeed;
            if (stone.position.x < this.stoneAnimationEndDistance || this.collisionTest(stone)) {
                this.throwTest = false;
                if (this.stoneNumber < this.stonesTotal - 1){
                    this.stoneList.push(stone as THREE.Mesh);
                    this.throwing = false;
                    this.gameService.throwing = false;
                    this.stoneNumber += 1;
                }
                else{
                    this.allThrown = true;
                }
                this.gameService.addPoints();
                this.hideBar();
                this.resetBar();
            }
        }
    }

    public collisionTest(obj: THREE.Object3D): boolean {
        let collided = false;
        let rays = [
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(1, 0, 1),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(1, 0, -1),
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(-1, 0, -1),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(-1, 0, 1)
        ];
        let ray = new THREE.Raycaster();
        for (let i = 0; i < rays.length; i++){
            ray.set(obj.position, rays[i]);
            let result = ray.intersectObjects(this.stoneList, true);
            if (result.length > 0 && result[0].distance <= this.stoneRadius) {
                collided = true;
                return collided;
            }
        }
        return collided;
    }

    public adjustCamera(): void {
        if (this.camera.position.y < this.orthogonalHeight){
            this.moveCameraToStone();
        }
    }

    public moveCameraToStone(): void {
        let stone = this.scene.getObjectByName("stone" + this.stoneNumber);
        this.camera.position.setX(stone.position.x + this.camX);
        this.camera.position.setZ(stone.position.z + this.camZ);
    }

    public setCameraToOrthogonal(): void {
        this.camera.position.set(-this.worldLoader.arenaSizeX / 3, this.orthogonalHeight, 0);
        this.camera.lookAt(new THREE.Vector3(- this.worldLoader.arenaSizeX / 3, 0, 0));
        this.camera.rotateZ(this.PI / 2);
    }

    public setCameraToPerspective(): void{
        this.camera.position.set(this.camX, this.camY, this.camZ);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    public addLights(): void{
        this.addLight('backlight', new THREE.Vector3(1, 0, 0));
        this.addLight('leftlight', new THREE.Vector3(0, 0, 1));
        this.addLight('rightlight', new THREE.Vector3(0, 0, -1));
        this.addLight('toplight', new THREE.Vector3(0, 1, 0));
        this.isLit = true;
    }

    private addLight(lightName: string, directionVector: THREE.Vector3): void {
        let light = new THREE.DirectionalLight(this.colorWhite);
        light.position.copy(directionVector);
        light.name = lightName;
        this.scene.add(light);
    }

    public removeLights(): void{
        this.scene.remove(this.scene.getObjectByName('backlight'));
        this.scene.remove(this.scene.getObjectByName('leftlight'));
        this.scene.remove(this.scene.getObjectByName('rightlight'));
        this.scene.remove(this.scene.getObjectByName('toplight'));
        this.isLit = false;
    }

    public playShootingStars(): void{
        this.music = new Audio();
        this.music.src = "../assets/sounds/Shooting_Stars.mp3";
        this.music.load();
        this.music.currentTime = 23;
        this.music.play();
    }

    public pauseMusic(): void{
        this.music.pause();
    }

    public handleMouseDown() {
        if (this.throwing){
            this.mouseDown = true;
            let stone = this.scene.getObjectByName('stone' + this.stoneNumber);
            this.scene.getObjectByName('broom').position.set(
               stone.position.x, stone.position.y, stone.position.z);
        }
    }

    public handleMouseUp() {
        this.mouseDown = false;
    }

    public handleMouseMove(event: MouseEvent){
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
    }

    public verifyCursorPosition(): void {
        if (this.cursorIsOnIce() && !this.throwing && !this.isChargingThrow){
            this.isCalculatingAngle = true;
            document.getElementsByTagName("body")[0].style.cursor = 'none';
        }
        else {
            this.isCalculatingAngle = false;
            document.getElementsByTagName("body")[0].style.cursor = 'default';
        }
    }

    public cursorIsOnIce(): boolean {
        let positionX = this.mouseXToWorldPositionX();
        if (positionX < this.worldLoader.arenaSizeZ && positionX > - this.worldLoader.arenaSizeZ){
            return true;
        }
        else{
            return false;
        }
    }

    public animateDashedLine(): void {
        this.computeLineEndPosition(this.mouseXToWorldPositionX());
    }

    public showDashedLine(): void {
        let line = this.scene.getObjectByName('dashedline');
        line.position.copy(new THREE.Vector3(0, 0 , 0));
    }

    public hideDashedLine(): void {
        let line = this.scene.getObjectByName('dashedline');
        line.position.copy(this.objectsHidingPosition);
    }

    private mouseXToWorldPositionX(): number {
        let x = - (this.mouseX - window.innerWidth / 2) * this.dashedLineSpeed;
        return x;
    }

    private computeLineEndPosition(position: number){
        this.lineGeometry.vertices[0].x = - (this.worldLoader.arenaSizeX / 2 - this.worldLoader.arenaXOffset);
        this.cropToAngle(this.PI / 6, position);
        this.cropEndPositionToIce();
        this.adjustLineToVisualOffset();
        this.setThrowAngle();
        this.lineGeometry.computeLineDistances();
        this.lineGeometry.verticesNeedUpdate = true;
    }

    private setThrowAngle(): void {
        this.throwAngle =
        MathFunctions.calculateLineAngle(this.lineGeometry.vertices[0].z, this.lineGeometry.vertices[0].x);
    }

    private cropToAngle(maxAngle: number, z: number): void {
        let angle = MathFunctions.calculateLineAngle(z, this.lineGeometry.vertices[0].x);
        if (angle > - maxAngle && angle < maxAngle){
            this.lineGeometry.vertices[0].z = z;
        }
        else if ( angle < - maxAngle){
            this.lineGeometry.vertices[0].z = Math.sin(-this.PI / 6) *
            Math.sqrt(Math.pow(this.lineGeometry.vertices[0].z, 2) + Math.pow(this.lineGeometry.vertices[0].x, 2));
        }
        else {
            this.lineGeometry.vertices[0].z = -Math.sin(-this.PI / 6) *
            Math.sqrt(Math.pow(this.lineGeometry.vertices[0].z, 2) + Math.pow(this.lineGeometry.vertices[0].x, 2));
        }
    }

    private adjustLineToVisualOffset(): void {
        let zPosition = this.lineGeometry.vertices[0].z;
        let xPosition = this.lineGeometry.vertices[0].x;
        if (zPosition > 0){
            zPosition -= 20;
        }
        else{
            zPosition += 20;
        }
        xPosition += 20;

        this.lineGeometry.vertices[0].z = zPosition;
        this.lineGeometry.vertices[0].x = xPosition;
    }

    private cropEndPositionToIce(): void {
        let opposite = this.lineGeometry.vertices[0].z;
        let adjacent = this.lineGeometry.vertices[0].x;
        let newOpposite;
        let newAdjacent;
        let iceEndAngle = this.getIceEndAngle();
        let angle = MathFunctions.calculateLineAngle(opposite, adjacent);
        if (angle > iceEndAngle){
            newOpposite = this.worldLoader.arenaSizeZ / 2;
            newAdjacent = (adjacent / opposite) * newOpposite;
        }
        else if (angle < -iceEndAngle){
            newOpposite = - this.worldLoader.arenaSizeZ / 2;
            newAdjacent = (adjacent / opposite) * newOpposite;
        }
        else if (angle < iceEndAngle && opposite > 0){
            newAdjacent = - (this.worldLoader.arenaSizeX / 2 - this.worldLoader.arenaXOffset) ;
            newOpposite = Math.abs((opposite / adjacent) * newAdjacent);
        }
        else{
            newAdjacent = - (this.worldLoader.arenaSizeX / 2 - this.worldLoader.arenaXOffset);
            newOpposite = (opposite / adjacent) * newAdjacent;
        }
        this.lineGeometry.vertices[0].z = newOpposite;
        this.lineGeometry.vertices[0].x = newAdjacent;
    }

    private getIceEndAngle(): number {
        let opposite = this.worldLoader.arenaSizeZ / 2;
        let adjacent = this.worldLoader.arenaSizeX / 2 - this.worldLoader.arenaXOffset;
        return MathFunctions.calculateLineAngle(opposite, adjacent);
    }

    public setStoneAngle(): void {
        let stone = this.scene.getObjectByName('stone' + this.stoneNumber);
        stone.rotation.z = this.throwAngle;
    }

    public animateBroom(): void {
        let stone = this.scene.getObjectByName('stone' + this.stoneNumber);
        let broom = this.scene.getObjectByName('broom');
        broom.rotation.z = this.PI / 2;
        if (this.mouseDown === true && this.throwing){
            broom.position.set(
                stone.position.x - this.broomXOffset,
                stone.position.y, stone.position.z + this.broomingZoneSize *
                Math.sin(this.timeIncrement * this.broomingSpeed) - this.broomZOffset
            );
            this.timeIncrement++;
        }
        else{
            broom.position.copy(this.objectsHidingPosition);
        }
    }

    public setThrowVector(): void {
        let stone = this.scene.getObjectByName('stone' + this.stoneNumber);
        let direction = stone.localToWorld(new THREE.Vector3(1, 0, 0));
        this.throwVector = direction;
    }

    public handleKeyUp(event: KeyboardEvent) {
        switch (event.key) {
            case " ":
            if (this.isChargingThrow && this.throwIsStrongEnough){
                this.isChargingThrow = false;
                //this.hideBar();
                //this.resetBar();
                this.setThrowVector();
                this.throwing = true;
                this.gameService.throwing = true;
            }
            else if (this.isChargingThrow && !this.throwIsStrongEnough){
                this.isChargingThrow = false;
                this.hideBar();
                this.resetBar();
            }
            break;
        }
    }

    public handleKeyDown(event: KeyboardEvent) {
        switch (event.key) {
            case "c":
                if (this.perspectiveTest) {
                    this.setCameraToOrthogonal();
                    this.perspectiveTest = false;
                }
                else {
                    this.setCameraToPerspective();
                    this.perspectiveTest = true;
                }
                break;
            case " ":
            if (!this.throwing && this.isCalculatingAngle){
                this.isChargingThrow = true;
                this.showBar();
                if (this.throwTest === false){
                    this.throwTest = true;
                }
            }
                break;
            case "l":
                if (this.isLit === true){
                   this.removeLights();
                   this.scene.fog.color.set(0x000000);
                   this.playShootingStars();
                }
                else{
                    this.addLights();
                    this.scene.fog.color.set(0xffffff);
                    this.pauseMusic();
                }
        }
    }
}
