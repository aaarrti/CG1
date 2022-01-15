#version 300 es

// defines the precision
precision highp float;
#define pi 3.1415926535897932384626433832795


out vec4 fragColor;
in vec2 uv_interp;

uniform sampler2D sampler;
uniform sampler2D drawing;

uniform int shader_type;
in vec3 pos_interp;

in vec2 uv_calc_interp;



void main(){
    if (shader_type == 0){
        // UV mapping
        fragColor = texture(sampler, uv_interp) + texture(drawing, uv_interp);
    }
    if (shader_type == 1) {
        // spherical
        fragColor = texture(sampler, uv_calc_interp) + texture(drawing, uv_calc_interp);
    }

    if (shader_type == 2){
        // Spherical fixed

        float u = (pi + atan(-1. * pos_interp.z, pos_interp.x)) / (2. * pi);
        float v = atan(sqrt((pos_interp.x)*(pos_interp.x) + (pos_interp.z)*(pos_interp.z)), -1.* pos_interp.y) / pi;
        fragColor = texture(sampler, vec2(u, v)) + texture(drawing, vec2(u, v));

    }
}