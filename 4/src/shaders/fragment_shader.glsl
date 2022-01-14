#version 300 es

// defines the precision
precision highp float;


out vec4 fragColor;
in vec2 uv_interp;

uniform sampler2D sampler;

void main(){
    fragColor = texture(sampler, uv_interp) + 0.2;
    //fragColor = vec4(uv_interp, 0., 0.);
}