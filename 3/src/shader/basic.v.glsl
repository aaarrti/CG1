#version 300 es

// These uniforms and attributes are provided by threejs.
// If you want to add your own, look at https://threejs.org/docs/#api/en/materials/ShaderMaterial #Custom attributes and uniforms
// defines the precision
precision highp float;

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

uniform int shader_type_v;
uniform vec3 light_position;
uniform float diffuse_reflectance;
uniform vec3 diffuse_color;
uniform float specular_reflectance;
uniform float magnitude;
uniform vec3 specular_light;

out vec3 normal_out;
out vec3 position_f;
out vec3 gourard_color;

uniform mat3 matrixWorld;
uniform mat3 matrix;

// main function gets executed for every vertex
void main(){
    normal_out = matrixWorld * matrix * normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
    position_f = position;

    if (shader_type_v == 5){
        // Gourard
        vec3 vec_light_to_obj =  light_position - position_f;

        // specular component
        vec3 ideal_reflection = reflect(vec_light_to_obj, normal_out);
        vec3 vec_to_camera = position_f - cameraPosition;
        float cos_gamma_reflect_view = dot(vec_to_camera, ideal_reflection) / (length(ideal_reflection) * length(vec_to_camera));
        vec3 specular_component;
        if (cos_gamma_reflect_view > 0.){
            specular_component = specular_reflectance * pow(cos_gamma_reflect_view, magnitude) * specular_light / 255.;
        } else {
            specular_component = vec3(0, 0, 0);
        }

        // Lambert component
        float cos_gamma_light = dot(vec_light_to_obj, normal_out) / (length(vec_light_to_obj) * length(normal_out));
        vec3 lamber_component;
        if (cos_gamma_light > 0.){
            lamber_component = diffuse_color * cos_gamma_light * diffuse_reflectance / 255.;
        } else {
            lamber_component = vec3(0, 0, 0) / 2.;
        }
        gourard_color = specular_component + lamber_component;
    }

}
