import { useMapDataStore } from '@/stores/mapData'
import type { ParticleSystem } from 'cesium';
// import * as Cesium from "cesium";
/**
 * 发射器类型
 */
export enum EmitterType {
    /**
     * 盒子发射器
     */
    BoxEmitter = 'BoxEmitter',
    /**
     * 圆形发射器
     */
    CircleEmitter = 'CircleEmitter',
    /**
     * 锥形发射器
     */
    ConeEmitter = 'ConeEmitter',
    /**
     * 球形发射器
     */
    SphereEmitter = 'SphereEmitter',
}

/**
 * 雨/雪量大小
 */
export enum SizeType {
    /**
     * 小
     */
    small = 'small',
    /**
     * 中
     */
    medium = 'medium',
    /**
     * 大
     */
    large = 'large',
    /**
     * 特大
     */
    extraordinary = 'extraordinary',
}

export class CesiumParticleSystem {

    constructor(
        private mapDataStore = useMapDataStore()
    ) { }

    /**
     * 移除粒子
     * @param particle 
     */
    public removeParticle(particle: ParticleSystem): void {
        if (particle) {
            this.mapDataStore.cesiumViewer.scene.primitives.remove(particle)
        }
    }
    /**
     * 移除所有粒子
     */
    public removeAllParticle(): void {
        (this.mapDataStore.cesiumViewer.scene.primitives as any)._primitives.forEach((particle: any) => {
            // 判断是否为 Cesium.ParticleSystem 类型
            debugger;
            if (particle instanceof Cesium.ParticleSystem) {
                this.mapDataStore.cesiumViewer.scene.primitives.remove(particle)
            }
        });
    }

