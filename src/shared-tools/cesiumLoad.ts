// import * as Cesium from "cesium";

import { useMapDataStore } from '@/stores/mapData'
import { Observable } from 'rxjs';
import { BaiduImageryProvider } from '@/assets/resources/scripts/BaiduImageryProvider'

export class CesiumLoad {
    // 高德地图服务地址
    public gdMapUrls = {
        // 卫片
        wp: 'http://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        // 路网
        lw: 'https://wprd01.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8&ltype=11',
        // 地名
        dm: 'https://wprd01.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8&ltype=4',
        // 地名+路网
        dmlw: 'http://webst01.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
        // 矢量切片
        slqp: 'http://webrd01.is.autonavi.com/appmaptile?&scale=1&lang=zh_cn&style=8&x={x}&y={y}&z={z}'
    }

    // 天地图服务地址
    public tdtMapUrls = {
        // 矢量切片
        slqp: "http://t{s}.tianditu.gov.cn/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=dc4b52a520b9f8a691035ca2c240b6a1",
        // 矢量的注记
        slzj: "http://t{s}.tianditu.com/cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=dc4b52a520b9f8a691035ca2c240b6a1",
        // 卫片
        wp: "http://t{s}.tianditu.com/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=dc4b52a520b9f8a691035ca2c240b6a1",
        // 卫片的注记
        wpzj: "http://t{s}.tianditu.com/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&tk=dc4b52a520b9f8a691035ca2c240b6a1"

    }

    // 百度地图服务地址

    public bdMapUrls = {
        // 影像卫片
        wp: "http://shangetu{s}.map.bdimg.com/it/u=x={x};y={y};z={z};v=009;type=sate&fm=46",
        // 矢量切片
        slqp: "http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1",
        // 标注
        shbz: "http://online{s}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=sh&v=020",
        slbz: "http://online{s}.map.bdimg.com/tile/?qt=tile&x={x}&y={y}&z={z}&styles=sl&v=020",
        // 风格地图 midnight,grayscale,hardedge,light,redalert,googlelite,grassgreen,pink,darkgreen,bluish
        fgdt: "http://api0.map.bdimg.com/customimage/tile?&x={x}&y={y}&z={z}&scale=1&customid=dark"
    }


    constructor(
        private mapDataStore = useMapDataStore()
    ) { }

    /**
      * 加载Cesium及底图（高德等）
      * @param {string} elId cesium显示Html Dom Id
      * @param {string} url 影像服务url："http://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}"
      * @returns {Observable<any>} 加载承诺
      */
    addCesiumViewer(elId: string, url: string, minimumLevel?: 1, maximumLevel?: 18): Observable<any> {
        return new Observable((observer) => {
            // 设置cesiumToken
            Cesium.Ion.defaultAccessToken =
                // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0NDBhNDQ2Ny00MmNmLTQ4N2EtYjM2Mi0xMDNmMTQ3ODgyZWIiLCJpZCI6MTIyNjczLCJpYXQiOjE2NzUwNDU5Njl9.nw-ywwYuk5JPy906Rs-KPryAtZrO3sruW0rnClxiO6w";
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTM0YmE5NC0zMTU3LTQ1NjMtOThkNy01NjM3NWMxN2UxNjkiLCJpZCI6MTIyNjczLCJpYXQiOjE2ODgzNDg1Njh9.D9SZj52JSGvOyhrDlG45HlxY5uD1Z1sn3REvaA9lEoA";
            // 创建viewer
            const viewer = new Cesium.Viewer(elId, {
                // 是否显示动画控件
                animation: false,
                shouldAnimate: true,
                // 是否显示图层选择控件
                baseLayerPicker: false,
                // 是否显示地名查找控件
                geocoder: false,
                homeButton: false,
                // 是否显示投影方式控件
                sceneModePicker: false,
                selectionIndicator: false,
                // 是否显示时间线控件
                timeline: false,
                // 是否显示帮助信息控件
                navigationHelpButton: false,
                // 是否显示点击要素之后显示的信息
                infoBox: false,
                sceneMode: Cesium.SceneMode.SCENE3D,
                requestRenderMode: true,
                // transparent: true,
                fullscreenButton: false,
                imageryProvider: new Cesium.UrlTemplateImageryProvider({
                    url,
                    minimumLevel,
                    maximumLevel
                })
            });
            // 保存viewer
            this.mapDataStore.setCesiumViewer(viewer);
            // 完成
            observer.next(viewer);
            observer.complete();
        });
    }

