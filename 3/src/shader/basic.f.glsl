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
in vec3 position_f;


uniform int shader_type;
uniform vec3 light_position;
uniform float diffuse_reflectance;
uniform vec3 diffuse_color;
uniform float specular_reflectance;
uniform float magnitude;
uniform vec3 specular_light;

in vec3 gourard_color;

// main function gets executed for every pixel
void main(){
    vec3 normal = normalize(normal_out);
    if (shader_type == 0){
        // Basic
        //this colors all fragments (pixels) in the same color (RGBA)
        fragColor = vec4(0, 0, 0, 1);
    }
    if (shader_type  == 1){
        // Ambient
        fragColor = vec4(ambient_reflectance * ambient_color[0] / 255.,
        ambient_reflectance * ambient_color[1] / 255.,
        ambient_reflectance * ambient_color[2] / 255., 1.
        );
    }
    if (shader_type == 2){
        // Normal
        fragColor = vec4(normalize(normal) * 0.5 + 0.5, 1.0);
    }
    if (shader_type == 3){
        // Toon
        vec3 vec_to_camera = cameraPosition - position_f;
        // a dot b = |a||b| cos(gamma)
        float cos_gamma = dot(vec_to_camera, normal) / (length(vec_to_camera) * length(normal));
        // cos(0) = 1, cos(pi/2) = 0
        if (cos_gamma > 0.){
            fragColor = cos_gamma * vec4(80., 13., 104., 0.) / 255.;
        } else {
            fragColor = vec4(0., 0., 0., 0.);
        }
    }
    if (shader_type == 4){
        // Diffuse aka Lambert
        vec3 vec_to_light = light_position - position_f;
        // a dot b = |a||b| cos(gamma)
        float cos_gamma = dot(vec_to_light, normal) / (length(vec_to_light) * length(normal));
        // cos(0) = 1, cos(pi/2) = 0
        if (cos_gamma > 0.){
            fragColor = vec4(diffuse_color * cos_gamma * diffuse_reflectance / 255., 1.);
        } else {
            fragColor = vec4(0., 0., 0., 0.);
        }
    }

    if (shader_type == 5){
        // Gourard
        fragColor = vec4(gourard_color, 1.0);
    }

    if (shader_type == 6){
        // Phong
        vec3 vec_light_to_obj =  light_position - position_f;

        // specular component
        vec3 ideal_reflection = reflect(vec_light_to_obj, normal);
        vec3 vec_to_camera = position_f - cameraPosition;
        float cos_gamma_reflect_view = dot(vec_to_camera, ideal_reflection) / (length(ideal_reflection) * length(vec_to_camera));
        vec3 specular_component;
        if (cos_gamma_reflect_view > 0.){
            specular_component = specular_reflectance * pow(cos_gamma_reflect_view, magnitude) * specular_light / 255.;
        } else {
            specular_component = vec3(0, 0, 0);
        }

        // Lambert component
        float cos_gamma_light = dot(vec_light_to_obj, normal) / (length(vec_light_to_obj) * length(normal));
        vec3 lamber_component;
        if (cos_gamma_light > 0.){
            lamber_component = diffuse_color * cos_gamma_light * diffuse_reflectance / 255.;
        } else {
            lamber_component = vec3(0, 0, 0) / 2.;
        }
        fragColor = vec4(specular_component + lamber_component, 1.);
    }

    if (shader_type == 7){
        // Blinn Phong
        vec3 view_direction = cameraPosition - position_f;
        vec3 vec_light_to_obj =  light_position - position_f;
        vec3 h = (view_direction + vec_light_to_obj) / length(view_direction + vec_light_to_obj);
        float hn = dot(h, normal);
        vec3 specular_component;
        if (hn > 0.){
            specular_component = specular_reflectance * pow(hn, magnitude) * specular_light / 255.;
        } else {
            specular_component = vec3(0, 0, 0);
        }
        // Lambert component
        float cos_gamma_light = dot(vec_light_to_obj, normal) / (length(vec_light_to_obj) * length(normal));
        vec3 lamber_component;
        if (cos_gamma_light > 0.){
            lamber_component = diffuse_color * cos_gamma_light * diffuse_reflectance / 255.;
        } else {
            lamber_component = vec3(0, 0, 0) / 2.;
        }
        fragColor = vec4(specular_component + lamber_component, 1.);
    }
}