    /**
     * 火焰粒子效果
     * @param emitterType 定义发射器类型
     * @param modelLocation 模型位置
     * @param sizeInMeters 是否以米单位
     * @param emissionRate 粒子数量
     * @param emitterOptions 发射器参数
     * @param startAlpha 开始透明度
     * @param endAlpha 结束透明度
     * @param startScale 开始比例
     * @param endScale 结束比例
     * @param minimumParticleLife 最小生命长度 
     * @param maximumParticleLife 最大生命长度
     * @param minimumSpeed 最小速度
     * @param maximumSpeed 最大速度
     * @param imageSizeX 图片x大小
     * @param imageSizeY 图片y大小
     * @returns particle
     */
    public addFireParticle(emitterType = EmitterType.CircleEmitter, modelLocation = { lon: 116.45, lat: 39.932, alt: 0 },
        sizeInMeters = true, emissionRate = 100,
        emitterOptions = { radius: 10, boxWidth: 1.0, boxHeight: 1.0, boxDepth: 1.0, coneAngle: 30.0 },
        startAlpha = 0.2, endAlpha = 0.001, startScale = 1, endScale = 10,
        minimumParticleLife = 3, maximumParticleLife = 4, minimumSpeed = 15, maximumSpeed = 25,
        imageSizeX = 5, imageSizeY = 5): any {
        debugger
        const self = this;
        // 发射器
        let emitter: any;
        switch (emitterType) {
            case EmitterType.CircleEmitter:
                emitter = new Cesium.CircleEmitter(emitterOptions.radius);
                break;
            case EmitterType.BoxEmitter:
                emitter = new Cesium.BoxEmitter(
                    new Cesium.Cartesian3(emitterOptions.boxWidth,
                        emitterOptions.boxHeight,
                        emitterOptions.boxDepth));
                break;
            case EmitterType.ConeEmitter:
                emitter = new Cesium.ConeEmitter(emitterOptions.coneAngle);
                break;
            case EmitterType.SphereEmitter:
                emitter = new Cesium.SphereEmitter(emitterOptions.radius)
                break;
        }
        // 火焰时间参数，用于控制烟雾发散
        let fireTime = 0;
        const particle = new Cesium.ParticleSystem({
            image: "/assets/resources/images/particle/fire.png",
            startColor: Cesium.Color.RED.withAlpha(startAlpha),
            endColor: Cesium.Color.BLACK.withAlpha(endAlpha),
            startScale,
            endScale,
            // 存活时间
            minimumParticleLife,
            maximumParticleLife,
            // 速度
            minimumSpeed,
            maximumSpeed,
            // 图片大小
            imageSize: new Cesium.Cartesian2(imageSizeX, imageSizeY),
            // 是否以米
            sizeInMeters,
            // 粒子数量
            emissionRate,
            // 发射器
            emitter,
            // 世界坐标系矩阵，模型位置
            modelMatrix: self.computeModelMatrix(modelLocation),
            // 以发射器为原点的矩阵，
            emitterModelMatrix: self.computeEmitterModelMatrix(),
            updateCallback: (particle: any, dt: any) => {
                const position = particle.position;
                const ellipsoid = self.mapDataStore.cesiumViewer.scene.globe.ellipsoid;
                const cartographic = ellipsoid.cartesianToCartographic(position);
                const lon = Cesium.Math.toDegrees(cartographic.longitude);
                const lat = Cesium.Math.toDegrees(cartographic.latitude);
                const alt = cartographic.height;
                debugger;
                fireTime += dt;
                let n = 0;
                let t = 0;
                // ~~取整
                switch (~~fireTime % 4) {
                    case 0:
                        n = 0.1;
                        break;
                    case 1:
                        n = -0.1;
                        break;
                    case 2:
                        t = 0.1;
                        break;
                    case 3:
                        t = -0.1;
                        break;
                }
                // 创建一个方位点，形成矢量，改变方向，经度东西，纬度南北，高度上下
                const position1 = Cesium.Cartesian3.fromDegrees(lon + n, lat + t, alt);
                // 创建矢量并归一化
                let vectorSpeed = new Cesium.Cartesian3(
                    position1.x - position.x,
                    position1.y - position.y,
                    position1.z - position.z
                );
                vectorSpeed = Cesium.Cartesian3.normalize(vectorSpeed, new Cesium.Cartesian3());
                Cesium.Cartesian3.fromElements(
                    vectorSpeed.x * 2.0,
                    vectorSpeed.y * 2.0,
                    vectorSpeed.z * 1.0,
                    vectorSpeed
                );
                // console.log(dt);
                // Cesium.Cartesian3.multiplyByScalar(gravityVector, -9.8 * dt, gravityVector);
                Cesium.Cartesian3.add(particle.velocity, vectorSpeed, particle.velocity);
            },
        });
        self.mapDataStore.cesiumViewer.scene.primitives.add(particle);
        // this.mapDataStore.cesiumViewer.camera.setView({
        //     destination: Cesium.Cartesian3.fromDegrees(116.45, 39.932, 3000),
        // });
        return particle;
    }

    /**
     * 添加下雪粒子效果
     * @param position 位置
     * @param circleRadius 半径
     * @param sizeType 大小
     * @returns ParticleSystem
     */
    public addSnowParticle(
        position = { lon: 116.45, lat: 39.932, alt: 100 },
        circleRadius = 100,
        sizeType: SizeType = SizeType.medium): any {

        let minimumParticleLife = position.alt / 6;
        let maximumParticleLife = 2 + position.alt / 6;
        const minimumSpeed = 5;
        const maximumSpeed = 6;
        let emissionRate = 1000
        switch (sizeType) {
            case SizeType.small:
                emissionRate = Math.PI * circleRadius * circleRadius * 0.003;
                break;
            case SizeType.medium:
                emissionRate = Math.PI * circleRadius * circleRadius * 0.008;
                break;
            case SizeType.large:
                emissionRate = Math.PI * circleRadius * circleRadius * 0.015;
                break;
            case SizeType.extraordinary:
                emissionRate = Math.PI * circleRadius * circleRadius * 0.03;
                break;
        }

        const particle = new Cesium.ParticleSystem({
            image: "/assets/resources/images/particle/snowflake.png",
            startColor: Cesium.Color.WHITE.withAlpha(0.5),
            endColor: Cesium.Color.WHITE.withAlpha(0.3),
            startScale: 1,
            endScale: 2,
            // 存活时间 G
            minimumParticleLife,
            maximumParticleLife,
            // 速度
            minimumSpeed,
            maximumSpeed,
            // 图片大小
            imageSize: new Cesium.Cartesian2(5, 5),
            // 是否以米
            sizeInMeters: false,
            // 粒子数量
            emissionRate,
            // 发射器
            emitter: new Cesium.CircleEmitter(circleRadius),
            // 世界坐标系矩阵，模型位置
            modelMatrix: this.computeModelMatrix(position),
            // 以发射器为原点的矩阵，
            emitterModelMatrix: this.computeEmitterModelMatrix(
                -180,
                0,
                180
            ),
            // updateCallback: applyGravity,
        });
        this.mapDataStore.cesiumViewer.scene.primitives.add(particle);
        return particle;
    }

