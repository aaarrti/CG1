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

uniform vec3 ambient_color;
uniform float ambient_reflectance;


in vec3 normal_out;
uniform int shader_type;
uniform mat3 matrixWorldTransposeInverse;
in vec3 position_f;

// main function gets executed for every pixel
void main(){
    if(shader_type == 0){
        // Basic
        //this colors all fragments (pixels) in the same color (RGBA)
        fragColor = vec4(0, 0, 0, 1);
    }
    if(shader_type  == 1){
        // Ambient
        fragColor = vec4(ambient_reflectance * ambient_color[0] / 255.,
                         ambient_reflectance * ambient_color[1] / 255.,
                         ambient_reflectance * ambient_color[2] / 255., 1.
        );
    }
    if(shader_type == 2){
        // Normal
        fragColor = vec4(normal_out * 0.5 + 0.5, 1.);
    }
    if(shader_type == 3){
        // Toon
        vec3 vec_to_camera = cameraPosition - position_f;
        // a dot b = |a||b| cos(gamma)
        float cos_gamma = dot(vec_to_camera, normal_out) / length(vec_to_camera) * length(normal_out);
        // cos(0) = 1, cos(pi/2) = 0
        if(cos_gamma > 0.){
            fragColor = vec4(0., 0., cos_gamma, 0.);
        }else{
            fragColor = vec4(0., 0., 0., 0.);
        }
    }
}
