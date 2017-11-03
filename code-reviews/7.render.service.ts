import { Injectable } from '@angular/core';
import { CameraService } from './camera.service';
import { Player } from '../classes/player';
import { PlayerService } from '../services/player.service';
import { LevelsService } from '../services/levels.service';
import { Level } from '../classes/level';
import { ActivatedRoute } from '@angular/router';

const enum RINK {
    POS_X = -10,
    POS_Y = -20,
    POS_Z = 0,
    SCALE = 30,
}

const enum STONE {
    SCALE = 0.125,
    STONE_BLUE_POS_X = -3,
    STONE_BLUE_POS_Y = -18,
    STONE_BLUE_POS_Z = 60,

    ANGLE = -1.5708,

    POS_X = 10,
    POS_Y = -15,
    POS_Z = 420,
    BLUE = 0,
    RED = 1,
    DIST_COLISION_Z = 18
}

const enum CAMERA {
    FRONT_CAM_X = 3.5538288883916866,
    FRONT_CAM_Y = 120,
    FRONT_CAM_Z = 580,
}

const enum VIEWING {
    NEAR = 0,
    FAR = 30,
}

const enum POSITION {
    X = 800,
    Y = 370,
    POS_X = 200,
    POS_Y = 20,
}

const enum IMAGE {
    BLUE_POS = 40,
    RED_POS = 120,
}

const enum SPRITE {
    DISTANCE_STONE = 40,
}

@Injectable()
export class RenderService {
    private scene: THREE.Scene;
    private activeCamera: any;
    private renderer: THREE.Renderer;
    private material: THREE.MeshBasicMaterial;
    private isLaunch: boolean;
    private collisionDetect = false;
    private stoneStop = true;
    private _wf: boolean;

    private font: THREE.Font;
    private text: string;
    private textMaterial: THREE.MultiMaterial;
    private textGroup: THREE.Group;
    private fontLoader: THREE.FontLoader;
    private textMesh: THREE.Mesh;
    private fontName: string;

    private objectLoader: THREE.ObjectLoader;
    private materialArray: THREE.MeshBasicMaterial[] = [];
    private stoneKeeper: THREE.Object3D[] = [];
    private stoneInRink: THREE.Object3D[] = [];
    private activeStone: THREE.Object3D;
    private skyboxMaterial: THREE.MeshFaceMaterial;
    private skyboxGeom: THREE.CubeGeometry;
    private skybox: THREE.Mesh;

    private stoneColor = STONE.RED;
    private rad = 0.785398;

    /* HUD members */
    private context: CanvasRenderingContext2D;
    private hudTexture: THREE.Texture;
    private hudCanvas: HTMLCanvasElement;
    public sceneHUD: THREE.Scene;
    public cameraHUD: THREE.OrthographicCamera;

    player: Player;
    private levels: Level[] = [];
    private stoneBlue: THREE.Sprite[] = [];
    private stoneRed: THREE.Sprite[] = [];
    private tourNumberBlue: number = 0;
    private tourNumberRed: number = 0;

    constructor(private cameraService: CameraService, private playerService: PlayerService,
        private levelsService: LevelsService, private activatedRoute: ActivatedRoute) {
        this.getLevel();
    }

    public init(container: HTMLElement) {
        this.isLaunch = false;
        this.scene = new THREE.Scene();

        //by default the active camera is the front one
        this.activeCamera = this.cameraService.getFrontCamera();

        this.activeCamera.lookAt(this.scene.position);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        // Important : if not disabled, background will be rendered as background color (black)
        this.renderer['autoClear'] = false;

        this.renderer.setSize(window.innerWidth, window.innerHeight);

        let texloader = new THREE.TextureLoader();

        this.materialArray
            .push(new THREE.MeshBasicMaterial({ map: texloader.load('../assets/images/posx.jpg') }));
        this.materialArray
            .push(new THREE.MeshBasicMaterial({ map: texloader.load('../assets/images/negx.jpg') }));
        this.materialArray
            .push(new THREE.MeshBasicMaterial({ map: texloader.load('../assets/images/posy.jpg') }));
        this.materialArray
            .push(new THREE.MeshBasicMaterial({ map: texloader.load('../assets/images/negy.jpg') }));
        this.materialArray
            .push(new THREE.MeshBasicMaterial({ map: texloader.load('../assets/images/posz.jpg') }));
        this.materialArray
            .push(new THREE.MeshBasicMaterial({ map: texloader.load('../assets/images/negz.jpg') }));

        for (let i = 0; i < 6; i++) {
            this.materialArray[i].side = THREE.BackSide;
        }

        this.skyboxMaterial = new THREE.MeshFaceMaterial(this.materialArray);
        this.skyboxGeom = new THREE.CubeGeometry(5000, 5000, 5000, 1, 1, 1);
        this.skybox = new THREE.Mesh(this.skyboxGeom, this.skyboxMaterial);

        this.scene.add(this.skybox);

        // Load the font
        this.fontLoader = new THREE.FontLoader();
        this.textMaterial = new THREE.MultiMaterial([
            new THREE.MeshPhongMaterial({ shading: THREE.FlatShading }), // front
            new THREE.MeshPhongMaterial({ shading: THREE.SmoothShading })
        ]
        );
        this.textGroup = new THREE.Group();
        this.textGroup.position.y = 100;
        this.scene.add(this.textGroup);
        this.fontName = 'helvetiker_regular';
        this.objectLoader = new THREE.ObjectLoader();
        this.loadObject();
        this.initHUD();
        // Inser the canvas into the DOM
        //var container = document.getElementById("glContainer");
        if (container.getElementsByTagName('canvas').length === 0) {
            container.appendChild(this.renderer.domElement);
        }

        this.animate();

        // bind to window resizes
        window.addEventListener('resize', _ => this.onResize());
    }

