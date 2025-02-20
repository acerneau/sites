import { sysGlclass } from "./libs/sys.js";
import { ShaderClass } from "./libs/shader.js";
import { RenderClass } from "./libs/render.js";
import { createrClass } from "./libs/builder.js";
import { verticiesClass } from "./verticies.js";

/**############################################### WEBGL init #####################################################**/

const canvas = document.getElementById('webgl')
const gl = canvas.getContext('webgl2');

/**############################################### CLASS import #####################################################**/
const sysGl = new sysGlclass(canvas,gl)
const shaderGl = new ShaderClass(canvas,gl)
const renderGl = new RenderClass(canvas,gl)
const createGl = new createrClass(canvas,gl)
const vertGeo = new verticiesClass()

/**############################################### functions #####################################################**/
// function showMainError(errorText) {
//     const errorBoxDiv = document.getElementById('error-box');
//     const errorSpan = document.createElement('p');
//     errorSpan.innerText = errorText;
//     errorBoxDiv.appendChild(errorSpan);
//     console.error(errorText);
//   }


const TriangleGeoBuffer = gl.createBuffer();
createGl.createTriangle(vertGeo.triangleVerticies,TriangleGeoBuffer,true);

const SecondTriangleGeoBuffer = gl.createBuffer();
createGl.createTriangle(vertGeo.secondTriangleVerticies,SecondTriangleGeoBuffer, true);

const texCoordBuffer = gl.createBuffer();
createGl.createTriangle(vertGeo.secondTriangleVerticies,texCoordBuffer, true);

const vertexShader = shaderGl.compileShader(shaderGl.gl.VERTEX_SHADER,shaderGl.ReadFVertexShader('triangle'));
const fragmentShader = shaderGl.compileShader(shaderGl.gl.FRAGMENT_SHADER,shaderGl.ReadFragmentShader("triangle"));
const triangleShaderProgram = shaderGl.createShaderProgram(vertexShader,fragmentShader);
const vertexPositionAttribLocation = renderGl.getAttribLocation(triangleShaderProgram, 'vertexPosition');


canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
gl.viewport(0,0,canvas.width, canvas.height);

sysGl.clear()

gl.useProgram(triangleShaderProgram);
gl.enableVertexAttribArray(vertexPositionAttribLocation);

renderGl.AssembleAndDraw(TriangleGeoBuffer,vertexPositionAttribLocation,3,false)
renderGl.AssembleAndDraw(SecondTriangleGeoBuffer,vertexPositionAttribLocation,3,false)