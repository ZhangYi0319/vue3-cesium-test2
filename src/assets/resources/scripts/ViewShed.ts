/**
 * 可视域分析
 */
export class ViewShed {
    // 
    private viewer: any;
    private viewPosition: any;
    private viewPositionEnd: any;
    private viewDistance: any;
    private viewHeading: any;
    private viewPitch: any;
    private horizontalViewAngle: any;
    private verticalViewAngle: any;
    private visibleAreaColor: any;
    private invisibleAreaColor: any;
    private enabled: any;
    private softShadows: any;
    private size: any;

    private sketch: any;
    private frustumOutline: any;
    private postStage: any;

    private lightCamera: any;

    private shadowMap: any;

    private glsl = `
    #define USE_CUBE_MAP_SHADOW true  //定义宏
    uniform sampler2D colorTexture;
    uniform sampler2D depthTexture;
    varying vec2 v_textureCoordinates;
    uniform mat4 camera_projection_matrix;
    uniform mat4 camera_view_matrix;
    uniform samplerCube shadowMap_textureCube;
    uniform mat4 shadowMap_matrix;
    uniform vec4 shadowMap_lightPositionEC;
    uniform vec4 shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness;
    uniform vec4 shadowMap_texelSizeDepthBiasAndNormalShadingSmooth;
    uniform float helsing_viewDistance; 
    uniform vec4 helsing_visibleAreaColor;
    uniform vec4 helsing_invisibleAreaColor;
    // 阴影参数
    struct zx_shadowParameters
    {
        vec3 texCoords;
        float depthBias;
        float depth;
        float nDotL;
        vec2 texelStepSize;
        float normalShadingSmooth;
        float darkness;
    };
    float czm_shadowVisibility(samplerCube shadowMap, zx_shadowParameters shadowParameters)
    {
        float depthBias = shadowParameters.depthBias;
        float depth = shadowParameters.depth;
        float nDotL = shadowParameters.nDotL;
        float normalShadingSmooth = shadowParameters.normalShadingSmooth;
        float darkness = shadowParameters.darkness;
        vec3 uvw = shadowParameters.texCoords;
        depth -= depthBias;
        float visibility = czm_shadowDepthCompare(shadowMap, uvw, depth);
        return czm_private_shadowVisibility(visibility, nDotL, normalShadingSmooth, darkness);
    }
    vec4 getPositionEC(){
        return czm_windowToEyeCoordinates(gl_FragCoord);
    }
    // 获取标准向量
    vec3 getNormalEC(){
        return vec3(1.);
    }
    // 视觉裁剪
    vec4 toEye(in vec2 uv,in float depth){
        vec2 xy=vec2((uv.x*2.-1.),(uv.y*2.-1.));  // (0~1)=>(-1~1)
        vec4 posInCamera=czm_inverseProjection*vec4(xy,depth,1.); //投影逆矩阵*裁剪坐标=观察者坐标
        posInCamera=posInCamera/posInCamera.w;
        return posInCamera;
    }
    vec3 pointProjectOnPlane(in vec3 planeNormal,in vec3 planeOrigin,in vec3 point){
        vec3 v01=point-planeOrigin;
        float d=dot(planeNormal,v01);
        return(point-planeNormal*d);
    }
    // 获取深度
    float getDepth(in vec4 depth){
        float z_window=czm_unpackDepth(depth); // 打包vec4,[0,1)之间
        z_window=czm_reverseLogDepth(z_window); // 解包深度
        float n_range=czm_depthRange.near; // 近平面距离
        float f_range=czm_depthRange.far; // 远平面距离
        return(2.*z_window-n_range-f_range)/(f_range-n_range); // 距离，越小越近[-1,1]之间
    }

    // 阴影计算
    float shadow(in vec4 positionEC){
        vec3 normalEC=getNormalEC();
        zx_shadowParameters shadowParameters;
        shadowParameters.texelStepSize=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.xy; //文素步进大小
        shadowParameters.depthBias=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.z; // 深度偏移
        shadowParameters.normalShadingSmooth=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.w; // 法线底纹平滑
        shadowParameters.darkness=shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness.w; // 阴影颜色深度，越小越深
        vec3 directionEC=positionEC.xyz-shadowMap_lightPositionEC.xyz; // 计算位置，点相对于光源的向量
        float distance=length(directionEC); // 距离光源的距离
        directionEC=normalize(directionEC); // 对向量进行规格化,令长度为1
        float radius=shadowMap_lightPositionEC.w; // 点光源半径
        if(distance>radius)
        {
            return 2.0;
        }
        vec3 directionWC=czm_inverseViewRotation*directionEC; // 获取世界坐标
        shadowParameters.depth=distance/radius-0.0003; // 深度计算
        shadowParameters.nDotL=clamp(dot(normalEC,-directionEC),0.,1.); // 向量点乘标准向量,取(0~1),标准向量投影到向量上的长度
        shadowParameters.texCoords=directionWC; // 世界坐标位置
        float visibility=czm_shadowVisibility(shadowMap_textureCube,shadowParameters); //计算阴影可见性
        return visibility;
    }
    // 判断是否可见（视窗范围中）
    bool visible(in vec4 result)
    {
        // 齐次变换，=》规范化设备坐标系
        result.x/=result.w;  
        result.y/=result.w;
        result.z/=result.w;
        // 判断是否在三维-1到1坐标内，在及表示在视窗范围
        return result.x>=-1.&&result.x<=1.
        &&result.y>=-1.&&result.y<=1.
        &&result.z>=-1.&&result.z<=1.;
    }
    void main(){
        // 釉色 = 结构二维(颜色纹理, 纹理坐标)
        gl_FragColor = texture2D(colorTexture, v_textureCoordinates);
        // 深度 = 获取深度(结构二维(深度纹理, 纹理坐标))
        float depth = getDepth(texture2D(depthTexture, v_textureCoordinates));
        // 视角 = (纹理坐标, 深度),观察者坐标
        vec4 viewPos = toEye(v_textureCoordinates, depth);
        // 世界坐标
        vec4 wordPos = czm_inverseView * viewPos;
        // 虚拟相机中坐标
        vec4 vcPos = camera_view_matrix * wordPos; // 虚拟观察者坐标
        float near = .001 * helsing_viewDistance; // 近平面距离，对应创建相机时候的近平面
        float dis = length(vcPos.xyz); // 点到相机的距离
        if(dis > near && dis < helsing_viewDistance){ // 判断是否在近平面与远平面之间
            // 透视投影
            vec4 posInEye = camera_projection_matrix * vcPos; //得到虚拟裁剪坐标（投影坐标）
            // 可视区颜色
            // vec4 helsing_visibleAreaColor=vec4(0.,1.,0.,.5); // 可见颜色
            // vec4 helsing_invisibleAreaColor=vec4(1.,0.,0.,.5); //不可见颜色
            if(visible(posInEye)){
                // vec3 directionEC=viewPos.xyz-shadowMap_lightPositionEC.xyz; // 计算位置，点相对于光源的向量
                // float distance=length(directionEC); // 距离光源的距离
                // float radius=shadowMap_lightPositionEC.w; // 点光源半径
                // float fade = clamp(distance/radius,0.0,1.0);
                float vis = shadow(viewPos);
                // vis = mix(vis, 1.0, fade); 
                // gl_FragColor.rgb *= vis;  // 发现只有0和1
                if(vis > 0.3){
                    gl_FragColor = mix(gl_FragColor,helsing_visibleAreaColor,.5);  // 可看见
                } else{
                    gl_FragColor = mix(gl_FragColor,helsing_invisibleAreaColor,.5); // 不可看见
                }
            }
        }
    }`

