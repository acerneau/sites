import * as THREE from 'three';
import { EffectComposer } from 'jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'jsm/shaders/FXAAShader.js';
import Stats from 'three/addons/libs/stats.module.js';
import { Sky } from 'jsm/objects/Sky.js';
import * as dat from 'dat.gui';

import { BoxShape, SphereShape, ConeShape, updateObjectVerticies } from './shapes.js';
import { performFrustumCulling } from './Opti.js'

import { genNoiseMap } from './generation.js'

/////////////////// GLOBALS VARS \\\\\\\\\\\\\\\\\\\

const w = window.innerWidth;
const h = window.innerHeight;

const FOV = 75;
const ASPECT = w / h;
const NEAR = 0.1;
const FAR = 20000;
const ROTATION_SPEED = 0.002;

let PLAYER_VEL = new THREE.Vector3();
const ACCELERATION = 50;
const FRICTION = 5;
// const GRAVITY = 19.8;
// const JUMP_STRENGTH = 10;
// const PLAYER_PUSHBACK_FORCE = 0.1;
let PLAYER_SPEED = 2;

const PLAYER_HEIGHT = 1.5;
const PLAYER_SIZE = 1;
export const PLAYER_BB_OFFSET = 0.05;

/////////////////// HTML \\\\\\\\\\\\\\\\\\\

const displayText = document.querySelector('#displayText')


/////////////////// SETUP \\\\\\\\\\\\\\\\\\\

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
camera.position.set(0, 5, -10);
camera.rotation.set(0, 0, 0);

const PlayerGEO = new THREE.BoxGeometry( PLAYER_SIZE, PLAYER_HEIGHT, PLAYER_SIZE);
const PlayerMAT = new THREE.MeshStandardMaterial();
const PlayerMESH = new THREE.Mesh(PlayerGEO, PlayerMAT);

const PlayerBox = new THREE.Box3().setFromObject(PlayerMESH);
PlayerBox.expandByScalar(PLAYER_BB_OFFSET);
PlayerBox   .visible = false;

const PlayerBB = new THREE.Box3Helper(PlayerBox, new THREE.Color('red'));
PlayerBB.visible = false;    

scene.add(PlayerMESH)
scene.add(PlayerBB);


const renderer = new THREE.WebGLRenderer({ antialias: true });  
renderer.setSize(w, h);

document.body.appendChild(renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);

stats.dom.style.transform = 'scale(1.2)';
stats.dom.style.transformOrigin = 'top left';

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms['resolution'].value.set(
    1 / window.innerWidth,
    1 / window.innerHeight
);
composer.addPass(fxaaPass);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;


/////////////////// LIGHTS \\\\\\\\\\\\\\\\\\\


const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);


const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 1000;
scene.add(sunLight);

sunLight.intensity = 4.5;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

renderer.toneMappingExposure = 1.2;



const moonLight = new THREE.DirectionalLight(0xaaaaff, 0.1);
moonLight.castShadow = false;
scene.add(moonLight);


const starGeo = new THREE.BufferGeometry();
const starCount = 700;
const starPositions = [];

for (let i = 0; i < starCount; i++) {
    const radius = 9000 + Math.random() * 7000;
    const theta = THREE.MathUtils.randFloat(0, Math.PI);
    const phi = THREE.MathUtils.randFloat(0, 2 * Math.PI);

    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = radius * Math.cos(theta);
    const z = radius * Math.sin(theta) * Math.sin(phi);
    starPositions.push(x, y, z);
}

starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 3,
  sizeAttenuation: false,
  depthTest: true,
  depthWrite: false,
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending,
});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

stars.frustumCulled = false;
stars.renderOrder = -1;



const skyUniforms = sky.material.uniforms;
const sun = new THREE.Vector3();
const params = {
    elevation: 45,
    azimuth: 180,
    turbidity: 8,
    rayleigh: 0.1,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.6,
    timeOfDay: 21,
    autoCycle: true,
    cycleSpeed: 0.01,
    enableRaycast: true,
    enableGodRays: true,
};

let TimeCycle = params.timeOfDay;

skyUniforms.turbidity.value = params.turbidity
skyUniforms.rayleigh.value = params.rayleigh
skyUniforms.mieCoefficient.value = params.mieCoefficient
skyUniforms.mieDirectionalG.value = params.mieDirectionalG

function updateSky() {
    const theta = THREE.MathUtils.degToRad(90 - params.elevation);
    const phi = THREE.MathUtils.degToRad(params.azimuth);

    sun.setFromSphericalCoords(1, theta, phi);
    sky.material.uniforms['sunPosition'].value.copy(sun);
    sunLight.position.copy(sun).multiplyScalar(100);
    moonLight.position.copy(sun).multiplyScalar(-100);
}

