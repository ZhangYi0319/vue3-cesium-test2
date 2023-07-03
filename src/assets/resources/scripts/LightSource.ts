/*
 * @license: 张怡 版权所有
 * @作者: 张怡
 * @创建时间: 2023-02-17 14:30:42
 * @名称: cesium光源
 * @修改人: 张怡
 * @修改时间: 2023-02-21 16:16:31
 * @描述: 
 * 
 */

import * as Cesium from "cesium";

export class PointLightSource {
    /**
     * 相机位置
     */
    private cameraPositionWC: any;
    private lightColor: any;
    private lightPosition: any;

    constructor(option: any) {
        this.cameraPositionWC = option.cameraPositionWC;
        this.lightColor = option.lightColor;
        this.lightPosition = option.lightPosition ? option.lightPosition : new Cesium.Cartesian3();
        this.init();
    }

    /**
     * 创建CustomShader
     * @returns CustomShader
     */
    createCustomShader(lightColor?: any, lightPosition?: any): Cesium.CustomShader {

        // 启用实验功能 已经不用了
        // (Cesium as any).ExperimentalFeatures.enableModelExperimental = true;

        this.lightColor = lightColor ? lightColor : Cesium.Color.WHITE;
        this.lightPosition = lightPosition ? lightPosition : new Cesium.Cartesian3();

        const customShader = new Cesium.CustomShader({
            lightingModel: Cesium.LightingModel.PBR,
            uniforms: {
                u_cameraDirectionWC: {
                    type: Cesium.UniformType.VEC3,
                    value: this.cameraPositionWC
                },
                u_lightColor: {
                    type: Cesium.UniformType.VEC4,
                    value: this.lightColor,
                },
                u_lightPosition: {
                    type: Cesium.UniformType.VEC3,
                    value: this.lightPosition,
                },
            },
            fragmentShaderText:
                `
            vec4 makeLight(vec4 lightColorHdr,vec3 lightPos,
                vec3 positionWC,vec3 positionEC,vec3 normalEC,czm_pbrParameters pbrParameters)
              {
                vec3 color = vec3(0.0);
                float mx1 = 1.0;
                vec3 light1Dir = positionWC - lightPos;
                float distance1 = length(light1Dir);
                if(distance1 < 1000.0){
                  vec4 l1 = czm_view * vec4(lightPos, 1.0);
                  vec3 lightDirectionEC = l1.xyz - positionEC;
                  mx1 = 1.0 - distance1 / 1000.0;
                  color = czm_pbrLighting(
                    positionEC,
                    normalEC,
                    lightDirectionEC,
                    lightColorHdr.xyz,
                    pbrParameters
                  ).xyz;
                }
                mx1 = max(color.r,max(color.g,color.b)) * pow(mx1,1.0) * 10.0;
                return vec4(color,mx1);
              }
              void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
              {
                material.diffuse = vec3(1.0);
                vec3 positionWC = fsInput.attributes.positionWC;
                vec3 normalEC = fsInput.attributes.normalEC;
                vec3 positionEC = fsInput.attributes.positionEC;
      
                vec3 lightColorHdr = czm_lightColorHdr;
                vec3 lightDirectionEC = czm_lightDirectionEC;
                lightDirectionEC = (czm_view * vec4(u_cameraDirectionWC,1.0)).xyz - positionEC;
      
                czm_pbrParameters pbrParameters;
                pbrParameters.diffuseColor = material.diffuse;
                pbrParameters.f0 = vec3(0.5);
                pbrParameters.roughness = 1.0;
      
                vec3 ligth1Color = czm_pbrLighting(
                  positionEC,
                  normalEC,
                  lightDirectionEC,
                  lightColorHdr,
                  pbrParameters
                );
      
                vec4 ligth1ColorR = makeLight(u_lightColor,u_lightPosition,positionWC,positionEC,normalEC,pbrParameters);
      
                vec3 finalColor = mix(ligth1Color.rgb, ligth1ColorR.rgb, ligth1ColorR.a);
                material.diffuse = finalColor;
              }
            `
        })
        return customShader;
    }

    init() {
        console.log('点光源');
    }

}