    constructor(viewer: any, options: any) {
        this.viewer = viewer;
        this.viewPosition = options.viewPosition;
        this.viewPositionEnd = options.viewPositionEnd;
        this.viewDistance = this.viewPositionEnd ? Cesium.Cartesian3.distance(this.viewPosition, this.viewPositionEnd) : (options.viewDistance || 100.0);
        this.viewHeading = this.viewPositionEnd ? this.getHeading(this.viewPosition, this.viewPositionEnd) : (options.viewHeading || 0.0);
        this.viewPitch = this.viewPositionEnd ? this.getPitch(this.viewPosition, this.viewPositionEnd) : (options.viewPitch || 0.0);
        this.horizontalViewAngle = options.horizontalViewAngle || 90.0;
        this.verticalViewAngle = options.verticalViewAngle || 60.0;
        this.visibleAreaColor = options.visibleAreaColor || Cesium.Color.GREEN;
        this.invisibleAreaColor = options.invisibleAreaColor || Cesium.Color.RED;
        this.enabled = (typeof options.enabled === "boolean") ? options.enabled : true;
        this.softShadows = (typeof options.softShadows === "boolean") ? options.softShadows : true;
        this.size = options.size || 2048;
        this.update();
    }

    add() {
        this.createLightCamera();
        this.createShadowMap();
        this.createPostStage();
        this.drawFrustumOutline();
        this.drawSketch();
    }