    animate(): void {
        window.requestAnimationFrame(_ => this.animate());
        this.render();
    }


    onWindowResize() {
        let factor = 0.8;
        let newWidth: number = window.innerWidth * factor;
        let newHeight: number = window.innerHeight * factor;

        this.activeCamera.aspect = newWidth / newHeight;
        this.activeCamera.updateProjectionMatrix();

        this.renderer.setSize(newWidth, newHeight);
    }

    render(): void {
        this.clearRect();
        this.renderer.render(this.scene, this.activeCamera);
        let r: any = this.renderer;
        r.clearDepth();
        this.renderer.render(this.sceneHUD, this.cameraHUD);
    }

    toggleWireFrame(): void {
        this._wf = !this._wf;
        this.material.wireframe = this._wf;
        this.material.needsUpdate = true;
    }

    avancer(deltaT: number): void {//todo
    }

    onResize() {
        const width = window.innerWidth * 0.95;
        const height = window.innerHeight - 90;

        this.activeCamera.aspect = width / height;
        this.activeCamera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    /* This version loads the font each time, not efficient ! */
    slowCreateText() {
        this.fontLoader.load('/assets/fonts/helvetiker_regular.typeface.json', r => {
            this.scene.remove(this.textGroup);
            this.textGroup.remove(this.textMesh);
            this.font = new THREE.Font(r);
            let f = Object(r);

            let textGeo: THREE.TextGeometry = new THREE.TextGeometry(this.text, {
                font: f as THREE.Font,
                size: 20,
                height: 20,
                curveSegments: 4,
                bevelThickness: 2,
                bevelSize: 1.5,
                bevelEnabled: false
            });
            textGeo.computeBoundingBox();
            textGeo.computeVertexNormals();

            let centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
            this.textMesh = new THREE.Mesh(textGeo, this.textMaterial);
            this.textMesh.position.x = centerOffset;
            this.textMesh.position.y = 50;
            this.textMesh.position.z = 0;
            this.textMesh.rotation.x = 0;
            this.textMesh.rotation.y = Math.PI * 2;
            this.textGroup.add(this.textMesh);
            this.scene.add(this.textGroup);
        });
    }

    private refreshText(): void {
        this.slowCreateText();
    }

    public setText(newText: string): void {
        this.text = newText;
        this.refreshText();
    }

    public translateCamera(x: number, y: number, z: number): void {
        this.activeCamera.position.x += x === undefined ? 0 : x;
        this.activeCamera.position.y += y === undefined ? 0 : y;
        this.activeCamera.position.z += z === undefined ? 0 : z;
        this.activeCamera.updateProjectionMatrix();
    }

    public loadStone(url: string): void {
        this.objectLoader.load(url, obj => {
            obj.position.set(STONE.POS_X, STONE.POS_Y, STONE.POS_Z);
            obj.scale.set(STONE.SCALE, STONE.SCALE, STONE.SCALE);
            obj.rotateX(STONE.ANGLE);
            obj.name = url.substring(20, 21);

            this.stoneKeeper.push(obj);

            if (this.activeStone === undefined) {
                this.addStoneToScene();
            }
        });
    }

    public addStoneToScene(): void {
        this.stoneColor = (this.stoneColor === STONE.RED) ? STONE.BLUE : STONE.RED;
        let stoneClone = new THREE.Object3D;
        stoneClone = this.stoneKeeper[this.stoneColor].clone();
        this.stoneInRink.push(stoneClone);
        this.activeStone = stoneClone;

        this.scene.add(this.activeStone);
    }

    public loadObject(): void {
        this.objectLoader.load('/assets/models/json/rink.json', obj => {
            obj.position.set(RINK.POS_X, RINK.POS_Y, RINK.POS_Z);
            obj.scale.set(RINK.SCALE, RINK.SCALE, RINK.SCALE);

            this.scene.add(obj);
        });

        this.loadStone('/assets/models/json/blue_stone.json');
        this.loadStone('/assets/models/json/red_stone.json');
    }

    public changeView() {
        console.log('name',this.activeStone.name);
        if (this.activeCamera.type === 'PerspectiveCamera') {
            this.activeCamera = this.cameraService.getTopCamera();
        }
        else {
            this.activeCamera = this.cameraService.getFrontCamera();
        }
    }

    public launchStoneAnimate(speed: number) {
        this.stoneStop = false;
        this.isLaunch = true;
        let requestId = window.requestAnimationFrame(_ => this.launchStoneAnimate(speed));

        if (this.activeStone.position.z >= -340 && !this.collisionDetect) {
            this.activeStone.position.z--;
            this.collisionDetect = this.checkCollision();
            this.cameraFollowStone(this.activeStone);
        }
        else {
            //wait 3 secs before nextTour
            setTimeout(() => {
                this.nextTour();
            }, 3000);
            window.cancelAnimationFrame(requestId);
        }
    }

    public launchStone(speed: number) {
        if (this.stoneStop === true) {
            this.launchStoneAnimate(speed);
        }
    }

    public rotateStone() {
        //declared once at the top of your code
        let axis = new THREE.Vector3(0, 0, 1); //tilted a bit on x and y - feel free to plug your different axis here
        //in your update/draw function
        this.rad += this.rad;
        this.activeStone.rotateOnAxis(axis, this.rad);
    }

    backToinitialFrontCamPosition() {
        this.activeCamera.position.set(CAMERA.FRONT_CAM_X, CAMERA.FRONT_CAM_Y, CAMERA.FRONT_CAM_Z);
    }

    nextTour() {
        this.activeCamera = this.cameraService.getFrontCamera();
        this.backToinitialFrontCamPosition();
        this.activeCamera.lookAt(this.scene.position);
        this.addStoneToScene();
        this.stoneStop = true;
        this.isLaunch = false;
        this.collisionDetect = false;
        if(this.activeStone.name === 'r'){
            this.deleteSpriteBlue(this.tourNumberBlue);
            this.tourNumberBlue++;
        }
        else{
            this.deleteSpriteRed(this.tourNumberRed);
            this.tourNumberRed++
        }
    }

    cameraFollowStone(stone: THREE.Object3D) {
        if (this.activeCamera.type === 'PerspectiveCamera') {
            this.activeCamera.position.z = stone.position.z + 160;
        }
    }

    public moveStoneInX(mouseEvent: MouseEvent) {
        if (!this.isLaunch) {
            let windowHalfX = window.innerWidth / 2;
            if (-4 <= mouseEvent.clientX - windowHalfX && mouseEvent.clientX - windowHalfX <= 25) {
                this.activeStone.position.x = (mouseEvent.clientX - windowHalfX);
            }
        }
    }

    public findObstacles(currentStone: THREE.Object3D): THREE.Object3D {
        let closerStone: THREE.Object3D;
        for (let stone of this.stoneInRink) {
            if (currentStone !== stone
                && currentStone.position.z > stone.position.z) {
                closerStone = stone;
            }
        }
        return closerStone;
    }


    public propagateSpeedCollision(currentStone: THREE.Object3D) {
        let temp = this.findObstacles(currentStone);
        while (temp !== undefined) {
            let propagateSpeed = (70 * STONE.DIST_COLISION_Z) / 100;
            temp.position.z -= propagateSpeed;
            temp = this.findObstacles(currentStone);
        }
    }

    public collisionEffectSound() {
        let listener = new THREE.AudioListener();
        let sound = new THREE.PositionalAudio(listener);
        sound.load('/assets/effects/stoneHit.mp3');
        sound.autoplay = true;
    }

    public checkCollision(): boolean {
        let temp = this.findObstacles(this.activeStone);

        if (temp !== undefined) {
            if (this.activeStone.position.z - STONE.DIST_COLISION_Z <= temp.position.z &&
                (this.activeStone.position.x - STONE.DIST_COLISION_Z <= temp.position.x ||
                    this.activeStone.position.x + STONE.DIST_COLISION_Z <= temp.position.x)) {
                let propagateSpeed = (70 * STONE.DIST_COLISION_Z) / 100;
                temp.position.z -= propagateSpeed;
                //this.propagateSpeedCollision(this.activeStone);
                this.collisionEffectSound();
                return true;
            }
            return false;
        }
        return false;
    }

    initHUD() {
        this.hudCanvas = document.createElement('canvas');
        let width = window.innerWidth;
        let height = window.innerHeight;
        this.hudTexture = new THREE.Texture(this.hudCanvas);
        this.hudTexture.minFilter = THREE.LinearFilter;
        this.hudTexture.needsUpdate = true;
        this.hudCanvas.width = width;
        this.hudCanvas.height = height;

        this.context = this.hudCanvas.getContext('2d');
        this.context.clearRect(0, 0, width, height);
        this.context.font = "Normal 20px Arial";
        this.context.fillStyle = "rgba(245,245,245,0.2)";
        this.context.textAlign = 'center';
        this.context.fillText('Pointage', width / 2, height / 2);
        this.context.fillStyle = "#000000";
        this.hudTexture.needsUpdate = true;

        this.cameraHUD = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2,
            VIEWING.NEAR, VIEWING.FAR);
        this.sceneHUD = new THREE.Scene();

        let material = new THREE.MeshBasicMaterial({
            map: this.hudTexture,
            transparent: true
        });

        let planeGeometry = new THREE.PlaneGeometry(width, height);
        let plane = new THREE.Mesh(planeGeometry, material);
        material.needsUpdate = true;

        this.sceneHUD.add(plane);

        let i;
        for (i = 0; i < 7; i++) {
            let y = i * SPRITE.DISTANCE_STONE;
            this.loadSpriteBlue(y);
        }

        let j;
        for (j = 0; j < 7; j++) {
            let y = j * SPRITE.DISTANCE_STONE;
            this.loadSpriteRed(y);
        }
    }

