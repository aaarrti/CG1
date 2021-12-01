#version 300 es

// defines the precision
precision highp float;

// we have access to the same uniforms as in the vertex shader
// = object.matrixWorld
uniform mat4 modelMatrix;

// = camera.matrixWorldInverse * object.matrixWorld
uniform mat4 modelViewMatrix;

// = camera.projectionMatrix
uniform mat4 projectionMatrix;

// = camera.matrixWorldInverse
uniform mat4 viewMatrix;

// = inverse transpose of modelViewMatrix
uniform mat3 normalMatrix;

// = camera position in world space
uniform vec3 cameraPosition;


out vec4 fragColor;

uniform float ambient_color_r;
uniform float ambient_color_g;
uniform float ambient_color_b;
uniform float ambient_reflectance;

// main function gets executed for every pixel
void main()
{
    //this colors all fragments (pixels) in the same color (RGBA)
    fragColor = vec4(
        ambient_reflectance * ambient_color_r / 255.,
        ambient_reflectance * ambient_color_g / 255.,
        ambient_reflectance * ambient_color_b / 255.,
        1.
    );
}