    update() {
        this.clear();
        this.add();
    }

    clear() {
        if (this.sketch) {
            this.viewer.entities.removeById(this.sketch.id);
            this.sketch = null;
        }
        if (this.frustumOutline) {
            this.frustumOutline.destroy();
            this.frustumOutline = null;
        }
        if (this.postStage) {
            this.viewer.scene.postProcessStages.remove(this.postStage);
            this.postStage = null;
        }
    }

    createLightCamera() {
        this.lightCamera = new Cesium.Camera(this.viewer.scene);
        this.lightCamera.position = this.viewPosition;
        // if (this.viewPositionEnd) {
        //     let direction = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(this.viewPositionEnd, this.viewPosition, new Cesium.Cartesian3()), new Cesium.Cartesian3());
        //     this.lightCamera.direction = direction; // direction是相机面向的方向
        // }
        this.lightCamera.frustum.near = this.viewDistance * 0.001;
        this.lightCamera.frustum.far = this.viewDistance;
        const hr = Cesium.Math.toRadians(this.horizontalViewAngle);
        const vr = Cesium.Math.toRadians(this.verticalViewAngle);
        const aspectRatio =
            (this.viewDistance * Math.tan(hr / 2) * 2) /
            (this.viewDistance * Math.tan(vr / 2) * 2);
        this.lightCamera.frustum.aspectRatio = aspectRatio;
        if (hr > vr) {
            this.lightCamera.frustum.fov = hr;
        } else {
            this.lightCamera.frustum.fov = vr;
        }
        this.lightCamera.setView({
            destination: this.viewPosition,
            orientation: {
                heading: Cesium.Math.toRadians(this.viewHeading || 0),
                pitch: Cesium.Math.toRadians(this.viewPitch || 0),
                roll: 0
            }
        });
    }


    createShadowMap() {
        debugger
        this.shadowMap = new Cesium.ShadowMap({
            context: (this.viewer.scene).context,
            lightCamera: this.lightCamera,
            enabled: this.enabled,
            isPointLight: true,
            pointLightRadius: this.viewDistance,
            cascadesEnabled: false,
            size: this.size,
            softShadows: this.softShadows,
            normalOffset: false,
            fromLightSource: false
        });
        this.viewer.scene.shadowMap = this.shadowMap;
        debugger
    }


    createPostStage() {
        const fs = this.glsl;
        const postStage = new Cesium.PostProcessStage({
            fragmentShader: fs,
            uniforms: {
                shadowMap_textureCube: () => {
                    this.shadowMap.update(Reflect.get(this.viewer.scene, "_frameState"));
                    return Reflect.get(this.shadowMap, "_shadowMapTexture");
                },
                shadowMap_matrix: () => {
                    this.shadowMap.update(Reflect.get(this.viewer.scene, "_frameState"));
                    return Reflect.get(this.shadowMap, "_shadowMapMatrix");
                },
                shadowMap_lightPositionEC: () => {
                    this.shadowMap.update(Reflect.get(this.viewer.scene, "_frameState"));
                    return Reflect.get(this.shadowMap, "_lightPositionEC");
                },
                shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness: () => {
                    this.shadowMap.update(Reflect.get(this.viewer.scene, "_frameState"));
                    const bias = this.shadowMap._pointBias;
                    return Cesium.Cartesian4.fromElements(
                        bias.normalOffsetScale,
                        this.shadowMap._distance,
                        this.shadowMap.maximumDistance,
                        0.0,
                        new Cesium.Cartesian4()
                    );
                },
                shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: () => {
                    this.shadowMap.update(Reflect.get(this.viewer.scene, "_frameState"));
                    const bias = this.shadowMap._pointBias;
                    console.log(bias.depthBias);

                    const scratchTexelStepSize = new Cesium.Cartesian2();
                    const texelStepSize = scratchTexelStepSize;
                    texelStepSize.x = 1.0 / this.shadowMap._textureSize.x; //获取文素x
                    texelStepSize.y = 1.0 / this.shadowMap._textureSize.y; //获取文素y

                    return Cesium.Cartesian4.fromElements(
                        texelStepSize.x,
                        texelStepSize.y,
                        bias.depthBias,
                        bias.normalShadingSmooth,
                        new Cesium.Cartesian4()
                    );
                },
                camera_projection_matrix: this.lightCamera.frustum.projectionMatrix, // 透视投影，锥体的投影矩阵
                camera_view_matrix: this.lightCamera.viewMatrix, // 相机视图矩阵，用于将世界坐标变为观察者坐标
                helsing_viewDistance: () => {
                    return this.viewDistance;
                    // return this.lightCamera.frustum.near;
                },
                helsing_visibleAreaColor: this.visibleAreaColor,
                helsing_invisibleAreaColor: this.invisibleAreaColor,
            }
        });
        this.postStage = this.viewer.scene.postProcessStages.add(postStage);
    }


