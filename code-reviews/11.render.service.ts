import { Injectable } from '@angular/core';
//import { ObjectCreaterService } from './object-creater.service';
//import { NgModule } from '@angular/core';
//import { BrowserModule } from '@angular/platform-browser';
//import { HttpModule } from '@angular/http';
//import { PhysicsService } from './physics.service';

const LIMITZ = -550;
enum limit {
    x = 100,
    y = 580
}

interface Textconfig {
    text: string;
    font: string;
    size: string;
    police: string;
    align: string;
    red: string;
    green: string;
    blue: string;
    alpha: string;
    x: number;
    y: number;
}

@Injectable()
export class RenderService {

    private scene: THREE.Scene = new THREE.Scene();
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private geometry: THREE.Geometry;
    private material: THREE.MeshBasicMaterial;
    private mesh: THREE.Mesh;

    private headUpScene: THREE.Scene;
    private headUpCamera: THREE.OrthographicCamera;
    private headUpCanvas: any;
    private headerCanvas: any;
    private scoreCanvas: any;
    private machineCanvas: any;
    private playerCanvas: any;



    private useAngle: boolean;
    private camX: number;
    private camY: number;
    private camZ: number;
    private wf: boolean;
    private clock: THREE.Clock;
    private dt: number;
    private initialPisitionCamera: boolean;

    private currentStone: THREE.Mesh;
    private force: THREE.Mesh;
    private arrowDirection: THREE.ArrowHelper;
    private arrowForce: THREE.ArrowHelper;


    constructor() { /**/ }

    public init(container: HTMLElement) {

        this.useAngle = false;
        this.clock = new THREE.Clock();

        this.renderer = new THREE.WebGLRenderer({
            antialias: true, devicePixelRatio: window.devicePixelRatio, preserveDrawingBuffer: false
        });

        this.renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8, true);
        this.renderer.autoClear = false;

        // positionner la camera
        this.setStartingPositionCam();
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.setStartingPositionCam();

        this.setLightScene(0, 1, 0, 0x888888, 0xBBBBBB);

        // la scene
        this.createSkybox(
            "iceflow_rt.png", "iceflow_lf.png", "iceflow_up.png", "iceflow_dn.png", "iceflow_bk.png", "iceflow_ft.png");
        let arena = this.createObject3d('arena.dae', 0, 0, 0);
        this.scene.add(arena);

        // pierre de curling 1
        this.currentStone = this.createObject3d('PierreVert.dae', 0, 5, 270);
        this.currentStone.scale.y = 2;
        this.scene.add(this.currentStone);

        //draw Vector
        this.createArrowHelper();
        this.scene.add(this.arrowDirection);

