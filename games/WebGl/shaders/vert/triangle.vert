#version 300 es
precision mediump float;

in vec2 vertexPosition;
//in ve2 aTexCoord;

//out vec2 vTexCoord;
void main() {
    //vTexCoord = aTexCoord;
    gl_Position = vec4(vertexPosition, 0.0,1.0);
}