    /**
     * 位置矩阵
     * @param position 位置 经度，纬度，高度
     * @returns 
     */
    public computeModelMatrix(position: any) {
        const center = Cesium.Cartesian3.fromDegrees(position.lon, position.lat, position.alt);
        const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        return matrix;
    }

    /**
     * 定义发射器为中心的矩阵，用来平移、旋转和缩放
     * @param h 朝向
     * @param p 俯仰
     * @param r 滚转
     * @param tx x轴移动
     * @param ty y轴移动
     * @param tz z轴移动
     * @param sx x轴缩放
     * @param sy y轴缩放
     * @param sz z轴缩放
     * @returns 
     */
    public computeEmitterModelMatrix(h = 0, p = 0, r = 0, tx = 0, ty = 0, tz = 0, sx = 1.0, sy = 1.0, sz = 1.0) {
        // 粒子的朝向，俯仰，滚转
        let hpr = Cesium.HeadingPitchRoll.fromDegrees(h, p, r);
        // 由平移、旋转和缩放定义的仿射变换。
        let trs = new Cesium.TranslationRotationScale();
        // 位置矩阵
        // 平移
        trs.translation = Cesium.Cartesian3.fromElements(tx, ty, tz);
        // 旋转
        trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(hpr);

        trs.scale = new Cesium.Cartesian3(sx, sy, sz)
        // 创建Matrix4矩阵
        let result = Cesium.Matrix4.fromTranslationRotationScale(trs);
        return result;
    }


    // applyGravity(particle: any, dt: any) {
    //     const position = particle.position;
    //     const ellipsoid = this.mapDataStore.cesiumViewer.scene.globe.ellipsoid;
    //     const cartographic = ellipsoid.cartesianToCartographic(position);
    //     const lon = Cesium.Math.toDegrees(cartographic.longitude);
    //     const lat = Cesium.Math.toDegrees(cartographic.latitude);
    //     const alt = cartographic.height;
    //     debugger;
    //     this.fireTime += dt;
    //     let n = 0;
    //     let t = 0;
    //     // ~~取整
    //     switch (~~this.fireTime % 4) {
    //         case 0:
    //             n = 0.1;
    //             break;
    //         case 1:
    //             n = -0.1;
    //             break;
    //         case 2:
    //             t = 0.1;
    //             break;
    //         case 3:
    //             t = -0.1;
    //             break;
    //     }
    //     // 创建一个方位点，形成矢量，改变方向，经度东西，纬度南北，高度上下
    //     const position1 = Cesium.Cartesian3.fromDegrees(lon + n, lat + t, alt);
    //     // 创建矢量并归一化
    //     let vectorSpeed = new Cesium.Cartesian3(
    //         position1.x - position.x,
    //         position1.y - position.y,
    //         position1.z - position.z
    //     );
    //     vectorSpeed = Cesium.Cartesian3.normalize(vectorSpeed, new Cesium.Cartesian3());
    //     Cesium.Cartesian3.fromElements(
    //         vectorSpeed.x * 2.0,
    //         vectorSpeed.y * 2.0,
    //         vectorSpeed.z * 1.0,
    //         vectorSpeed
    //     );
    //     // console.log(dt);
    //     // Cesium.Cartesian3.multiplyByScalar(gravityVector, -9.8 * dt, gravityVector);
    //     Cesium.Cartesian3.add(particle.velocity, vectorSpeed, particle.velocity);
    // }
}