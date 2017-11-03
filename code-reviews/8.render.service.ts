import { Injectable } from '@angular/core';
//import { ObjectCreaterService } from './object-creater.service';
import { FlecheDeLancer } from '../FlecheDeLancer';
import { RocheDeCurling } from '../RocheDeCurling';
import {SkyBox} from '../SkyBox';
import {Patinoire} from '../Patinoire';
import {GereurCollision} from '../GereurCollision';

@Injectable()
export class RenderService {
    private scene: THREE.Scene;
    private plongeCamera: THREE.PerspectiveCamera;
    private fromTopCamera: THREE.OrthographicCamera;
    private renderer: THREE.WebGLRenderer;

    private useAngle: boolean;
    private clock: THREE.Clock;

    private estEnModePlonge: boolean;
    private departPCamX: number;
    private departPCamY: number;
    private departPCamZ: number;

    private departFTCamX: number;
    private departFTCamY: number;
    private departFTCamZ: number;

    //private objectLoader: THREE.ObjectLoader;
    private lancerApplique: boolean;

    private banqueDeRoches : RocheDeCurling [];

    private patinoire : Patinoire;
    private pierreHorsPatinoire: boolean;
    private pierreDansCible: boolean;

    private arrow: FlecheDeLancer;

    private rocheActive: RocheDeCurling;
    public bougerLongueur: boolean;
    public bougerSens: boolean;
    public spinDroit: boolean;

    private lumiereDirectionelle: THREE.DirectionalLight;
    private lumiereAmbiante: THREE.AmbientLight;
    private readonly COULEUR_ROUGE = 0xC60800;
    private readonly COULEUR_BLEU = 0x0131B4;
    private readonly NB_ROCHES_CURLING = 16;
    private nbPierreLancées: number;

    private nomJoueur : string;
    private nbPierresJoueurs : number;
    private nbPierresAI : number;
    private mancheEnCours : number;
    private scoreJoueur : number;
    private scoreAI : number;

    constructor() {
        //weshmamdou rien ici ?
    }

    public init(container: HTMLElement) {

        this.nomJoueur = "";
        this.nbPierresJoueurs = 8;
        this.nbPierresAI = 8;
        this.mancheEnCours = 1;
        this.scoreJoueur = 0;
        this.scoreAI = 0;

        this.useAngle = false;
        this.clock = new THREE.Clock();

        this.bougerLongueur = true;
        this.bougerSens = true;
        this.spinDroit = true;

        this.renderer = new THREE.WebGLRenderer({antialias: true, devicePixelRatio: window.devicePixelRatio});
        this.renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8, true);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.departPCamX = 0;
        this.departPCamY = 20;
        this.departPCamZ = 50;