    /**
     * 添加图层到地图（高德等）
     * @param url url
     * @param minimumLevel 
     * @param maximumLevel 
     */
    addImagerLayer(url: string, minimumLevel?: 1, maximumLevel?: 18) {
        const imageryLayer = new Cesium.ImageryLayer(new Cesium.UrlTemplateImageryProvider({
            url,
            minimumLevel,
            maximumLevel
        }))
        this.mapDataStore.cesiumViewer.imageryLayers.add(imageryLayer);
    }


    /**
      * 加载Cesium及底图（天地图等）
      * @param {string} elId cesium显示Html Dom Id
      * @param {string} url 影像服务url："http://t{s}.tianditu.gov.cn/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=dc4b52a520b9f8a691035ca2c240b6a1"
      * @returns {Observable<any>} 加载承诺
      */
    addCesiumViewer2(elId: string, url: string, subdomains?: Array<string>, layer?: string,
        style?: string, format?: string, tileMatrixSetID?: string): Observable<any> {
        return new Observable((observer) => {
            // 设置cesiumToken
            Cesium.Ion.defaultAccessToken =
                // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0NDBhNDQ2Ny00MmNmLTQ4N2EtYjM2Mi0xMDNmMTQ3ODgyZWIiLCJpZCI6MTIyNjczLCJpYXQiOjE2NzUwNDU5Njl9.nw-ywwYuk5JPy906Rs-KPryAtZrO3sruW0rnClxiO6w";
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTM0YmE5NC0zMTU3LTQ1NjMtOThkNy01NjM3NWMxN2UxNjkiLCJpZCI6MTIyNjczLCJpYXQiOjE2ODgzNDg1Njh9.D9SZj52JSGvOyhrDlG45HlxY5uD1Z1sn3REvaA9lEoA";
            // 服务负载子域
            // const subdomains = ['0', '1', '2', '3', '4', '5', '6', '7'];
            // 创建viewer
            const viewer = new Cesium.Viewer(elId, {
                msaaSamples: 1,
                // 是否显示动画控件
                animation: false,
                // 模型动画
                shouldAnimate: true,
                // 是否显示图层选择控件
                baseLayerPicker: false,
                // 是否显示地名查找控件
                geocoder: false,
                homeButton: false,
                // 是否显示投影方式控件
                sceneModePicker: false,
                selectionIndicator: false,
                // 是否显示时间线控件
                timeline: false,
                // 是否显示帮助信息控件
                navigationHelpButton: false,
                // 是否显示点击要素之后显示的信息
                infoBox: false,
                sceneMode: Cesium.SceneMode.SCENE3D,
                requestRenderMode: true,
                // transparent: true,
                fullscreenButton: false,
                imageryProvider: new Cesium.WebMapTileServiceImageryProvider({
                    url,
                    minimumLevel: 1,
                    maximumLevel: 18,
                    subdomains: subdomains ? subdomains : ['0', '1', '2', '3', '4', '5', '6', '7'],
                    layer: layer ? layer : "tdtImgLayer",
                    style: style ? style : "default",
                    format: format ? format : "image/jpeg",
                    tileMatrixSetID: tileMatrixSetID ? tileMatrixSetID : "GoogleMapsCompatible",// 使用谷歌的瓦片切片方式
                })
            });
            // 保存viewer
            this.mapDataStore.setCesiumViewer(viewer);
            // 完成
            observer.next(viewer);
            observer.complete();
        });
    }

    /**
     * 添加图层到地图（天地图等）
     * @param url 服务地址
     * @param subdomains 服务负载子域
     * @param layer 图层名称
     * @param style 样式
     * @param format 图片样式
     * @param tileMatrixSetID 切片方式
     */
    addImagerLayer2(url: string, subdomains?: Array<string>, layer?: string,
        style?: string, format?: string, tileMatrixSetID?: string) {
        // 服务负载子域
        // const subdomains = ['0', '1', '2', '3', '4', '5', '6', '7'];
        const imageryProvider = new Cesium.WebMapTileServiceImageryProvider({  //调用矢量地图中文注记服务
            url,
            minimumLevel: 1,
            maximumLevel: 18,
            subdomains: subdomains ? subdomains : ['0', '1', '2', '3', '4', '5', '6', '7'],
            layer: layer ? layer : "tdtAnnoLayer",
            style: style ? style : "default",
            format: format ? format : "image/jpeg",
            tileMatrixSetID: tileMatrixSetID ? tileMatrixSetID : "GoogleMapsCompatible",
        });
        this.mapDataStore.cesiumViewer.imageryLayers.addImageryProvider(imageryProvider);
    }


