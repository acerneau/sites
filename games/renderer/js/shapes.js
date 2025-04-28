import * as THREE from 'three';

function createShape(geometry, matColor, defaultPos, wireframeColor = '#ffffff') {
    const material = new THREE.MeshStandardMaterial({ color: matColor });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(defaultPos.x, defaultPos.y, defaultPos.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const collisionBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    collisionBox.setFromObject(mesh);

    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: wireframeColor,
        wireframe: true
    });

    const wire = new THREE.Mesh(geometry, wireframeMaterial);
    wire.scale.multiplyScalar(1.001);
    wire.visible = false;

    mesh.add(wire);

    return { mesh, wire, material, collisionBox };
}

export class BoxShape {
    constructor(matColor = '#ffffff', defaultPos = { x: 0, y: 0, z: 0 }, wireframeColor = '#ffffff', h = 1, w = 1, d = w) {
        const geometry = new THREE.BoxGeometry(w, h, d);
        const { mesh, wire, material, collisionBox } = createShape(geometry, matColor, defaultPos, wireframeColor);
        this.mesh = mesh;
        this.wire = wire;
        this.material = material;
        this.BB = collisionBox;
    }
}

export class SphereShape {
    constructor(matColor = '#ffffff', defaultPos = { x: 0, y: 0, z: 0 }, wireframeColor = '#ffffff', radius = 1, detail = 5) {
        const geometry = new THREE.IcosahedronGeometry(radius, detail);
        const { mesh, wire, material, collisionBox } = createShape(geometry, matColor, defaultPos, wireframeColor);
        this.mesh = mesh;
        this.wire = wire;
        this.material = material;
        this.BB = collisionBox;
    }
}

export class ConeShape {
    constructor(matColor = '#ffffff', defaultPos = { x: 0, y: 0, z: 0 }, wireframeColor = '#ffffff', radius = 1, height = 2) {
        const geometry = new THREE.ConeGeometry(radius, height, 32);
        const { mesh, wire, material, collisionBox } = createShape(geometry, matColor, defaultPos, wireframeColor);
        this.mesh = mesh;
        this.wire = wire;
        this.material = material;
        this.BB = collisionBox;
    }
}

export class PlaneShape {
    constructor(matColor = '#ffffff', defaultPos = { x: 0, y: 0, z: 0 }, wireframeColor = '#ffffff', w = 1, h = 2) {
        const geometry = new THREE.PlaneGeometry(w,w);
        const { mesh, wire, material, collisionBox } = createShape(geometry, matColor, defaultPos, wireframeColor);
        mesh.rotation.x = -Math.PI / 2;
        this.mesh = mesh;
        this.wire = wire;
        this.material = material;
        this.BB = collisionBox;
    }
}