    loadSpriteBlue(y: number): void {
        let tLoader = new THREE.TextureLoader();
        tLoader.load('../assets/images/stoneBlue.png', (texture: THREE.Texture) => {
            let blueStoneMaterial = new THREE.SpriteMaterial({ map: texture });
            let w = blueStoneMaterial.map.image.width;
            let h = blueStoneMaterial.map.image.height;
            let stone = new THREE.Sprite(blueStoneMaterial);
            stone.scale.set(w / 4, h / 4, 1);
            stone.position.set(-innerWidth / 2 + IMAGE.BLUE_POS, -innerHeight / 3 + y, 0);
            this.stoneBlue.push(stone);
            this.sceneHUD.add(this.stoneBlue[this.stoneBlue.length-1]);
        });
    }

    loadSpriteRed(y: number): void {
        let tLoader = new THREE.TextureLoader();
        tLoader.load('../assets/images/stoneRed.png', (texture: THREE.Texture) => {
            let redStoneMaterial = new THREE.SpriteMaterial({ map: texture });
            let w = redStoneMaterial.map.image.width;
            let h = redStoneMaterial.map.image.height;
            let stone = new THREE.Sprite(redStoneMaterial);
            stone.scale.set(w / 12, h / 12, 1);
            stone.position.set(innerWidth / 2 - IMAGE.RED_POS, -innerHeight / 3 + y, 0);
            this.stoneRed.push(stone);
            this.sceneHUD.add(this.stoneRed[this.stoneRed.length-1]);        
        });
    }

