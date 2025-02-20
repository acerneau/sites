export class verticiesClass {
    constructor(){
        const triangleVerticies = [
            0.5, 0,
            -0.5,-0.2,
            0,-0.7
        ];
        const secondTriangleVerticies = [
        -0.7, 0.6,
        -0.7,-0.2,
        -0.2,0
        ];
        const uv = [
            -0.7, 0.6,
            -0.7,-0.2,
            -0.2,0
            ];
        this.triangleVerticies = triangleVerticies
        this.secondTriangleVerticies = secondTriangleVerticies
    }
}


/**
 * TOP middle | X/Y
 * Bottom left | X/Y
 * Bottom right | X/Y
 **/