export class ExampleSource {
    constructor() {
        this.init();
    }
    init() {

    }
    createCustomShader(lightColor: any, lightPosition: any, lightRadius: any) {
        const customShader = new Cesium.CustomShader({
            mode: Cesium.CustomShaderMode.MODIFY_MATERIAL,
            lightingModel: Cesium.LightingModel.UNLIT,
            uniforms: {
                // 点光源半径
                u_lightRadius: {
                    type: Cesium.UniformType.FLOAT,
                    value: lightRadius,
                },
                // 点光源颜色
                u_lightColor: {
                    type: Cesium.UniformType.VEC4,
                    value: lightColor,
                },
                // 点光源位置
                u_lightPosition: {
                    type: Cesium.UniformType.VEC3,
                    value: lightPosition,
                },
            },
            // varyings: {
            //     v_selectedColor: Cesium.VaryingType.VEC4
            // },
            // vertexShaderText: `
            // void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
            // }
            // `,
            fragmentShaderText: `
            void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                    // 光源到片元矢量
                    vec3 lightVector = fsInput.attributes.positionWC - u_lightPosition;
                    // 计算距离
                    float lightDistance = length(lightVector);
                    // 定义默认颜色
                    vec3 color;
                    float mx1 = 1.0;
                    material.diffuse =mix(material.diffuse,vec3(0.0),0.5);
                    if(lightDistance < u_lightRadius*0.9){
                        vec3 positionEC = fsInput.attributes.positionEC;
                        vec3 normalEC = fsInput.attributes.normalEC;
                        vec3 lightColorHdr = czm_lightColorHdr;
                        lightColorHdr = u_lightColor.rgb;
                        vec3 lightDirectionEC = czm_lightDirectionEC;
                        vec4 eyePosition = czm_view * vec4(u_lightPosition, 1.0);
                        lightDirectionEC = eyePosition.xyz - positionEC;
                        czm_pbrParameters pbrParameters;
                        pbrParameters = czm_pbrMetallicRoughnessMaterial(material.diffuse,1.0,1.0);
                        color = czm_pbrLighting(
                          positionEC,
                          normalEC,
                          lightDirectionEC,
                          lightColorHdr,
                          pbrParameters
                        );
                        mx1 = 1.0 - lightDistance / u_lightRadius;
                        mx1 = 1.0 * pow(mx1,1.0) * 10.0;
                        material.diffuse = mix(color, material.diffuse,mx1);
                    }
        }`
        });


        // new Cesium.CustomShader({
        //     // Any custom uniforms the user wants to add to the shader.
        //     // these can be changed at runtime via customShader.setUniform()
        //     uniforms: {
        //         u_time: {
        //             value: 0, // initial value
        //             type: Cesium.UniformType.FLOAT
        //         },
        //         // Textures can be loaded from a URL, a Resource, or a TypedArray.
        //         // See the Uniforms section for more detail
        //         u_externalTexture: {
        //             value: new Cesium.TextureUniform({
        //                 url: "/assets/resources/images/bricknormal.png"
        //             }),
        //             type: Cesium.UniformType.SAMPLER_2D
        //         }
        //     },
        //     // Custom varyings that will appear in the custom vertex and fragment shader
        //     // text.
        //     varyings: {
        //         v_customTexCoords: Cesium.VaryingType.VEC2
        //     },
        //     // configure where in the fragment shader's materials/lighting pipeline the
        //     // custom shader goes. More on this below.
        //     mode: Cesium.CustomShaderMode.MODIFY_MATERIAL,
        //     // either PBR (physically-based rendering) or UNLIT depending on the desired
        //     // results.
        //     lightingModel: Cesium.LightingModel.PBR,
        //     // Force the shader to render as transparent, even if the primitive had
        //     // an opaque material
        //     translucencyMode: Cesium.CustomShaderTranslucencyMode.TRANSLUCENT,
        //     // Custom vertex shader. This is a function from model space -> model space.
        //     // VertexInput is documented below
        //     vertexShaderText: `
        //       // IMPORTANT: the function signature must use these parameter names. This
        //       // makes it easier for the runtime to generate the shader and make optimizations.
        //       void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
        //           // code goes here. An empty body is a no-op.
        //       }
        //     `,
        //     // Custom fragment shader.
        //     // FragmentInput will be documented below
        //     // Regardless of the mode, this always takes in a material and modifies it in place.
        //     fragmentShaderText: `
        //       // IMPORTANT: the function signature must use these parameter names. This
        //       // makes it easier for the runtime to generate the shader and make optimizations.
        //       void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        //           // code goes here. e.g. to set the diffuse color to a translucent red:
        //           material.diffuse = vec3(1.0, 0.0, 0.0);
        //           material.alpha = 0.5;
        //       }
        //     `,
        // });

        return customShader;
    }
}