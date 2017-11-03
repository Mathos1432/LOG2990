import { Injectable } from '@angular/core';
import { GestPhys } from '../classes/gestPhys';
import { Rock } from '../classes/rock';
import { RendererState } from '../classes/rendererState';
import { Rotation } from '../classes/rock';
import { Subject } from 'rxjs/Subject';

const BASE_URL = "/assets/models/";
const TEXTURE_BASE_URL = BASE_URL + "textures/";
const MODEL_BASE_URL = BASE_URL + "json/";

@Injectable()
export class RenderService {
    private scene: THREE.Scene;
    private cameraPers: THREE.PerspectiveCamera;
    private cameraOrtho: THREE.OrthographicCamera;
    private activeCam: THREE.Camera;

    private renderer: THREE.Renderer;
    private iceGeometry: THREE.BoxBufferGeometry;
    private iceMaterial: THREE.MeshPhongMaterial;
    private ice: THREE.Mesh;

    private houseGeometry: THREE.PlaneBufferGeometry;
    private houseMaterial: THREE.MeshBasicMaterial;
    private house: THREE.Mesh;
    public houseCenter: THREE.Vector3 = new THREE.Vector3(15, 0, 0.3);
    public houseRayon: number;

    private skybox: THREE.Mesh;

    private clock: THREE.Clock;
    private _dt: number;

    private objectLoader: THREE.ObjectLoader;
    private textureLoader: THREE.TextureLoader;

    private firstRock: THREE.Mesh;
    private rocksInGame: THREE.Mesh[] = [];
    private physRocks: Rock[] = [];
    public rockRadius: number;

    private state: RendererState = RendererState.Stop;
    public stateChange: Subject<RendererState> = new Subject<RendererState>();

    public stateCalStrength: Subject<number> = new Subject<number>();

    private gestPhys: GestPhys;

    private maxSpeed = 10;
    private actuSpeed = 0;

    private actuAngle = 0;
    private maxAngle = Math.PI / 6;

    private angleLine: THREE.Line;
    private angleLineGeo: THREE.Geometry;

    private mouse: THREE.Vector2;
    private rayCaster: THREE.Raycaster;

    private canFollowMouse: boolean;
    private isHumanTurn: boolean;

    private counter = 0;

    private tinVar = true;
    private orthoProj = true;

    public init(container: HTMLElement): void {
        //creation elements de base
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();

        this.renderer.setSize(window.innerWidth * 1 - 20, window.innerHeight * 1);

        //initialisation des caméras
        this.iniCam();

        //ajout de lumière
        this.createLights();

        this.angleLineGeo = new THREE.Geometry();
        this.angleLineGeo.vertices.push(new THREE.Vector3(-22, 0, 0.3));
        this.angleLineGeo.vertices.push(new THREE.Vector3(0, 0, 0.3));
        this.angleLineGeo.computeLineDistances();

        let material = new THREE.LineDashedMaterial({ color: 0xffaa00, dashSize: 1, gapSize: 1, linewidth: 1.5 });
        this.angleLine = new THREE.Line(this.angleLineGeo, material);
        this.scene.add(this.angleLine);
        this.angleLine.visible = false;

        this.loadStaticObjects();

        this.gestPhys = new GestPhys();

        this.loadDynamicObjects();

        this.mouse = new THREE.Vector2();
        this.rayCaster = new THREE.Raycaster();
        this.canFollowMouse = false;
        this.isHumanTurn = false;

        container.appendChild(this.renderer.domElement);


        this.clock.start();

        this.animate();

        //gérer les évènements
        this.renderer.domElement.addEventListener('mousemove', event => this.updateMousePosition(event));
    }

    private animate(): void {
        window.requestAnimationFrame(_ => this.animate());
        this._dt = this.clock.getDelta();

        this.gestAnim();

        //garde la skybox centrée sur la caméra
        this.skybox.position.set(
            this.activeCam.position.x,
            this.activeCam.position.y,
            this.activeCam.position.z
        );
        this.render();
    }

    private render(): void {
        this.renderer.render(this.scene, this.activeCam);
    }

    public print(): void {
        console.log(this);
    }


