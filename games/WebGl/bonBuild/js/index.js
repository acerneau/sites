import * as THREE from 'three';
import { EffectComposer } from 'jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'jsm/shaders/FXAAShader.js';
import Stats from 'three/addons/libs/stats.module.js';

import { BoxShape, SphereShape, ConeShape, PlaneShape } from './shapes.js';

/////////////////// GLOBALS VARS \\\\\\\\\\\\\\\\\\\

const clock = new THREE.Clock();

const w = window.innerWidth;
const h = window.innerHeight;

const FOV = 75;
const ASPECT = w / h;
const NEAR = 0.1;
const FAR = 500;
const ROTATION_SPEED = 0.002;

let PLAYER_VEL = new THREE.Vector3();
const ACCELERATION = 50;
const FRICTION = 5;
const GRAVITY = 8.4;
const JUMP_FORCE = 10;
const JUMP_EXPO = 40;

const PLAYER_HEIGHT = 1.7;
const PLAYER_SIZE = 0.8;

/////////////////// SETUP \\\\\\\\\\\\\\\\\\\

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xabffff);

const camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR);
camera.position.set(0, 5, -10);
camera.rotation.set(0, 0, 0);

const PlayerGEO = new THREE.BoxGeometry( PLAYER_SIZE, PLAYER_HEIGHT, PLAYER_SIZE);
const PlayerMAT = new THREE.MeshStandardMaterial({opacity: 0.2});
const PlayerMESH = new THREE.Mesh(PlayerGEO, PlayerMAT);

camera.add(PlayerMESH)

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

/////////////////// LIGHTS \\\\\\\\\\\\\\\\\\\

const light = new THREE.DirectionalLight(0xffffff, 5);
light.position.set(5, 5, 5);

scene.add(light);

light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = NEAR;
light.shadow.camera.far = FAR / 3;
light.shadow.bias = -0.0005;


const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
scene.add(ambientLight);

/////////////////// SHAPES \\\\\\\\\\\\\\\\\\\

export const shapes = [];

let box = new BoxShape('#ff0000', { x: -5, y: 0, z: 0 }, '#ffffff',3, 2, 3);
let sphere = new SphereShape('#00ff1f', { x: 0, y: 0, z: 0 }, '#ffffff', 1, 20);
let cone = new ConeShape('#00dcff', { x: 2, y: 0, z: 0 }, '#ffffff');
let ground = new BoxShape('#b200ff', { x: 0, y: -5, z: -10 }, '#ffffff', 4, 5, 5);

scene.add(box.mesh);
scene.add(sphere.mesh);
scene.add(cone.mesh);
scene.add(ground.mesh);

shapes.push(box, sphere, cone, ground);

/////////////////// WIREFRAME (ALT + W) \\\\\\\\\\\\\\\\\\\

let wireframeEnabled = false;
window.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 'w') {
        wireframeEnabled = !wireframeEnabled;
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
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
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

/////////////////// LOOP \\\\\\\\\\\\\\\\\\\

let previousTime = performance.now();

function loop(time) {
    requestAnimationFrame(loop);
    stats.update();

    const deltaTime = (time - previousTime) / 1000;
    previousTime = time;

    const accelDirection = new THREE.Vector3();

    if (keys['d']) accelDirection.x += 1;
    if (keys['q']) accelDirection.x -= 1;
    if (keys['z']) accelDirection.z -= 1;
    if (keys['s']) accelDirection.z += 1;
    if (keys['shift']) accelDirection.y = -1;
    if (keys[' ']) accelDirection.y = 1;

    const moveDirection = new THREE.Vector3();

    const UpVector = new THREE.Vector3(0, 1, 0);
    UpVector.normalize();

    const forwardVector = new THREE.Vector3(0, 0, -1);

    forwardVector.applyQuaternion(camera.quaternion);
    forwardVector.y = 0;
    forwardVector.normalize();

    const rightVector = new THREE.Vector3(1, 0, 0);


    rightVector.applyQuaternion(camera.quaternion);
    rightVector.y = 0;
    rightVector.normalize();

    moveDirection.addScaledVector(forwardVector, -accelDirection.z);
    moveDirection.addScaledVector(rightVector, accelDirection.x);
    moveDirection.addScaledVector(UpVector, accelDirection.y);

    moveDirection.normalize();

    PLAYER_VEL.addScaledVector(moveDirection, ACCELERATION * deltaTime);



    const frictionFactor = Math.exp(-FRICTION * deltaTime);
    PLAYER_VEL.x *= frictionFactor;
    PLAYER_VEL.z *= frictionFactor;
    PLAYER_VEL.y *= frictionFactor;

    const newCameraPosition = new THREE.Vector3();
    newCameraPosition.copy(camera.position);
    newCameraPosition.addScaledVector(PLAYER_VEL, deltaTime);

    camera.position.copy(newCameraPosition);

    

    box.mesh.position.y = Math.tan(time * 0.001);
    sphere.mesh.rotation.y = Math.cos(time * 0.001);
    cone.mesh.rotation.x = Math.sin(time * 0.001);


    light.position.x = 10;
    light.lookAt((0,0,0))


    composer.render();
}

loop(performance.now());