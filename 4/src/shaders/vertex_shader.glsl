#version 300 es

// These uniforms and attributes are provided by threejs.
// If you want to add your own, look at https://threejs.org/docs/#api/en/materials/ShaderMaterial #Custom attributes and uniforms
// defines the precision
precision highp float;
#define pi 3.1415926535897932384626433832795

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

// default vertex attributes provided by Geometry and BufferGeometry
in vec3 position;
in vec3 normal;
in vec2 uv;

out vec2 uv_interp;
out vec3 pos_interp;
out vec2 uv_calc_interp;
out vec3 norm_interp;

uniform int shader_type_frag;

void main(){
    // predifined out var
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
    uv_interp = uv;
    pos_interp = position;
    norm_interp = normal;

    if (shader_type_frag == 1){
        // Spherical
        float u = (pi + atan(-1. * pos_interp.z, pos_interp.x)) / (2. * pi);
        float v = atan(sqrt((pos_interp.x)*(pos_interp.x) + (pos_interp.z)*(pos_interp.z)), -1.* pos_interp.y) / pi;
        uv_calc_interp = vec2(u, v);
    }


}