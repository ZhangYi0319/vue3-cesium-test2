/*
 * @license: 张怡 版权所有
 * @作者: 张怡
 * @创建时间: 2023-01-31 15:45:17
 * @名称: 百度地图加载模块TS
 * @修改人: 张怡
 * @修改时间: 2023-01-31 16:31:08
 * @描述: 
 * 
 */
export class BaiduImageryProvider {
    private _errorEvent: any;
    private _tileWidth = 256;
    private _tileHeight = 256;
    private _maximumLevel = 18;
    private _minimumLevel = 1;
    private southwestInMeters = new Cesium.Cartesian2(-33554054, -33746824);
    private northeastInMeters = new Cesium.Cartesian2(33554054, 33746824);
    private _tilingScheme = new Cesium.WebMercatorTilingScheme({
        rectangleSouthwestInMeters: this.southwestInMeters,
        rectangleNortheastInMeters: this.northeastInMeters
    });
    private _rectangle = this._tilingScheme.rectangle;
    private _resource: any;
    private _tileDiscardPolicy = undefined;
    private _credit = undefined;
    private _readyPromise = undefined;

    private url: any;
    private proxy: any;

    private tileWidth: any;
    private tileHeight: any;
    private maximumLevel: any;
    private minimumLevel: any;
    private tilingScheme: any;
    private tileDiscardPolicy: any;
    private rectangle: any;
    private errorEvent: any;
    private ready: any;
    private readyPromise: any;
    private credit: any;
    private hasAlphaChannel = true;

    constructor(options: any) {
        this._resource = Cesium.Resource.createIfNeeded(options.url);
        this.url = this._resource.url;
        this.proxy = this._resource.proxy;
        if (!this._resource) {
            throw new Cesium.DeveloperError('resource must not be called before the imagery provider is ready.');
        }
        this.tileWidth = this._tileWidth;
        this.tileHeight = this._tileHeight;
        this.maximumLevel = this._maximumLevel;
        this.minimumLevel = this._minimumLevel;
        this.tilingScheme = this._tilingScheme;
        this.tileDiscardPolicy = this._tileDiscardPolicy;
        this.rectangle = this._rectangle;
        this.errorEvent = this._errorEvent;
        this.ready = this._resource;
        this.readyPromise = this._readyPromise;
        this.credit = this._credit;
        this.hasAlphaChannel = true;
    }

    requestImage(x: any, y: any, level: any, request: any): any {
        var r = this._tilingScheme.getNumberOfXTilesAtLevel(level);
        var c = this._tilingScheme.getNumberOfYTilesAtLevel(level);
        var s = this.url.replace("{x}", x - r / 2).replace("{y}", c / 2 - y - 1).replace("{z}", level).replace("{s}", Math.floor(10 * Math.random()));
        return Cesium.ImageryProvider.loadImage(this, s);
    };
}