        //forceIndicator
        let squareMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            side: THREE.DoubleSide
        });

        let squareGeometry = this.createForceIndicator();

        this.force = new THREE.Mesh(squareGeometry, squareMaterial);
        this.force.position.set(50, 10, 320);
        this.scene.add(this.force);

        ///////////////////////////////  HEAD-UP scene ////////////////
        this.headUpScene = new THREE.Scene();
        this.setHeadUpCanvas(this.headUpCanvas);
        this.setHeadUpCamera();
        this.showInstructionText(true);
        
        /////////// images de pierres pour les coups restants /////////

        this.createImageObject('PierreRouge.png', 500, -200);
        this.createImageObject('PierreRouge.png', 500, -160);
        this.createImageObject('PierreRouge.png', 500, -120);
        this.createImageObject('PierreRouge.png', 500, -80);
        this.createImageObject('PierreRouge.png', 500, -40);

        this.createImageObject('PierreVerte.png', -500, -200);
        this.createImageObject('PierreVerte.png', -500, -160);
        this.createImageObject('PierreVerte.png', -500, -120);
        this.createImageObject('PierreVerte.png', -500, -80);

        //////////////////////////////// text /////////////////////////
        let header: Textconfig = {
            text: "Curling Game",
            font: "Bold",
            size: "40px",
            police: "Arial",
            align: 'center',
            red: "10",
            green: "10",
            blue: "10",
            alpha: "1",
            x: 0,
            y: 320,
        };
        this.setHeadUpText(header, this.headerCanvas);

        //////////////////////////////// score /////////////////////////
        let score: Textconfig = {
            text: "4-2",
            font: "Bold",
            size: "30px",
            police: "Arial",
            align: 'center',
            red: "10",
            green: "10",
            blue: "10",
            alpha: "1",
            x: 0,
            y: 280,
        };
        this.setHeadUpText(score, this.scoreCanvas);

        ////////////////////////////// player //////////////////////////
        let player: Textconfig = {
            text: "Player: " + "La planche a Marc",
            font: "Bold",
            size: "30px",
            police: "Arial",
            align: 'right',
            red: "10",
            green: "10",
            blue: "10",
            alpha: "1",
            x: -250,
            y: 280,
        };
        this.setHeadUpText(player, this.playerCanvas);

        ///////////////////////////// machine /////////////////////////////
        let machine: Textconfig = {
            text: "Machine  Level : easy",
            font: "Bold",
            size: "30px",
            police: "Arial",
            align: 'left',
            red: "10",
            green: "10",
            blue: "10",
            alpha: "1",
            x: 250,
            y: 280,
        };
        this.setHeadUpText(machine, this.machineCanvas);

        if (container.getElementsByTagName('canvas').length === 0) {
            container.appendChild(this.renderer.domElement);
        }

        this.clock.start();
        this.animate();

        window.addEventListener('resize', _ => this.onResize());
    }

    createForceIndicator(): THREE.Geometry {
        let forceIndicator = new THREE.Geometry();

        forceIndicator.vertices.push(new THREE.Vector3(-1.0, 1.0, 0.0));
        forceIndicator.vertices.push(new THREE.Vector3(5.0, 1.0, 0.0));
        forceIndicator.vertices.push(new THREE.Vector3(5.0, 2.0, 0.0));
        forceIndicator.vertices.push(new THREE.Vector3(-1.0, 2.0, 0.0));
        forceIndicator.faces.push(new THREE.Face3(0, 1, 2));
        forceIndicator.faces.push(new THREE.Face3(0, 2, 3));

        return forceIndicator;
    }

    animate(): void {
        window.requestAnimationFrame(_ => this.animate());
        this.dt = this.clock.getDelta();
        this.render();
    }

    public print(): void {
        console.log(this);
    }

    setLightScene(x: number, y: number, z: number, ambientLight: number, directionLight: number): void {
        this.scene.add(new THREE.AmbientLight(ambientLight));
        let dirLight = new THREE.DirectionalLight(directionLight);
        dirLight.position.set(x, y, z);
        dirLight.position.normalize();
        this.scene.add(dirLight);
    }

    //-----------------creation d'une nouvelle scene ( head-up display)-----------

    setHeadUpCanvas(object: any): any {
        object = document.createElement('canvas');
        let width = window.innerWidth * 0.8;
        let height = window.innerHeight * 0.8;
        object.width = width;
        object.height = height;
        return object;
    }

    setHeadUpCamera(): void {
        let width = window.innerWidth * 0.8;
        let height = window.innerHeight * 0.8;
        this.headUpCamera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0, 30);
    }

    setHeadUpText(config: Textconfig, object1: any): any {
        let object;
        object = this.setHeadUpCanvas(object1);
        let width = window.innerWidth * 0.8;
        let height = window.innerHeight * 0.8;
        let hudBitmap = object.getContext('2d');
        hudBitmap.font = config.font + " " + config.size + " " + config.police;
        hudBitmap.textAlign = config.align;
        hudBitmap.fillStyle = "rgba(" + config.red + "," + config.green + "," + config.blue + "," + config.alpha + ")";
        hudBitmap.fillText(config.text, width / 2, height / 2);

        let hudTexture = new THREE.Texture(object);
        hudTexture.needsUpdate = true;
        let material = new THREE.MeshBasicMaterial({ map: hudTexture });
        material.transparent = true;

        let planeGeometry = new THREE.PlaneGeometry(width, height);
        let plane = new THREE.Mesh(planeGeometry, material);
        plane.position.x = config.x;
        plane.position.y = config.y;
        plane.position.z = 0;
        this.headUpScene.add(plane);
        return plane;
    }


    setTextContext(object: any): any {
        object = this.headUpCanvas.getContext('2d');
        return object;
    }

    showInstructionText(bool: boolean) {
        let canv1, canv2, canv3;
        //let obj1, obj2, obj3;
        let constructor1: Textconfig = {
            text: "(A et D) Manipuler l'indicateur de lancement",
            font: "Bold",
            size: "20px",
            police: "Arial",
            align: 'left',
            red: "10",
            green: "10",
            blue: "10",
            alpha: "1",
            x: -700,
            y: 80,
        };
        this.setHeadUpText(constructor1, canv1).visible = bool;
        let constructor2: Textconfig = {
            text: "(W) en restant appuyer sur W la pierre va bouger avec la camera",
            font: "Bold",
            size: "20px",
            police: "Arial",
            align: 'left',
            red: "10",
            green: "10", 
            blue: "10",
            alpha: "1",
            x: -700,
            y: 30,
        };
        this.setHeadUpText(constructor2, canv2).visible = bool;
        let constructor3: Textconfig = {
            text: "(ESPACE) permet de modifier la position de la camera",
            font: "Bold",
            size: "20px",
            police: "Arial",
            align: 'left',
            red: "10",
            green: "10",
            blue: "10",
            alpha: "1",
            x: -700,
            y: -20,
        };
        this.setHeadUpText(constructor3, canv3).visible = bool;
    }

    // cache les instructions de la fenetre
    hideInstructionText(){
         this.showInstructionText(false);
    }

    //-----------------------changement de camera---------------------------------

    //Possibilité de changer de caméra en tout temps
    changeCamera(): void {
        if (this.initialPisitionCamera === true) {
            this.setOptionlPositionCam();
            this.initialPisitionCamera = false;
        }
        else {
            this.setStartingPositionCam();
        }
    }

    moveCamStone(deltaT: number) {
        this.camera.position.z -= deltaT * 110;
        this.camera.position.y += deltaT * 10;
        this.camera.lookAt(new THREE.Vector3(0, 0, -300));
    }

    // position initiale de la camera
    public setStartingPositionCam(): void {
        this.setCamera(0, 250, 400);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.initialPisitionCamera = true;
    }

    public setOptionlPositionCam(): void {
        this.setCamera(100, this.camera.position.y, this.camera.position.z);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        //this.initialPisitionCamera = false;
    }

    public translateCamera(x: number, y: number, z: number): void {
        this.camera.position.x += x === undefined ? 0 : x;
        this.camera.position.y += y === undefined ? 0 : y;
        this.camera.position.z += z === undefined ? 0 : z;
        this.camera.updateProjectionMatrix();
    }

    private setCamera(x: number, y: number, z: number): void {
        // positionner la camera
        this.camX = x;
        this.camY = y;
        this.camZ = z;
        this.camera = new THREE.PerspectiveCamera(100, 0.8, 1, 5000);
        this.camera.position.set(this.camX, this.camY, this.camZ);
    }

    //-------------------------------Creer les objets----------------------------------------------------

    public createObject3d(path: string, positionX: number, positionY: number, positionZ: number): any {
        let obj = new THREE.Mesh;
        let s = new THREE.Object3D;
        let sceneObject = new THREE.ColladaLoader();
        sceneObject.load('/assets/models/' + path, (result) => {
            s = result.scene as THREE.Object3D;
            s.position.set(positionX, positionY, positionZ);
            s.scale.set(45, 45, 45);
            (s as THREE.Mesh).material = new THREE.MeshPhongMaterial({
                wireframe: false,
                shininess: 0.2,
            });
            obj.add(s);
        });
        return obj;
    }


    getClock(): number {
        return this.clock.getDelta();
    }

    public createSkybox(fileNameRight: string, fileNameLeft: string,
        fileNameTop: string, fileNameDown: string, fileNameBack: string, fileNameFront: string) {

        // ajouter les images pour creer la scene
        let materials: any[] = [
            this.createMaterials('../assets/images/' + fileNameRight),
            this.createMaterials('../assets/images/' + fileNameLeft),
            this.createMaterials('../assets/images/' + fileNameTop),
            this.createMaterials('../assets/images/' + fileNameDown),
            this.createMaterials('../assets/images/' + fileNameBack),
            this.createMaterials('../assets/images/' + fileNameFront),
        ];

        // creer un large cube pour le perimetre 3D de la scene de dimension 700 par 700 par 2500
        // meshFaceMaterial : Mapper toutes le material vers la face de la boite
        this.geometry = new THREE.BoxGeometry(2700, 2200, 2200, 1, 1, 1);
        this.mesh = new THREE.Mesh(this.geometry, new THREE.MeshFaceMaterial(materials));
        // ajuster l'hometesie de l'axe des x a -1,
        //pour mettre le cube a l'envers -> pour que les images soient visibles de l'interieur
        this.mesh.scale.set(-1, 1, 1);
        // ajouter l'objet aux objets de la scene
        this.scene.add(this.mesh);
    }

    // cree des objets en apparence 2d pour le contenu de la fenetre de jeu
    public createImageObject(imageName: string, positionX: number, positionY: number) {

        // chargement, mapping et creation de l'image sprite
        let imageMap = new THREE.TextureLoader().load('../assets/images/' + imageName);
        let spriteMaterial = new THREE.SpriteMaterial({ map: imageMap, color: 0xffffff });
        let spriteImage = new THREE.Sprite(spriteMaterial);

        //set la position dans la fenetre
        spriteImage.scale.set(50, 50, 1);
        spriteImage.position.x = positionX;
        spriteImage.position.y = positionY;
        spriteImage.castShadow = true;

        this.headUpScene.add(spriteImage);
    }


    createArrowHelper() {
        let start = new THREE.Vector3(0, 5, 250);
        let end = new THREE.Vector3(0, 20, 200);
        let direction = end.clone().sub(start);
        let length = direction.length();
        this.arrowDirection = new THREE.ArrowHelper(direction.normalize(), start, length, 0xff0000);
        this.arrowDirection.scale.x = 5;
    }

    createArrowForce() {
        let start = new THREE.Vector3(100, 0, -400);
        let end = new THREE.Vector3(100, 20, -400);
        let direction = end.clone().sub(start);
        let length = direction.length();
        this.arrowForce = new THREE.ArrowHelper(direction.normalize(), start, length, 0xff0000);
        this.arrowForce.scale.x = 5;
    }


    //---------------------Bouger les objets ---------------
    moveStone(deltaT: number) {
        if (this.currentStone.position.z > LIMITZ) {
            this.currentStone.position.z -= deltaT * 100;
            // pour le spin
            this.currentStone.translateZ(270);
            this.currentStone.rotation.y -= deltaT * 10;
            // pour le spin
            this.currentStone.translateZ(-270);
        }
    }

    hideArrowHelper() {
        this.arrowDirection.visible = false;
    }

    animateArrow(move: number): void {
        this.arrowDirection.rotation.z += Math.PI / 2 * move;
    }

    addForce(deltaT: number) {
        this.force.scale.y += 10 * deltaT;
        this.force.position.set(50, 10, 320);
    }

    //---------------------fonction deja donnee----------------------
    private createMaterials(path: string) {
        // charger le lien
        let texture = THREE.ImageUtils.loadTexture(path);
        // creer l'objet
        let material = new THREE.MeshBasicMaterial({ map: texture, overdraw: 0.5 });

        return material;
    }

    public translateMesh(x: number, y: number): void {
        this.mesh.position.x += x;
        this.mesh.position.y += y;
    }

    onWindowResize() {
        let factor = 0.8;
        let newWidth: number = window.innerWidth * factor;
        let newHeight: number = window.innerHeight * factor;

        this.camera.aspect = newWidth / newHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(newWidth, newHeight);
    }

    // superpose 2 scences l'une par dessus l'autre
    render(): void {
        //this.renderer.autoClear = false;
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
        this.renderer.clearDepth();
        this.renderer.render(this.headUpScene, this.headUpCamera);
    }

    toggleWireFrame(): void {
        this.wf = !this.wf;
        this.material.wireframe = this.wf;
        this.material.needsUpdate = true;
    }


    onResize() {
        const width = window.innerWidth * 0.95;
        const height = window.innerHeight - 90;

        this.camera.aspect = width / height;
        //this.camera.updateProjectionMatrix();
        //this.headUpCamera.updateProjectionMAtrix();
        this.headUpCamera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0, 30);
        this.renderer.setSize(width, height);
    }

}