    public iniCam(): void {
        this.cameraPers = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.cameraOrtho = new THREE.OrthographicCamera(-25, 25, 25 * window.innerHeight / window.innerWidth,
            -25 * window.innerHeight / window.innerWidth, 0.1, 1000);

        this.translateCamera(this.cameraOrtho, 0, 0, 5);
        this.cameraOrtho.lookAt(new THREE.Vector3());

        this.translateCamera(this.cameraPers, -32, 0, 6);
        this.cameraPers.lookAt(this.houseCenter);
        this.rotateCamera(this.cameraPers, Math.PI / 2, 0, 0, -1);

        if (this.orthoProj) {
            this.activeCam = this.cameraOrtho;
        } else {
            this.activeCam = this.cameraPers;
        }
    }

    private animCamera(): void {

        let rockPlPro = this.firstRock.clone();
        rockPlPro.position.x = 30;
        this.rocksInGame.forEach((rockActu) => {
            if (rockActu.position.x < rockPlPro.position.x) {
                rockPlPro = rockActu;
            }
        });

        //animer camera perspective
        this.cameraPers.updateProjectionMatrix();
        this.cameraPers.updateMatrixWorld(true);
        this.cameraPers.matrixWorldInverse.getInverse(this.cameraPers.matrixWorld);
        let frustum = new THREE.Frustum();
        frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(this.cameraPers.projectionMatrix,
            this.cameraPers.matrixWorldInverse));
        if (frustum.containsPoint(rockPlPro.position)) {
            this.cameraPers.lookAt(new THREE.Vector3(this.cameraPers.position.x, this.cameraPers.position.y));
            this.translateCamera(this.cameraPers, 0.05);
            this.cameraPers.lookAt(this.houseCenter);
            this.rotateCamera(this.cameraPers, Math.PI / 2, 0, 0, -1);
            this.cameraPers.fov -= 0.05;
            this.cameraPers.updateProjectionMatrix();
        }

