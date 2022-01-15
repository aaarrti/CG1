#version 300 es

// defines the precision
precision highp float;
#define pi 3.1415926535897932384626433832795


out vec4 fragColor;
in vec2 uv_interp;

uniform sampler2D sampler;
uniform sampler2D drawing;
uniform sampler2D background;

uniform int shader_type;
in vec3 pos_interp;

in vec2 uv_calc_interp;
in vec3 norm_interp;

// = camera position in world space
uniform vec3 cameraPosition;

uniform sampler2D normal_map;



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
    if (shader_type == 3){
        // Environmental map
        vec3 view_direction = cameraPosition - pos_interp;
        vec3 reflection = reflect(view_direction, norm_interp);
        float u = (pi + atan(-1.* reflection.z, -1.* reflection.x)) / (2. * pi);
        float v = atan(sqrt((reflection.x)*(reflection.x) + (reflection.z)*(reflection.z)), reflection.y) / pi;
        fragColor = texture(background, vec2(u, v));
    }

    if (shader_type == 4){
        // Normal map
        vec4 color = texture(sampler, uv_interp);
        vec4 ambient_light = 0.5 * color;

        // Diffuse aka Lambert
        vec3 vec_to_light = vec3(2., 2., 3.) - pos_interp;
        // a dot b = |a||b| cos(gamma)
        float cos_gamma = dot(vec_to_light, norm_interp) / (length(vec_to_light) * length(norm_interp));
        // cos(0) = 1, cos(pi/2) = 0
        vec4 diffuse_light;
        if (cos_gamma > 0.){
            diffuse_light = color * cos_gamma * 0.5;
        } else {
            diffuse_light = vec4(0., 0., 0., 0.);
        }
        //fragColor = ambient_light;
        //fragColor = diffuse_light;
        fragColor = ambient_light + diffuse_light;
    }
}