function updateLightingByTime(hour) {
    const t = (hour % 24) / 24;
    params.elevation = Math.sin((t - 0.25) * Math.PI * 2) * 90;  
    params.azimuth = t * 360;

    const daylight = Math.max(0, Math.sin(t * Math.PI));

    moonLight.intensity = 0.2 * (1 - daylight * 0.7);
    sunLight.intensity = 5 * daylight * 0.7 + 0.1;

    
    if (params.timeOfDay <= 6 || params.timeOfDay >= 18.5) {
        stars.material.opacity = THREE.MathUtils.clamp(1.0 - (daylight * 0.7 + 0.4), 0, 1);
    }else {
        stars.material.opacity = 0;
    }
    updateSky();
}


updateLightingByTime(params.timeOfDay);


/////////////////// SHAPES \\\\\\\\\\\\\\\\\\\

class Torch {
    constructor(pos,color) {
        this.pos = pos;
        this.pos.setY(this.pos.y -1.5) 
        this.object = new THREE.Group();
        this.object.position.copy(pos);

        const flameGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const flameMaterial = new THREE.MeshBasicMaterial({ color: color });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.y = 2.05;
        this.object.add(flame);

        const light = new THREE.PointLight(color, 8, 60, 0.2);
        light.position.y = 2.1;
        this.object.add(light);
        scene.add(this.object);
    }  
}



export const shapes = [];

const terrainWidth = 2000;
const terrainDepth = 2000;
let GroundMesh = new THREE.Mesh();


async function init() {
    const loadingScreen = document.getElementById('loading-screen');

    const terrainVertices = genNoiseMap(terrainWidth, terrainDepth);

    const GroundGeo = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];

    for (let i = 0; i < terrainVertices.length; i++) {
        const v = terrainVertices[i];
        vertices.push(v.x, v.y, v.z);
    }

    for (let x = 0; x < terrainWidth - 1; x++) {
        for (let z = 0; z < terrainDepth - 1; z++) {
            const topLeft = x * terrainDepth + z;
            const topRight = topLeft + 1;
            const bottomLeft = (x + 1) * terrainDepth + z;
            const bottomRight = bottomLeft + 1;

            indices.push(topLeft, topRight, bottomLeft);
            indices.push(topRight, bottomRight, bottomLeft);
        }
    }

    GroundGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    GroundGeo.setIndex(indices);
    GroundGeo.computeVertexNormals();

    const GroundMat = new THREE.MeshStandardMaterial({
        color: 0x88cc88,
        roughness: 0.8,
        metalness: 0.0,
        wireframe: false,
        flatShading: false
    });

    GroundMesh.geometry = GroundGeo;
    GroundMesh.material = GroundMat;
    GroundMesh.position.setY(-50);

    scene.add(GroundMesh);

    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }

}

init();


GroundMesh.position.setY(-50)
scene.add(GroundMesh);


shapes.forEach(shape => {
    scene.add(shape.mesh)
    scene.add(shape.BB)
})

/////////////////// WIREFRAME (ALT + W) AND HitBoxes (Alt + C) \\\\\\\\\\\\\\\\\\\

export let wireframeEnabled = false;
let HitBoxesEnabled = false;

window.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 'w') {
        wireframeEnabled = !wireframeEnabled;

        if (wireframeEnabled) {
            GroundMesh.material = new THREE.MeshBasicMaterial({
                color: 0xe84a4a,
                wireframe: true
            });
        } else {
            GroundMesh.material = new THREE.MeshStandardMaterial({
                color: 0x88cc88,
                roughness: 0.8,
                metalness: 0.0,
                wireframe: false,
                flatShading: false
            });
        }

        shapes.forEach(shape => {
            shape.wire.visible = wireframeEnabled;
        });
    }
    if (e.altKey && e.key.toLowerCase() === 'r') {
        camera.position.set(0, 20, 0);
        camera.rotation.set(0, 0, 0);
        PLAYER_VEL.set(0, 2, 0);
        yaw = 0;
        pitch = 0;
    }
    if (e.altKey && e.key.toLowerCase() === 'c') {
        HitBoxesEnabled = !HitBoxesEnabled
        shapes.forEach(shape => {
            shape.BB.visible = HitBoxesEnabled;
        });
        PlayerBB.visible = HitBoxesEnabled;
    }
});

/////////////////// RESIZE \\\\\\\\\\\\\\\\\\\

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    fxaaPass.material.uniforms['resolution'].value.set(
        1 / window.innerWidth,
        1 / window.innerHeight
    );
});

/////////////////// KEYBOARD STATE \\\\\\\\\\\\\\\\\\\

const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    onKeyPress(e.key.toLowerCase(),e)
    if (e.ctrlKey) {
        PLAYER_SPEED  = 6
    } else { PLAYER_SPEED  = 2}
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    onKeyRelease(e.key.toLowerCase(),e)
});


/////////////////// MOUSE STATE \\\\\\\\\\\\\\\\\\\

renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
    const isLocked = document.pointerLockElement === renderer.domElement;
    if (isLocked) {
        document.addEventListener('mousemove', onMouseMove, false);
    } else {
        document.removeEventListener('mousemove', onMouseMove, false);
    }
});

let yaw = 0;
let pitch = 0;

const MIN_PITCH = -Math.PI / 2;
const MAX_PITCH = Math.PI / 2;

function onMouseMove(e) {
    const deltaX = -e.movementX * ROTATION_SPEED;
    const deltaY = -e.movementY * ROTATION_SPEED;

    yaw += deltaX;
    pitch += deltaY;

    pitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch));

    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const pitchQuaternion = new THREE.Quaternion();
    pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    quaternion.multiply(pitchQuaternion);

    camera.quaternion.copy(quaternion);
}

/////////////////// KEYS \\\\\\\\\\\\\\\\\\\

function onKeyPress(key) {
    switch (key) {
        case 'arrowup': TimeCycle += 0.5;break
        case 'arrowdown': TimeCycle -= 0.5;break
        case 'arrowleft': GroundMesh.rotation.y += 0.01 ;break
        case 't': window.location.href = './Terrain.html'; break
    }
}

function onKeyRelease(key) {
    switch (key) {
        case 'g': const torchwhite = new Torch(camera.position,0xf8f1e2); break
        case 'h': const torchred = new Torch(camera.position,0xf58787); break
        case 'j': const torchblue = new Torch(camera.position,0x8ed9e7); break
        case 'k': const torchyellow = new Torch(camera.position,0xe6f54c); break
        case 'l': const torchpurple = new Torch(camera.position,0xdc85f0); break
    }
}

function KeyMovement(accelDirection) {
    if (keys['d']) accelDirection.x += 1;
    if (keys['q']) accelDirection.x -= 1;
    if (keys['z']) accelDirection.z -= 1;
    if (keys['s']) accelDirection.z += 1;
    if (keys['shift']) accelDirection.y = -1;
    if (keys[' ']) accelDirection.y = 1;
}


/////////////////// LOOP \\\\\\\\\\\\\\\\\\\
let previousTime = performance.now();
const clock = new THREE.Clock();



function loop(time) {
    setTimeout( function() {
    
        requestAnimationFrame( loop );
        stats.update();

    }, 0  );

    if (!previousTime) {
        previousTime = 0
    }   
    const deltaTime = (time - previousTime) / 1000;
    previousTime = time;

    let accelDirection = new THREE.Vector3();
    KeyMovement(accelDirection);

    const moveDirection = new THREE.Vector3();
    const UpVector = new THREE.Vector3(0, 1, 0).normalize();
    const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forwardVector.y = 0;
    forwardVector.normalize();

    const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    rightVector.y = 0;
    rightVector.normalize();

    moveDirection.addScaledVector(forwardVector, -accelDirection.z);
    moveDirection.addScaledVector(rightVector, accelDirection.x);
    moveDirection.addScaledVector(UpVector, accelDirection.y);

    moveDirection.normalize();


    //PLAYER_VEL.y -= GRAVITY * deltaTime;
    const frictionFactor = Math.exp(-FRICTION * deltaTime);
    PLAYER_VEL.x *= frictionFactor;
    PLAYER_VEL.y *= frictionFactor;
    PLAYER_VEL.z *= frictionFactor;


    PLAYER_VEL.addScaledVector(moveDirection, ACCELERATION * deltaTime * PLAYER_SPEED);


    const newCameraPosition = new THREE.Vector3().copy(camera.position).addScaledVector(PLAYER_VEL, deltaTime);
    camera.position.copy(newCameraPosition);
    PlayerMESH.position.copy(newCameraPosition);
    PlayerBox.setFromCenterAndSize(
        newCameraPosition,
        new THREE.Vector3(PLAYER_SIZE, PLAYER_HEIGHT, PLAYER_SIZE)
    );



   // updatePlayerBoundingBox(camera, PlayerMESH, PlayerBB);

    displayText.innerHTML =
        " Time : " + params.timeOfDay.toFixed(2) +
        "<br> Map :  [width = " + terrainWidth + ",depth = " + terrainDepth + "]"+
        "<br> Coords -> x: " + camera.position.x.toFixed(2) +
        " | y: " + camera.position.y.toFixed(2) +
        " | z: " + camera.position.z.toFixed(2) +
        "<br>Look -> x: " + camera.rotation.x.toFixed(2) +
        " | y: " + camera.rotation.y.toFixed(2) +
        " | z: " + camera.rotation.z.toFixed(2);

    performFrustumCulling(camera);
    shapes.forEach(updateObjectVerticies);
    
    
    if (params.autoCycle) {
        TimeCycle += params.cycleSpeed / 40;
        if (TimeCycle >= 24 || TimeCycle < 0) TimeCycle = 0;

        params.timeOfDay = TimeCycle;
    }
    updateLightingByTime(params.timeOfDay);
    stars.position.copy(camera.position);


    composer.render();
}

loop(performance.now())