    drawFrustumOutline() {
        const scratchRight = new Cesium.Cartesian3();
        const scratchRotation = new Cesium.Matrix3();
        const scratchOrientation = new Cesium.Quaternion();
        const position = this.lightCamera.positionWC;
        const direction = this.lightCamera.directionWC;
        const up = this.lightCamera.upWC;
        let right = this.lightCamera.rightWC;
        right = Cesium.Cartesian3.negate(right, scratchRight);
        let rotation = scratchRotation;
        Cesium.Matrix3.setColumn(rotation, 0, right, rotation);
        Cesium.Matrix3.setColumn(rotation, 1, up, rotation);
        Cesium.Matrix3.setColumn(rotation, 2, direction, rotation);
        let orientation = Cesium.Quaternion.fromRotationMatrix(rotation, scratchOrientation);

        let instance = new Cesium.GeometryInstance({
            geometry: new Cesium.FrustumOutlineGeometry({
                frustum: this.lightCamera.frustum,
                origin: this.viewPosition,
                orientation: orientation
            }),
            id: Math.random().toString(36).substr(2),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                    Cesium.Color.YELLOWGREEN//new Cesium.Color(0.0, 1.0, 0.0, 1.0)
                ),
                show: new Cesium.ShowGeometryInstanceAttribute(true)
            }
        });

        this.frustumOutline = this.viewer.scene.primitives.add(
            new Cesium.Primitive({
                geometryInstances: [instance],
                appearance: new Cesium.PerInstanceColorAppearance({
                    flat: true,
                    translucent: false
                })
            })
        );
    }

    drawSketch() {
        this.sketch = this.viewer.entities.add({
            name: 'sketch',
            position: this.viewPosition,
            orientation: Cesium.Transforms.headingPitchRollQuaternion(
                this.viewPosition,
                Cesium.HeadingPitchRoll.fromDegrees(this.viewHeading - this.horizontalViewAngle, this.viewPitch, 0.0)
            ),
            ellipsoid: {
                radii: new Cesium.Cartesian3(
                    this.viewDistance,
                    this.viewDistance,
                    this.viewDistance
                ),
                // innerRadii: new Cesium.Cartesian3(2.0, 2.0, 2.0),
                minimumClock: Cesium.Math.toRadians(-this.horizontalViewAngle / 2),
                maximumClock: Cesium.Math.toRadians(this.horizontalViewAngle / 2),
                minimumCone: Cesium.Math.toRadians(this.verticalViewAngle + 7.75),
                maximumCone: Cesium.Math.toRadians(180 - this.verticalViewAngle - 7.75),
                fill: false,
                outline: true,
                subdivisions: 256,
                stackPartitions: 64,
                slicePartitions: 64,
                outlineColor: Cesium.Color.YELLOWGREEN
            }
        });
    }


    getHeading(fromPosition: any, toPosition: any) {
        let finalPosition = new Cesium.Cartesian3();
        let matrix4 = Cesium.Transforms.eastNorthUpToFixedFrame(fromPosition);
        Cesium.Matrix4.inverse(matrix4, matrix4);
        Cesium.Matrix4.multiplyByPoint(matrix4, toPosition, finalPosition);
        Cesium.Cartesian3.normalize(finalPosition, finalPosition);
        return Cesium.Math.toDegrees(Math.atan2(finalPosition.x, finalPosition.y));
    }

    getPitch(fromPosition: any, toPosition: any) {
        let finalPosition = new Cesium.Cartesian3();
        let matrix4 = Cesium.Transforms.eastNorthUpToFixedFrame(fromPosition);
        Cesium.Matrix4.inverse(matrix4, matrix4);
        Cesium.Matrix4.multiplyByPoint(matrix4, toPosition, finalPosition);
        Cesium.Cartesian3.normalize(finalPosition, finalPosition);
        return Cesium.Math.toDegrees(Math.asin(finalPosition.z));
    }



}