        //animer camera orthographique
        if (!(rockPlPro.position.x - 0.5 < this.cameraOrtho.left + 0.05)) {
            this.cameraOrtho.left += 0.05;
            let ratio = (this.cameraOrtho.right - this.cameraOrtho.left) / 2;
            this.cameraOrtho.top = ratio * window.innerHeight / window.innerWidth;
            this.cameraOrtho.bottom = -ratio * window.innerHeight / window.innerWidth;
            this.cameraOrtho.updateProjectionMatrix();
        }
    }

    private translateCamera(camera: THREE.Camera, x?: number, y?: number, z?: number): void {
        if (x) { camera.translateX(x); }
        if (y) { camera.translateY(y); }
        if (z) { camera.translateZ(z); }
        camera.updateMatrix();
    }

    private rotateCamera(camera: THREE.Camera, angle: number, x: number, y: number, z: number): void {
        camera.rotateOnAxis(new THREE.Vector3(x, y, z), angle);
        camera.updateMatrix();
    }

    private createLights(): void {
        this.scene.add(new THREE.AmbientLight(0x606060));

        let dirLight = new THREE.DirectionalLight(0xeeeeee, 0.5);
        dirLight.position.set(0, 0, 1);
        this.scene.add(dirLight);

        let spotLight1 = new THREE.SpotLight(0xffffff, 1, 15, 0.6);
        spotLight1.position.set(0, 0, 10);

        let spotLight2 = new THREE.SpotLight(0xffffff, 1, 15, 0.6);
        spotLight2.position.set(-15, 0, 10);
        spotLight2.target.position.set(-15, 0, 0);

        let spotLight3 = new THREE.SpotLight(0xffffff, 1, 15, 0.6);
        spotLight3.position.set(15, 0, 10);
        spotLight3.target.position.set(15, 0, 0);

        this.scene.add(spotLight1);
        this.scene.add(spotLight2); this.scene.add(spotLight2.target);
        this.scene.add(spotLight3); this.scene.add(spotLight3.target);
    }

    private loadStaticObjects(): void {

        this.textureLoader = new THREE.TextureLoader();

        //load ice
        this.textureLoader.load(TEXTURE_BASE_URL + "iceTexture.jpg", tex => {
            this.iceGeometry = new THREE.BoxBufferGeometry(47.7, 5, 0.2);
            this.iceMaterial = new THREE.MeshPhongMaterial({ map: tex, shininess: 1.0 });
            this.ice = new THREE.Mesh(this.iceGeometry, this.iceMaterial);
            this.scene.add(this.ice);
            console.log('house : ' + this.ice);
        });

        //load house
        this.textureLoader.load(TEXTURE_BASE_URL + "houseCurling.png", tex => {
            this.houseGeometry = new THREE.PlaneBufferGeometry(3.82, 3.82);
            this.houseRayon = 3.82 / 2;
            this.houseMaterial = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
            this.house = new THREE.Mesh(this.houseGeometry, this.houseMaterial);
            this.house.position.set(this.houseCenter.x, this.houseCenter.y, this.houseCenter.z);
            this.scene.add(this.house);
        });

        //load skybox
        let skyboxTextures = [
            new THREE.MeshBasicMaterial({ map: this.textureLoader.load(TEXTURE_BASE_URL + "skybox/Snow2048_bk.jpg") }),
            new THREE.MeshBasicMaterial({ map: this.textureLoader.load(TEXTURE_BASE_URL + "skybox/Snow2048_ft.jpg") }),
            new THREE.MeshBasicMaterial({ map: this.textureLoader.load(TEXTURE_BASE_URL + "skybox/Snow2048_rt.jpg") }),
            new THREE.MeshBasicMaterial({ map: this.textureLoader.load(TEXTURE_BASE_URL + "skybox/Snow2048_lf.jpg") }),
            new THREE.MeshBasicMaterial({ map: this.textureLoader.load(TEXTURE_BASE_URL + "skybox/Snow2048_up.jpg") }),
            new THREE.MeshBasicMaterial({ map: this.textureLoader.load(TEXTURE_BASE_URL + "skybox/Snow2048_dn.jpg") })
        ];
        let skyboxMaterial = new THREE.MultiMaterial(skyboxTextures);
        let skyboxGeometry = new THREE.BoxBufferGeometry(1000, 1000, 1000);
        this.skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        this.skybox.scale.set(-1, 1, 1); //met les textures à l'intérieur
        this.scene.add(this.skybox);
    }

    private loadDynamicObjects(): void {

        this.objectLoader = new THREE.ObjectLoader();

        this.objectLoader.load(MODEL_BASE_URL + "curlingRock.js", (obj) => {
            this.firstRock = new THREE.Mesh();
            obj.scale.set(0.2, 0.2, 0.2);
            obj.translateX(-22);
            obj.translateZ(0.5);
            obj.rotateX(Math.PI / 2);
            (obj as THREE.Mesh).material = new THREE.MeshPhongMaterial({
                wireframe: false,
                shininess: 1.0
            });
            this.firstRock = obj as THREE.Mesh;
            let box = new THREE.Box3().setFromObject(this.firstRock);
            this.rockRadius = (box.max.x - box.min.x) / 2;
        });
    }

    public changePerspective(): void {
        if (this.orthoProj) {
            this.activeCam = this.cameraPers;
            this.orthoProj = false;
        } else {
            this.activeCam = this.cameraOrtho;
            this.orthoProj = true;
        }
    }

    public startHumanTurn(): void {
        this.isHumanTurn = true;
    }

    public startAITurn() {
        this.isHumanTurn = false;
    }

    public addRock(sensRotation: Rotation): void {

        if (this.state === RendererState.Stop) {
            this.iniCam();
            this.actuSpeed = 0;
            this.actuAngle = 0;
            let rock = this.firstRock.clone();
            rock.geometry.center();
            this.physRocks.push(new Rock(new THREE.Vector3(), sensRotation, rock.position));
            this.gestPhys.addRock(this.physRocks[this.physRocks.length - 1]);
            this.rocksInGame.push(rock);
            this.scene.add(this.rocksInGame[this.rocksInGame.length - 1]);
            this.angleLine.visible = true;
            document.getElementById("container").style.cursor = "none";
            this.changeState(RendererState.CalAngle);
        }
    }

    private calLineP(): void {
        let posXCloser = 44.5;
        let posYCloser;
        if (this.actuAngle > 0.06 || this.actuAngle < -0.06) {
            if (this.actuAngle > 0.06) {
                posYCloser = 2.5;
                posXCloser = posYCloser / Math.tan(this.actuAngle);
            } else {
                posYCloser = -2.5;
                posXCloser = posYCloser / Math.tan(this.actuAngle);
            }
        } else {
            posYCloser = posXCloser * Math.tan(this.actuAngle);
        }
        this.physRocks.forEach((rock, index) => {
            if (index !== this.physRocks.length - 1) {
                let distX = rock.getPosition().x + 22;
                let distY = rock.getPosition().y;
                let distYLine = Math.tan(this.actuAngle) * distX;
                if (distYLine > distY - 0.4 && distYLine < distY + 0.4) {
                    posXCloser = distX;
                    posYCloser = posXCloser * Math.tan(this.actuAngle);
                }
            }
        });
        this.angleLineGeo.vertices[0] = new THREE.Vector3(-22, 0, 0.3);
        this.angleLineGeo.vertices[1] = new THREE.Vector3(posXCloser - 22, posYCloser, 0.3);
        this.angleLineGeo.verticesNeedUpdate = true;
    }

    //anciennement calculerAngle
    updateMousePosition(event: MouseEvent) {
        if (this.isHumanTurn && this.state === RendererState.CalAngle) {
            let client = this.renderer.domElement.getBoundingClientRect();
            let posx = (event.clientX - client.left)
                / (client.right - client.left);
            let posy = (event.clientY - client.top)
                / (client.bottom - client.top);
            this.mouse.set(posx * 2 - 1, -posy * 2 + 1);

            this.moveLineTo(this.mouse);
        }
    }

    private moveLineTo(pos: THREE.Vector2): void {
        this.rayCaster.setFromCamera(pos, this.activeCam);
        let intersection = this.rayCaster.intersectObject(this.ice);
        if (intersection.length > 0) {
            this.setAngleTo((intersection[0].point.y / 2.5) * this.maxAngle);
            this.calLineP();
        }
    }

    public setAngleTo(newAngle: number): void {
        this.actuAngle = newAngle;
    }

    public calStrength(): void {
        if (this.state === RendererState.CalAngle) {
            this.changeState(RendererState.CalStrength);
        }
    }

    public setStrengthTo(newForce: number): void {
        if (!(this.actuSpeed >= this.maxSpeed)) {
            this.actuSpeed = newForce;
        }
        else {
            this.actuSpeed = this.maxSpeed;
        }
    }

    throwRock() {
        if (this.state === RendererState.CalStrength) {
            this.stateCalStrength.next(-1.0);
            if (this.actuSpeed > 5) {
                let speX = this.actuSpeed * Math.cos(this.actuAngle);
                let speY = this.actuSpeed * Math.sin(this.actuAngle);
                let vecspeesse = new THREE.Vector3(speX, speY);
                this.physRocks[this.physRocks.length - 1].setSpeed(vecspeesse);
                this.angleLine.visible = false;
                document.getElementById("container").style.cursor = "";
                this.changeState(RendererState.CalPhys);
            }
            else {
                this.actuSpeed = 0;
                this.actuAngle = 0;
                this.changeState(RendererState.CalAngle);
            }
        }
    }

    private gestAnim() {
        switch (this.state) {

            case RendererState.Stop:
                break;

            case RendererState.CalAngle:
                if (this.tinVar) {
                    if (this.counter > 2) {
                        this.angleLineGeo.vertices[0] = new THREE.Vector3(-21, Math.tan(this.actuAngle), 0.1);
                        this.angleLineGeo.verticesNeedUpdate = true;
                        this.tinVar = false;
                        this.counter = 0;
                    } else {
                        this.counter++;
                    }
                } else {
                    if (this.counter > 2) {
                        this.angleLineGeo.vertices[0] = new THREE.Vector3(-22, 0, 0.1);
                        this.angleLineGeo.verticesNeedUpdate = true;
                        this.tinVar = true;
                        this.counter = 0;
                    } else {
                        this.counter++;
                    }
                }
                break;

            case RendererState.CalStrength:
                if (this.isHumanTurn) {
                    let force = this.actuSpeed + this.maxSpeed * this._dt / 3;
                    this.setStrengthTo(force);
                    this.stateCalStrength.next(this.actuSpeed / this.maxSpeed * 100);
                }
                break;

            case RendererState.CalPhys:
                this.animCamera();
                if (!this.gestPhys.avancer(this._dt)) {
                    this.changeState(RendererState.Stop);
                }
                if (this.physRocks[this.rocksInGame.length - 1].getRotation() === Rotation.Clockwise) {
                    this.rocksInGame[this.rocksInGame.length - 1].rotateY(-Math.PI / 2 * this._dt);
                } else {
                    this.rocksInGame[this.rocksInGame.length - 1].rotateY(Math.PI / 2 * this._dt);
                }

        }
    }

    public removeRocksInGame(): void {
        this.rocksInGame.forEach((rock) => {
            this.scene.remove(rock);
        });
        if (this.gestPhys) {
            this.gestPhys.removeRocks();
        }
        this.physRocks = [];
        this.rocksInGame = [];
    }

    public getLastRock() {
        return this.physRocks[this.rocksInGame.length - 1];
    }

    private changeState(newState: RendererState): void {
        this.state = newState;
        this.stateChange.next(this.state);
    }

}