    deleteSpriteBlue(i : number): void {
            this.stoneBlue[i].visible = false;
    }
    deleteSpriteRed(i : number): void {
            this.stoneRed[i].visible = false;
    }

    getLevel(): void {
        this.levelsService.getLevel().then(levels => this.levels = levels);
    }


    splitUrl(stringToSplit: string, separator: string): string {
        let arrayOfStrings = stringToSplit.split(separator).reverse();
        return arrayOfStrings[0];
    }

    public clearRect() {
        if (this.context !== null) {
            let level = (this.levels[0] === undefined) ? "" : this.levels[0].name;
            let url = window.document.URL.toString();
            let name = this.splitUrl(url, "/");

            this.context.clearRect(0, 0, this.hudCanvas.width, this.hudCanvas.height);
            this.context.fillText('Joueur humain: ' + name, POSITION.POS_X, POSITION.POS_Y);
            this.context.fillText('Pointage', this.hudCanvas.width / 2, POSITION.POS_Y);
            this.context.fillText('0-0', this.hudCanvas.width / 2, 2 * POSITION.POS_Y);
            this.context.fillText('Manche en cours : 1', this.hudCanvas.width / 2, 3 * POSITION.POS_Y);
            this.context.fillText('Joueur virtuel: CPU ' + level, this.hudCanvas.width
            - POSITION.POS_X, POSITION.POS_Y);
            this.hudTexture.needsUpdate = true;
        }
    }

}