    /**
     * 加载地球及底图（百度地图测试）
     * @param elId 
     * @param url "http://api0.map.bdimg.com/customimage/tile?&x={x}&y={y}&z={z}&scale=1&customid=googlelite"
     * @returns 
     */
    addCesiumViewer3(elId: string, url: string): Observable<any> {
        return new Observable((observer) => {
            // 设置cesiumToken
            Cesium.Ion.defaultAccessToken =
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0NDBhNDQ2Ny00MmNmLTQ4N2EtYjM2Mi0xMDNmMTQ3ODgyZWIiLCJpZCI6MTIyNjczLCJpYXQiOjE2NzUwNDU5Njl9.nw-ywwYuk5JPy906Rs-KPryAtZrO3sruW0rnClxiO6w";
            // 创建viewer
            const viewer = new Cesium.Viewer(elId, {
                // 是否显示动画控件
                animation: false,
                shouldAnimate: true,
                // 是否显示图层选择控件
                baseLayerPicker: false,
                // 是否显示地名查找控件
                geocoder: false,
                homeButton: false,
                // 是否显示投影方式控件
                sceneModePicker: false,
                selectionIndicator: false,
                // 是否显示时间线控件
                timeline: false,
                // 是否显示帮助信息控件
                navigationHelpButton: false,
                // 是否显示点击要素之后显示的信息
                infoBox: false,
                sceneMode: Cesium.SceneMode.SCENE3D,
                requestRenderMode: true,
                // transparent: true,
                fullscreenButton: false,
                imageryProvider: new BaiduImageryProvider({ url })
            });
            // 保存viewer
            this.mapDataStore.setCesiumViewer(viewer);
            // 完成
            observer.next(viewer);
            observer.complete();
        });
    }

    /**
     *  添加图层到地图（百度地图等）
     * @param url 
     */
    addImagerLayer3(url: string) {
        // const imageryLayer = new Cesium.ImageryLayer(new BaiduImageryProvider({ url }));
        // this.mapDataStore.cesiumViewer.imageryLayers.add(imageryLayer);
        const imageryProvider = new BaiduImageryProvider({ url });
        this.mapDataStore.cesiumViewer.imageryLayers.addImageryProvider(imageryProvider as any);

    }


    /**
      * 加载地形数据
      * @param {string} url 地形服务url："https:/assets02.agi.com/stk-terrain/world"
      * @param {boolean} isRequestWaterMask
      * @param {boolean} isRequestVertexNormals
      * @return {无}
      */
    addTerrainProvider(
        url?: string,
        isRequestWaterMask?: boolean,
        isRequestVertexNormals?: boolean
    ): void {
        if (isRequestWaterMask == null) isRequestWaterMask = false;
        if (isRequestVertexNormals == null) isRequestVertexNormals = false;
        if (!!url) {
            this.mapDataStore.cesiumViewer.terrainProvider = new Cesium.CesiumTerrainProvider(
                {
                    url: url,
                    requestWaterMask: isRequestWaterMask,
                    requestVertexNormals: isRequestVertexNormals,
                }
            );
        } else {
            // 加载官方地形数据
            this.mapDataStore.cesiumViewer.terrainProvider = Cesium.createWorldTerrain({
                requestWaterMask: isRequestWaterMask,
                requestVertexNormals: isRequestVertexNormals
            });
        }
        this.mapDataStore.isLoadTerrain = true;
    }

    /**
     * 移除地形
     * @return {无}
     */
    removeTerrainProvider(): void {
        this.mapDataStore.cesiumViewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
        this.mapDataStore.isLoadTerrain = false;
    }

    /**
     * 加载3dtiles
     * @param url 路径
     * @param maximumScreenSpaceError 模糊度 1最清晰
     */
    add3dtiles(url: string, maximumScreenSpaceError: number, isZoomTo: boolean = false): any {
        const tileset = new Cesium.Cesium3DTileset({
            url,
            maximumScreenSpaceError
        })
        this.mapDataStore.cesiumViewer.scene.primitives.add(tileset);
        if (isZoomTo) {
            this.mapDataStore.cesiumViewer.zoomTo(tileset)
        }
        return tileset;
    }

    /**
     * 计算圆点集
     * @param radius 
     */
    computeCircle(radius: number): Array<any> {
        const positions = [];
        for (let i = 0; i < 360; i+=20) {
            const radians = Cesium.Math.toRadians(i);
            positions.push(
                new Cesium.Cartesian2(
                    radius * Math.cos(radians),
                    radius * Math.sin(radians)
                )
            )
        }
        return positions;
    }
}