import * as Cesium from "cesium";

export class MyPrimitive {

    public drawCommand: any;

    public modelMatrix: any;

    constructor(modelMatrix: any) {
        this.modelMatrix = modelMatrix ? modelMatrix : Cesium.Matrix4.IDENTITY.clone();
    }

    createCommand(context: any): any {
        // 创建盒子Geometry
        let box = new Cesium.BoxGeometry({
            vertexFormat: Cesium.VertexFormat.POSITION_ONLY,
            maximum: new Cesium.Cartesian3(250000, 250000, 250000),
            minimum: new Cesium.Cartesian3(-250000, -250000, -250000)
        })
        const geometry = Cesium.BoxGeometry.createGeometry(box);
        //创建顶点属性索引， key为属性名称， value为顶点属性缓冲区在同一个着色器程序中的索引。
        // 相当于将js中的顶点数组，传递到shader中的attribute变量
        let attributeLocations = Cesium.GeometryPipeline.createAttributeLocations(geometry as any);
        // 创建顶点数组对象
        let va = (Cesium as any).VertexArray.fromGeometry({
            context: context,
            geometry: geometry,
            attributeLocations: attributeLocations
        })
        let vs = `
        attribute vec3 position;
        void main(){
            gl_Position = czm_projection * czm_modelView * vec4( position , 1. );
        }
        `;
        let fs = `
        uniform vec3 color;
        void main(){
            gl_FragColor=vec4(color,1.);
        }
        `;
        let shaderProgram = (Cesium as any).ShaderProgram.fromCache({
            context: context,
            vertexShaderSource: vs,
            fragmentShaderSource: fs,
            attributeLocations: attributeLocations
        })

        let uniformMap = {
            color() {
                return Cesium.Color.RED
            }
            // color: () => 
        }
        // renderState
        // 渲染状态对象，封装如深度测试（depthTest）、剔除（cull）、混合（blending）等状态类型的参数设置。
        // 其中涉及多个技术，后面会展开部分来介绍，其余的在使用中慢慢掌握。
        // var defaults = {
        //     frontFace: (Cesium as any).winding0rder.COUNTER_CLOCKWISE,
        //     cull: {
        //         enabled: false,
        //         face: (Cesium as any).cullFace.BACK
        //     },
        //     linewidth: 1, polygon0ffset: {
        //         enabled: false,
        //         factor: 0,
        //         units: 0
        //     },
        //     scissorTest: {
        //         enabled: false,
        //         rectangle: {
        //             x: 0,
        //             y: 0,
        //             width: 0,
        //             height: 0
        //         }
        //     },
        //     depthRange: {
        //         near: 0,
        //         far: 1
        //     },
        //     depthTest: {
        //         enabled: false,
        //         func: (Cesium as any).DepthFunction.LESS
        //     },
        //     colorMask: {
        //         red: true,
        //         green: true,
        //         blue: true,
        //         alpha: true
        //     },
        //     depthMask: true,
        //     stencilMask: ~0,
        //     blending: {
        //         enabled: false,
        //         color: {
        //             red: 0.0,
        //             green: 0.0,
        //             blue: 0.0,
        //             alpha: 0.0
        //         },
        //         equationRgb: (Cesium as any).BlendEquation.ADD,
        //         equationAlpha: (Cesium as any).BlendEquation.ADD,
        //         functionSourceRgb: (Cesium as any).BlendFunction.ONE,
        //         functionSourceAlpha: (Cesium as any).BlendFunction.ONE,
        //         functionDestinationRgb: (Cesium as any).BlendFunction.ZERO,
        //         functionDestinationAlpha: (Cesium as any).BlendFunction.ZERO
        //     },
        //     stencilTest: {
        //         enabled: false,
        //         frontFunction: (Cesium as any).StencilFunction.ALWAYs,
        //         backFunction: (Cesium as any).StencilFunction.ALWAYS,
        //         reference: 0,
        //         mask: ~0,
        //         frontoperation: {
        //             fail: (Cesium as any).Stencil0peration.KEEP,
        //             zFail: (Cesium as any).Stencil0peration.KEEP,
        //             zPass: (Cesium as any).Stencil0peration.KEEP
        //         },
        //         backOperation: {
        //             fail: (Cesium as any).Stencil0peration.KEEP,
        //             zFail: (Cesium as any).Stenciloperation.KEEP,
        //             zPass: (Cesium as any).Stencil0peration.KEEP
        //         }
        //     },
        //     samplecoverage: {
        //         enabled: false, value: 1.0,
        //         invert: false
        //     }
        // };
        // var renderState = (Cesium as any).RenderState.fromCache(defaults)
        var renderState = (Cesium as any).RenderState.fromCache({
            cull: {
                enabled: true,
                face: (Cesium as any).CullFace.BACK
            },
            depthTest: {
                enabled: true
            }
        })

        this.drawCommand = new (Cesium as any).DrawCommand({
            modelMatrix: this.modelMatrix,
            vertexArray: va,
            shaderProgram: shaderProgram,
            uniformMap: uniformMap,
            renderState: renderState,
            pass: (Cesium as any).Pass.OPAQUE
        })
        return this.drawCommand;
    }

    update(frameState: any) {
        debugger
        if (!this.drawCommand) {
            this.drawCommand = this.createCommand(frameState.context);
        }
        frameState.commandList.push(this.drawCommand)
    }

}