        this.plongeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 500);
        this.plongeCamera.position.set(this.departPCamX, this.departPCamY, this.departPCamZ);

        this.departFTCamX = 0;
        this.departFTCamY = 250;
        this.departFTCamZ = 0;
        this.fromTopCamera = new THREE.OrthographicCamera(-200, 200, 225, -225, 1, 500);
        this.fromTopCamera.position.set(this.departFTCamX, this.departFTCamY, this.departFTCamZ);
        this.fromTopCamera.lookAt(new THREE.Vector3(0, 0, 0));

        this.estEnModePlonge = true;


        this.scene = new THREE.Scene();

        this.lumiereAmbiante = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(this.lumiereAmbiante);

        this.lumiereDirectionelle = new THREE.DirectionalLight(0xffffff);
        this.lumiereDirectionelle.position.set(-100, 90, -150);
        this.lumiereDirectionelle.shadowCameraLeft = -150;
        this.lumiereDirectionelle.shadowCameraRight = 150;
        this.lumiereDirectionelle.shadowCameraBottom = -100;
        this.lumiereDirectionelle.shadowCameraTop = 100;
        this.lumiereDirectionelle.castShadow = true;

        this.scene.add(this.lumiereDirectionelle);


        this.patinoire = new Patinoire();
        this.scene.add(this.patinoire.getPatinoire());
        this.scene.add(this.patinoire.getInnerTarget());
        this.scene.add(this.patinoire.getOuterTarget());

        let boîteCiel = new SkyBox("Montagne");
        this.scene.add( boîteCiel );

        //Tableau des rochesDeCrulingPourChacuneDesÉquipes
        this.banqueDeRoches = new Array(this.NB_ROCHES_CURLING);

        //Creation des Roches De Curling
        for (let i = 0; i < this.NB_ROCHES_CURLING; i++ )
        {
            if (i % 2 === 0)
            {
                this.banqueDeRoches[i] = new RocheDeCurling(this.COULEUR_ROUGE, 1);
            }
            else
            {
                this.banqueDeRoches[i] = new RocheDeCurling(this.COULEUR_BLEU, 2);
            }
        }

        this.nbPierreLancées = 0;
        this.rocheActive = this.banqueDeRoches[this.nbPierreLancées];
        this.scene.add(this.rocheActive.getObjetRoche());

        this.arrow = new FlecheDeLancer(new THREE.Vector3(1, 0, 0), this.rocheActive.getPosition(), 20, 0xff0000);
        this.scene.add(this.arrow.fleche);

        // Inser the canvas into the DOM
        //var container = document.getElementById("glContainer");
        if (container.getElementsByTagName('canvas').length === 0)
        {
            container.appendChild(this.renderer.domElement);
        }
             this.createPlayerName();
      this.createScore();
       this.createAIName();
       this.createManche();
    this.functionPierre("blue",true, this.nbPierresJoueurs);
    this.functionPierre("red",false, this.nbPierresAI);

        this.clock.start();
        this.animate();

        // bind to window resizes
        window.addEventListener('resize', _ => this.onResize());

        
   

    }
    animate(): void {
        //This creates the render loop by recallingitselfnonstoplikeafukintrolldlamorkitu
        window.requestAnimationFrame(_ => this.animate());

        if (this.bougerSens)
        {
            this.arrow.BougerSens();
        }
        if (this.bougerLongueur && !this.bougerSens)
        {
            this.arrow.BougerLongueur();
        }

        if (!this.bougerLongueur && !this.bougerSens )
        {
            if (!this.lancerApplique)
            {
                this.lancerApplique = true;
                this.arrow.fleche.visible = false;
                this.rocheActive.RecevoirPousserEtSpinInit(this.arrow.getDirection(),
                                                           this.arrow.getLength() / 40,
                                                           this.spinDroit);
                this.nbPierreLancées += 1;
            }

            this.actualiserRoches();

            if (this.jeuImmobile())
            {
                this.preparerProchainLancer();
            }
        }

        this.verifierPositionPierre();
        this.verifierCollisions();
        this.plongeCamera.lookAt(this.rocheActive.getPosition());
        this.render();
    }

    private verifierPositionPierre()
    {
        this.pierreHorsPatinoire = !(this.rocheActive.getPosition().x > (-this.patinoire.getLargeur() / 2) &&
                                     this.rocheActive.getPosition().x < (this.patinoire.getLargeur() / 2) &&
                                     this.rocheActive.getPosition().z < (this.patinoire.getLongueur() / 2) &&
                                     this.rocheActive.getPosition().z > (-this.patinoire.getLongueur() / 2));

        this.pierreDansCible = this.patinoire.getOuterTargetBoundingSphere().
                               containsPoint(this.rocheActive.getPosition());

        if (this.pierreHorsPatinoire)
        {
            this.rocheActive.fadeOut();
            if (this.rocheActive.getObjetRoche().material.opacity === 0)
            {
                this.rocheActive.getObjetRoche().material.opacity = 1;
                this.scene.remove(this.rocheActive.getObjetRoche());
                this.rocheActive.lightItDown(); //Remise du materiel de la roche à l'état de sa création
            }
        }
        else if (this.pierreDansCible)
        {
            this.rocheActive.lightItUp();
        }
        else
        {
           this.rocheActive.lightItDown();
        }
    }

    onWindowResize()
    {
        let factor = 0.8;
        let newWidth: number = window.innerWidth * factor;
        let newHeight: number = window.innerHeight * factor;

        this.plongeCamera.aspect = newWidth / newHeight;
        this.plongeCamera.updateProjectionMatrix();

        this.renderer.setSize(newWidth, newHeight);
    }

   
  
    render(): void {
       
        
        if (this.estEnModePlonge)
        {
            this.renderer.render(this.scene, this.plongeCamera);
        }
        else
        {
            this.renderer.render(this.scene, this.fromTopCamera);
        }
    }


    functionPierre(couleur: string, coteGauche:boolean, qte : number){
        let x;
        if(coteGauche){
            x = 50;
        }else{
            x = 1800;
        }

        for(let i= 0; i <qte; i++){
        let pierre = document.createElement('img');
        pierre.style.position = 'absolute';
        pierre.style.zIndex = "100";    // if you still don't see the label, try uncommenting this
        pierre.style.top = (940 - i * 50) + 'px';
        pierre.style.left = x + 'px';
        pierre.setAttribute("width", "100");
       // pierre.setAttribute("height", "50");
        pierre.setAttribute("src", "../../assets/HUD Images/" + couleur + ".png");
        document.body.appendChild(pierre);
        }
    }

    onResize() {
        const width = window.innerWidth * 0.95;
        const height = window.innerHeight - 90;

        this.plongeCamera.aspect = width / height;
        this.plongeCamera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    public translateCamera(x: number, y: number, z: number): void
    {
        //Cette fonction sera utile
    }

    /*
    public loadObject(): void {
        this.objectLoader.load('assets/models/json/model.json', obj => {
            obj.scale.set(50, 50, 50);


            (obj as THREE.Mesh).material = new THREE.MeshPhongMaterial({
                color: 0xaaaa12,
                wireframe: false,
                shininess: 0.2,
            });
            this.roche = obj as THREE.Mesh;
            this.scene.add(this.roche);

        });
    }
    */

    public changerPlanCam100Kamas(): void{
        this.estEnModePlonge = !this.estEnModePlonge;
    }
     createPlayerName(){
         // Joueur
        let nomJoueur = document.createElement('div');
        nomJoueur.id = "nomJoueur";
        nomJoueur.style.position = 'absolute';
        nomJoueur.style.zIndex = "100";    // if you still don't see the label, try uncommenting this
        nomJoueur.style.width = "100";
        nomJoueur.style.height = "100";
        nomJoueur.style.fontSize = "400%";
        nomJoueur.innerHTML = this.nomJoueur;
        nomJoueur.style.top = 250 + 'px';
        nomJoueur.style.left = 100 + 'px';
        document.body.appendChild(nomJoueur);
   }
   createScore(){
      // Score
        let score = document.createElement('div');
        score.style.position = 'absolute';
        score.style.zIndex = "100";    // if you still don't see the label, try uncommenting this
        score.style.width = "100";
        score.style.height = "100";
        score.style.fontSize = "500%";
        score.innerHTML = this.scoreJoueur + " - "  + this.scoreAI;
        score.style.top = 250 + 'px';
        score.style.left = 750 + 'px';
        document.body.appendChild(score);
   }
   changeName(nom : string){
       document.getElementById("nomJoueur").innerHTML = nom;
   }

    private jeuImmobile(): boolean
    {
        let jeuImmobile = true;

        for (let i = 0; i < this.nbPierreLancées && jeuImmobile; i++ )
        {
            if (this.banqueDeRoches[i].getVitesse() > 0)
            {
                jeuImmobile = false;
            }
        }
        return jeuImmobile;
    }

    private preparerProchainLancer(): void
    {
        this.bougerLongueur = true;
        this.bougerSens = true;
        this.lancerApplique = false;
        this.arrow.RemiseEnOrdre();
        this.rocheActive = this.banqueDeRoches[this.nbPierreLancées];
        this.scene.add(this.rocheActive.getObjetRoche());
    }

    private actualiserRoches(): void
    {
        for (let i = 0; i < this.nbPierreLancées; i++ )
        {
            if (this.banqueDeRoches[i].getVitesse() > 0)
            {
                this.banqueDeRoches[i].applyPhysics(this.patinoire.getCoefFrottement());
                this.banqueDeRoches[i].faireSpiner();
                this.banqueDeRoches[i].translateRoche();
            }
        }
    }

    private verifierCollisions(): void
    {
        let distanceEntre2Roche: THREE.Vector2;
        for (let i = 0; i < this.nbPierreLancées; i++ )
        {
            for (let j = i + 1; j < this.nbPierreLancées; j++ )
            {
                distanceEntre2Roche = new THREE.Vector2(
                        this.banqueDeRoches[i].getPosition().x - this.banqueDeRoches[j].getPosition().x,
                        this.banqueDeRoches[i].getPosition().z - this.banqueDeRoches[j].getPosition().z);
                if (distanceEntre2Roche.length() <= 2 * RocheDeCurling.RAYON_ROCHE)
                {
                    console.log("found somethin");
                    if (this.banqueDeRoches[i].getVitesse() > 0)
                    {
                        GereurCollision.appliquercollision(this.banqueDeRoches[i],
                                                           this.banqueDeRoches[j],
                                                             distanceEntre2Roche);
                    }
                    else
                    {
                        GereurCollision.appliquercollision(this.banqueDeRoches[j],
                                                           this.banqueDeRoches[i],
                                                             distanceEntre2Roche);
                    }
                }
            }
        }
    }

   createAIName(){
       // AI
        let nomAI = document.createElement('div');
        nomAI.id = "difficulte";
        nomAI.style.position = 'absolute';
        nomAI.style.zIndex = "100";    // if you still don't see the label, try uncommenting this
        nomAI.style.width = "100";
        nomAI.style.height = "100";
        nomAI.style.fontSize = "400%";
        nomAI.innerHTML = "";
        nomAI.style.top = 250 + 'px';
        nomAI.style.left = 1275 + 'px';
        document.body.appendChild(nomAI);

   }
   changeDifficulte(difficulte : string){

       document.getElementById("difficulte").innerHTML = "CPU " + difficulte;
   }

createManche(){
     // Manches
        let manches = document.createElement('div');
        manches.style.position = 'absolute';
        manches.style.zIndex = "100";    // if you still don't see the label, try uncommenting this
        manches.style.width = "100";
        manches.style.height = "100";
        manches.style.fontSize = "200%";
        manches.innerHTML = "Manches " + this.mancheEnCours + "/3";
        manches.style.top = 320 + 'px';
        manches.style.left = 740 + 'px';
        document.body.appendChild(manches);
    }
}
