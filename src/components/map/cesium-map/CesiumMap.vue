<template>
  <div class="cesium-map">
    <div id="cesiumContainer"></div>
    <div class="map-tools">
      <el-radio-group v-model="radio" @change="radioChange($event)">
        <el-radio-button label="轨迹回放"></el-radio-button>
        <el-radio-button label="眩晕图"></el-radio-button>
        <el-radio-button label="材质测试"></el-radio-button>
        <el-radio-button label="相机穿地"></el-radio-button>
        <el-radio-button label="加载白膜"></el-radio-button>
        <el-radio-button label="加载粒子"></el-radio-button>
        <el-radio-button label="大气效果"></el-radio-button>
        <el-radio-button label="天气"></el-radio-button>
        <el-radio-button label="光源"></el-radio-button>
        <el-radio-button label="后处理"></el-radio-button>
        <el-radio-button label="3dtiles"></el-radio-button>
        <el-radio-button label="gltf"></el-radio-button>
        <el-radio-button label="可视域分析"></el-radio-button>
        <el-radio-button label="模型对比度调整"></el-radio-button>
        <el-radio-button label="drawCommand"></el-radio-button>
        <el-radio-button label="泛光效果"></el-radio-button>
        <el-radio-button label="其他测试"></el-radio-button>
      </el-radio-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as Cesium from "cesium";
// import * as turf from "@turf/turf";
import * as dat from "dat.gui";
// import Cesium from "@/main";
import { onMounted, onUnmounted } from "vue";
import { CesiumLoad } from "@/shared-tools/cesiumLoad";
import {
  CesiumParticleSystem,
  EmitterType,
  SizeType,
} from "@/shared-tools/cesiumParticleSystem";

import { Rain, Snow, Fog, Lightning } from "@/assets/resources/scripts/Weather";

import { useMapDataStore } from "@/stores/mapData";
import { ref } from "vue";

import { PointLightSource, ExampleSource } from "@/assets/resources/scripts/LightSource";
import { ViewShed } from "@/assets/resources/scripts/ViewShed";
import { map } from "lodash";
import { point } from "@turf/helpers";
import { timeInterval } from "rxjs";

import { MyPrimitive } from "@/assets/resources/scripts/MyPrimitive";

const cesiumLoad = new CesiumLoad();
const cesiumParticleSystem = new CesiumParticleSystem();
const mapDataStore = useMapDataStore();
// 定义一个演示图层
// let datasource: Cesium.CustomDataSource;
let datasource: any;

let primitiy: any;
const gui = new dat.GUI();
gui.domElement.style = "position:absolute;top:120px;right:10px;height:500px";
let controlers: any = {};
let folder: any;
// 默认功能
const radio = ref("");

let weather: any;

function radioChange(label: any): void {
  if (!mapDataStore.cesiumViewer) {
    return;
  }
  // console.log(radio);
  selectMapFunction(label);
}

/**
 *触发方法
 * @param label
 */
function selectMapFunction(label: any) {
  // 移除之前功能
  datasource.entities.removeAll();
  // 清除材质
  if (mapDataStore.cesiumViewer.scene.globe.material) {
    mapDataStore.cesiumViewer.scene.globe.material = undefined;
  }
  if (primitiy) {
    // 清除
    mapDataStore.cesiumViewer.scene.primitives.remove(primitiy);
    primitiy = undefined;
  }

  // 深度测试
  mapDataStore.cesiumViewer.scene.globe.depthTestAgainstTerrain = false;
  // 相机碰撞检查
  mapDataStore.cesiumViewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
  // 允许透明
  mapDataStore.cesiumViewer.scene.globe.translucency.enabled = false;

  if (!mapDataStore.isLoadTerrain) {
    // 添加地形数据
    cesiumLoad.addTerrainProvider("", true);
  }
  // cesiumParticleSystem.removeAllParticle();
  controlers = {};
  if (folder) {
    gui.removeFolder(folder);
  }
  folder = gui.addFolder("菜单");

  if (weather) {
    weather.destroy();
    weather = null;
  }

  switch (label) {
    case "轨迹回放":
      console.log("触发轨迹回放");
      trackPlayback();
      break;
    case "眩晕图":
      console.log("触发眩晕图");
      elevation();
      break;
    case "材质测试":
      console.log("触发材质测试");
      addOtherMaterials();
      break;
    case "相机穿地":
      console.log("触发相机穿地");
      cameraGoUnderground();
      break;
    case "加载白膜":
      console.log("触发加载白膜");
      addWhiteData();
      break;
    case "加载粒子":
      console.log("触发加载粒子");
      addParticleData();
      // 移除地形
      // cesiumLoad.removeTerrainProvider();
      // cesiumParticleSystem.addSnowParticle(
      //   { lon: 116.45, lat: 39.932, alt: 100 },
      //   200,
      //   SizeType.small
      // );
      // mapDataStore.cesiumViewer.camera.setView({
      //   destination: Cesium.Cartesian3.fromDegrees(116.45, 39.932, 3000),
      // });
      break;

    case "大气效果":
      console.log("大气效果");
      atmosphericEffect();
      break;

    case "天气":
      console.log("触发天气测试");
      weatherEffect();
      break;

    case "光源":
      console.log("触发光源测试");
      lightSourceTest();
      break;

    case "后处理":
      console.log("触发后处理测试");
      postStageTest();
      break;

    case "3dtiles":
      console.log("触发3dtiles测试");
      add3dtilesTest();
      break;
    case "gltf":
      console.log("触发gltf测试");
      addGLTFTest();
      break;
    case "可视域分析":
      console.log("触发可视域分析测试");
      addViewshed();
      break;
    case "模型对比度调整":
      console.log("触发可模型对比度调整测试");
      changeContrast();
      break;
    case "drawCommand":
      console.log("触发drawCommand测试");
      drawCommand();
      break;
    case "泛光效果":
      console.log("触发泛光效果测试");
      bloomTest();
      break;

    case "其他测试":
      console.log("触发测试");
      test();
      break;

    default:
      break;
  }
}

onMounted(() => {
  // 加载cesium，添加基础底图(天地图)
  cesiumLoad
    .addCesiumViewer2("cesiumContainer", cesiumLoad.tdtMapUrls.wp)
    // .addCesiumViewer("cesiumContainer", cesiumLoad.gdMapUrls.wp)
    .subscribe((viewer) => {
      console.log(viewer, "地图加载完成");
      // 创建DataSource并添加
      datasource = new Cesium.CustomDataSource("enetiestestdata");
      viewer.dataSources.add(datasource);
      // 显示帧数
      mapDataStore.cesiumViewer.scene.debugShowFramesPerSecond = true;

      mapDataStore.cesiumViewer.shadows = true;
      mapDataStore.cesiumViewer.scene.globe.enableLighting = true;

      // 添加其他图层
      // cesiumLoad.addImagerLayer2(cesiumLoad.tdtMapUrls.wpzj);
      // cesiumLoad.addImagerLayer(cesiumLoad.gdMapUrls.dm);
      // 添加地形数据
      cesiumLoad.addTerrainProvider("", true);
      // // 添加3dtiles数据
      // cesiumLoad.add3dtiles(
      //   "src/assets/resources/datas/test3dtiles/test3dtiles/tileset.json",
      //   5,
      //   false
      // );
      // // 添加模型gltf，动态模型，模型高亮，模型边框，模型姿态
      // const position = Cesium.Cartesian3.fromDegrees(104.066, 30.656, 600);
      // const headingPitchRoll = new Cesium.HeadingPitchRoll(
      //   Cesium.Math.toRadians(-90), // z
      //   Cesium.Math.toRadians(30), // y
      //   Cesium.Math.toRadians(30) // x
      // );
      // const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      //   position,
      //   headingPitchRoll
      // );

      // const model = mapDataStore.cesiumViewer.entities.add({
      //   id: "model",
      //   // 位置
      //   position: position,
      //   // 方向
      //   orientation: orientation as any,
      //   model: {
      //     minimumPixelSize: 128,
      //     // shadows: Cesium.ShadowMode.ENABLED,
      //     shadows: Cesium.ShadowMode.CAST_ONLY,
      //     uri: "/assets/resources/datas/models/Cesium_Air.glb",
      //     color: Cesium.Color.BLUE,
      //     colorBlendMode: Cesium.ColorBlendMode.MIX,
      //     colorBlendAmount: 0.5,
      //     runAnimations: true,
      //     scale: 20,
      //     silhouetteSize: 3,
      //     silhouetteColor: Cesium.Color.GREEN,
      //   },
      // });
      // mapDataStore.cesiumViewer.zoomTo(model);

      // 添加矢量面状数据
      // const polygon = new Cesium.Entity({
      //   id: "polygontest",
      //   name: "Wyoming",
      //   polygon: {
      //     hierarchy: Cesium.Cartesian3.fromDegreesArray([
      //       109.080842,
      //       45.002073,
      //       105.91517,
      //       45.002073,
      //       104.058488,
      //       44.996596,
      //       104.053011,
      //       43.002989,
      //       104.053011,
      //       41.003906,
      //       105.728954,
      //       40.998429,
      //       107.919731,
      //       41.003906,
      //       109.04798,
      //       40.998429,
      //       111.047063,
      //       40.998429,
      //       111.047063,
      //       42.000709,
      //       111.047063,
      //       44.476286,
      //       111.05254,
      //       45.002073,
      //       109.080842,
      //       45.002073,
      //     ]) as any,
      //     height: 100,
      //     // material: Cesium.Color.RED.withAlpha(0.5),
      //     material: new Cesium.ImageMaterialProperty({
      //       image: "src/assets/resources/images/c19.jpg",
      //       // repeat: new Cesium.Cartesian2(2, 2),
      //       // color: Cesium.Color.BLUE.withAlpha(0.5),
      //       // transparent: true,
      //     }),
      //     // outline: true,
      //     // outlineColor: Cesium.Color.BLUE,
      //     // outlineWidth: 1,
      //     fill: true,
      //   },
      // });
      // datasource.entities.add(polygon);
      // mapDataStore.cesiumViewer.zoomTo(polygon);

      // // 添加线数据
      // const line = new Cesium.Entity({
      //   id: "polyline",
      //   name: "boderLine",
      //   polyline: {
      //     positions: Cesium.Cartesian3.fromDegreesArrayHeights([
      //       103.066,
      //       30.656,
      //       3000,
      //       105.555,
      //       32.555,
      //       3000,
      //     ]),
      //     width: 20,
      //     // material: Cesium.Color.YELLOW,
      //     // material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.RED),
      //     // material: new Cesium.PolylineDashMaterialProperty({
      //     //   color: Cesium.Color.BLUE,
      //     //   // gapColor:Cesium.Color.RED,
      //     //   dashLength: 50,
      //     //   dashPattern: 120,
      //     // }),
      //     material: new Cesium.PolylineGlowMaterialProperty({
      //       color: Cesium.Color.RED,
      //       glowPower: 0.5,
      //       taperPower: 1,
      //     }),
      //   },
      // });
      // datasource.entities.add(line);

      // mapDataStore.cesiumViewer.zoomTo(line);
      // 移动位置
      // mapDataStore.cesiumViewer.camera.flyTo({
      //   destination: Cesium.Cartesian3.fromDegrees(104.066, 30.656, 100000), // 相机位置
      //   orientation: {
      //     heading: Cesium.Math.toRadians(0.0), //朝向
      //     pitch: Cesium.Math.toRadians(-90), //俯仰
      //     roll: 0.0, //滚转
      //   },
      //   duration: 3,
      // });

      // 添加点击事件
      // const handler = new Cesium.ScreenSpaceEventHandler(
      //   mapDataStore.cesiumViewer.scene.canvas
      // );
      // handler.setInputAction((movement: any) => {
      //   const ray = mapDataStore.cesiumViewer.camera.getPickRay(movement.position);
      //   if (!ray) return;
      //   // console.log(movement.position);
      //   // console.log(ray);
      //   const p = mapDataStore.cesiumViewer.scene.globe.pick(
      //     ray,
      //     mapDataStore.cesiumViewer.scene
      //   );
      //   // console.log(position);
      //   const cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(p as any);
      //   // console.log(cartographic);
      //   const lon = Cesium.Math.toDegrees(cartographic.longitude);
      //   const lat = Cesium.Math.toDegrees(cartographic.latitude);
      //   const height = cartographic.height;
      //   console.log(lon, lat, height);
      //   //
      //   Cesium.sampleTerrainMostDetailed(mapDataStore.cesiumViewer.terrainProvider, [
      //     cartographic,
      //   ]).then((res: any) => {
      //     const lon2 = Cesium.Math.toDegrees(res[0].longitude);
      //     const lat2 = Cesium.Math.toDegrees(res[0].latitude);
      //     const height2 = res[0].height;
      //     console.log(lon2, lat2, height2);
      //   });
      // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      mapDataStore.cesiumViewer.scene.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(104.066, 30.656, 30000), // 相机位置
        orientation: {
          heading: Cesium.Math.toRadians(0.0), //朝向
          pitch: Cesium.Math.toRadians(-90), //俯仰
          roll: 0.0, //滚转
        },
        duration: 2,
      });
    });
  // 隐藏logo
  // (viewer as any)._cesiumWidget._creditContainer.style.display = "none";
  // 触发默认功能
  // selectMapFunction("轨迹回放");
});

onUnmounted(() => {
  gui.destroy();
});
/**
 * 添加其他材质
 */
function addOtherMaterials() {
  // 创建primitives polygon
  const polygon = new Cesium.PolygonGeometry({
    polygonHierarchy: new Cesium.PolygonHierarchy(
      Cesium.Cartesian3.fromDegreesArray([
        109.080842,
        45.002073,
        105.91517,
        45.002073,
        104.058488,
        44.996596,
        104.053011,
        43.002989,
        104.053011,
        41.003906,
        105.728954,
        40.998429,
        107.919731,
        41.003906,
        109.04798,
        40.998429,
        111.047063,
        40.998429,
        111.047063,
        42.000709,
        111.047063,
        44.476286,
        111.05254,
        45.002073,
        109.080842,
        45.002073,
      ])
    ),
  });
  const geometry = Cesium.PolygonGeometry.createGeometry(polygon);
  const instance = new Cesium.GeometryInstance({
    geometry: geometry as any,
  });

  // const primitiy = new Cesium.Primitive({
  //   geometryInstances: instance,
  //   appearance: new Cesium.MaterialAppearance({
  //     material: new Cesium.Material({
  //       fabric: {
  //         type: "Image",
  //         uniforms: {
  //           // image: "czm_defaultImage",
  //           image: "src/assets/resources/images/qiang/qiangat.jpg",
  //           // channel: "r",
  //           // strength: 0.8,
  //           // repeat: new Cesium.Cartesian2(1.0, 1.0),
  //         },
  //         // source: BumpMapMaterial,
  //       },
  //     }),
  //   }),
  //   asynchronous: false,
  // });

  primitiy = new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.EllipsoidSurfaceAppearance({
      material: new Cesium.Material({
        fabric: {
          // type: "ElevationContour",
          // uniforms: {
          //   color: Cesium.Color.RED,
          //   spacing: 50,
          //   width: 2,
          // },

          // // 水面
          type: "Water",
          uniforms: {
            baseWaterColor: new Cesium.Color(64 / 255.0, 157 / 255.0, 253 / 255.0, 1.0),
            normalMap: "/assets/resources/images/waterNormals.jpg",
            frequency: 200,
            animationSpeed: 0.1,
            amplitude: 5,
            specularIntensity: 0.5,
            // specularMap: "src/assets/resources/images/waterNormals.jpg",
            // normalMap: Cesium.buildModuleUrl("src/assets/resources/images/waterNormals.jpg"),
            // frequency: 10000.0,
            // animationSpeed: 0.01,
            // amplitude: 1.0,
          },

          // test1.....
          // materials: {
          //   diffuseMap: {
          //     type: "DiffuseMap",
          //     uniforms: {
          //       image: "/assets/resources/images/qiang/qiang.jpg",
          //     },
          //   },
          //   bumpMap: {
          //     type: "BumpMap",
          //     uniforms: {
          //       image: "/assets/resources/images/qiang/qiang.jpg",
          //       // channel: "a",
          //       strength: 0.15,
          //     },
          //   },
          // },
          // components: {
          //   // emission:"bumpMap.diffuse"
          //   diffuse: "diffuseMap.diffuse",
          //   specular: 0.1,
          //   // shininess: "2.0",
          //   normal: "bumpMap.normal",
          // },
          // test2..
          // materials: {
          //   diffuseMap: {
          //     type: "DiffuseMap",
          //     uniforms: {
          //       image: "src/assets/resources/images/earth/Earth.png",
          //     },
          //   },
          //   // 高光贴图
          //   specularMap: {
          //     type: "SpecularMap",
          //     uniforms: {
          //       image: "src/assets/resources/images/earth/EarthSpec.png",
          //     },
          //   },
          //   normalMap: {
          //     type: "NormalMap",
          //     uniforms: {
          //       image: "src/assets/resources/images/earth/EarthNormal.png",
          //       strength: 0.1,
          //     },
          //   },
          // },
          // components: {
          //   diffuse: "diffuseMap.diffuse",
          //   specular: "(1.0,1.0,1.0,1.0)",
          //   shininess: "2.0",
          //   // normalMap: "normalMap",
          //   normal: "normalMap.normal",
          // },
        },
      }),
    }),
    asynchronous: false,
  });
  mapDataStore.cesiumViewer.scene.primitives.add(primitiy);
  // debugger;
  mapDataStore.cesiumViewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      107.503299119254,
      43.14297237563765,
      1000000
    ),
  });
}

/**
 * 轨迹回放功能
 */
function trackPlayback(): void {
  // 路径数据
  var lujingdata = [
    [117.4603186710001, 31.14388249900003, 11.147400000001653],
    [117.45946237800001, 31.143739847000063, 11.108399999997346],
    [117.45859906800001, 31.143571198000075, 10.89079999999376],
    [117.45789337300005, 31.143422075000046, 11.12170000000333],
    [117.4571119630001, 31.143350937000037, 11.545700000002398],
    [117.45620292500007, 31.143325030000028, 11.529899999994086],
    [117.45545284400009, 31.143363754000063, 11.038100000005215],
    [117.45473256600008, 31.143448056000068, 10.86380000000645],
    [117.45399052200003, 31.143623321000064, 11.345600000000559],
    [117.45347615200001, 31.14381135600007, 11.687300000005052],
    [117.45292459000007, 31.144031608000034, 12.106100000004517],
    [117.45192097000006, 31.144426226000064, 12.842399999994086],
    [117.45065835500009, 31.144954275000032, 12.712299999999232],
    [117.44980033200011, 31.145266268000057, 12.504899999999907],
    [117.44943370300007, 31.145413392000023, 12.731599999999162],
    [117.44920128900003, 31.145382554000037, 12.967699999993783],
    [117.44897692800009, 31.144980649000047, 14.909599999999045],
    [117.44872415000009, 31.14449598400006, 14.55899999999383],
    [117.44851592000009, 31.144125416000065, 14.410999999992782],
    [117.44848024700002, 31.14392828000007, 14.475800000000163],
    [117.44948683700011, 31.14350793500006, 14.507400000002235],
    [117.45089297600009, 31.142959855000072, 14.290399999998044],
    [117.45149371900004, 31.142693826000027, 14.127099999997881],
    [117.45166848000008, 31.142571364000048, 15.52610000000277],
    [117.4516358520001, 31.142433625000024, 14.0341000000044],
    [117.45082070700005, 31.140899211000033, 13.289099999994505],
    [117.45082070700005, 31.140899211000033, 13.289099999994505],
  ];

  // 1 添加轨迹
  const lineEntity = datasource.entities.add({
    name: "line",
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArrayHeights((lujingdata as any).flat()),
      material: Cesium.Color.RED,
      width: 1,
    },
  });

  // 2 给数据添加时间戳
  const property = new Cesium.SampledPositionProperty();
  const startTime = new Date();
  let endTime: any;
  const timestamp = startTime.getTime();

  lujingdata.forEach((pos, index) => {
    let time = new Date(timestamp + index * 1000);
    endTime = time;
    const position = Cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2]);
    property.addSample(Cesium.JulianDate.fromDate(time), position);
  });

  // 3 插值
  property.setInterpolationOptions({
    interpolationDegree: 0.0001,
    interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
  });

  // 4 加载路径
  var entitydd = datasource.entities.add({
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({
        start: Cesium.JulianDate.fromDate(startTime),
        stop: Cesium.JulianDate.fromDate(endTime as any),
      }),
    ]),
    position: property, // 点集
    // 方向
    orientation: new Cesium.VelocityOrientationProperty(property),

    label: {
      text: "",
      fillColor: Cesium.Color.RED,
      pixelOffset: new Cesium.Cartesian2(0, -50),
    },
    model: {
      uri: "/assets/resources/datas/models/xiaofangche.gltf",
      scale: 5,
      minimumPixelSize: 70,
      maximumScale: 70,
      // runAnimations: true,
    },
    // model: {
    //   minimumPixelSize: 128,
    //   shadows: Cesium.ShadowMode.ENABLED,
    //   // shadows: Cesium.ShadowMode.CAST_ONLY,
    //   uri: " src/assets/resources/datas/models/Cesium_Air.glb",
    //   color: Cesium.Color.BLUE,
    //   colorBlendMode: Cesium.ColorBlendMode.MIX,
    //   colorBlendAmount: 0.5,
    //   runAnimations: true,
    //   scale: 1,
    //   silhouetteSize: 3,
    //   silhouetteColor: Cesium.Color.GREEN,
    // },
    path: {
      leadTime: 0,
      resolution: 1,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.8,
        color: Cesium.Color.RED,
      }),
      width: 10,
    },
  });

  // 添加时间回调事件
  const clockListener = mapDataStore.cesiumViewer.clock.onTick.addEventListener(
    (tick) => {
      console.log(tick);
      if (!entitydd.position?.getValue(tick.currentTime)) {
        debugger;
        mapDataStore.cesiumViewer.trackedEntity = undefined;
        mapDataStore.cesiumViewer.zoomTo(lineEntity);
        clockListener();
        return;
      }
      let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
        entitydd.position?.getValue(tick.currentTime) as any
      );
      //  console.log(entitydd.position.getValue(tick.currentTime));
      //转为经纬度

      cartographic.longitude = Cesium.Math.toDegrees(cartographic.longitude);
      cartographic.latitude = Cesium.Math.toDegrees(cartographic.latitude);
      // console.log(cartographic);
      if (entitydd.label) {
        entitydd.label.text = (Number(cartographic.longitude).toFixed(4) +
          "," +
          Number(cartographic.latitude).toFixed(4)) as any;
      }
    }
  );
  mapDataStore.cesiumViewer.trackedEntity = entitydd;
  // 5 设置时间，开始播放
  mapDataStore.cesiumViewer.clock.currentTime = Cesium.JulianDate.fromDate(startTime); //修改时间轴的当前时间
  mapDataStore.cesiumViewer.clock.stopTime = Cesium.JulianDate.fromDate(endTime as any);
  mapDataStore.cesiumViewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  mapDataStore.cesiumViewer.clock.shouldAnimate = true; //开始播放
  // mapDataStore.cesiumViewer.zoomTo(entitydd);
}

/**
 *晕眩图
 */
function elevation() {
  // 等高线
  // const ele = new Cesium.Material({
  //   fabric: {
  //     type: "ElevationContour",
  //     uniforms: {
  //       color: Cesium.Color.RED,
  //       spacing: 50,
  //       width: 2,
  //     },
  //   },
  // });
  // mapDataStore.cesiumViewer.scene.globe.material = ele;

  // 高程渲染图
  // const ele2 = new Cesium.Material({
  //   fabric: {
  //     type: "ElevationRamp",
  //     uniforms: {
  //       image: "src/assets/resources/images/elevation/color2.png",
  //       minimumHeight: 0,
  //       maximumHeight: 5000,
  //     },
  //   },
  // });
  // mapDataStore.cesiumViewer.scene.globe.material = ele2;

  // 合并
  const ele3 = new Cesium.Material({
    fabric: {
      materials: {
        elevationContour: {
          type: "ElevationContour",
          uniforms: {
            color: Cesium.Color.WHITE,
            spacing: 400,
            width: 2,
          },
        },
        elevationRamp: {
          type: "ElevationRamp",
          uniforms: {
            // image: "/assets/resources/images/elevation/color2.png",
            image: "src/assets/resources/images/elevation/color2.png",
            minimumHeight: 0,
            maximumHeight: 2800,
          },
        },
      },
      components: {
        diffuse:
          "elevationContour.alpha==0.0?elevationRamp.diffuse:elevationContour.diffuse",
        alpha: "max(elevationContour.alpha,elevationRamp.alpha)",
      },
    },
  });
  mapDataStore.cesiumViewer.scene.globe.material = ele3;
}

/**
 *相机入地
 */
function cameraGoUnderground() {
  // 深度测试
  mapDataStore.cesiumViewer.scene.globe.depthTestAgainstTerrain = true;
  // 相机可以到地下
  mapDataStore.cesiumViewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
  // 允许透明
  mapDataStore.cesiumViewer.scene.globe.translucency.enabled = true;
  // mapDataStore.cesiumViewer.scene.globe.baseColor = new Cesium.Color(1.0, 1.0, 1.0, 0.8);
  mapDataStore.cesiumViewer.scene.globe.translucency.frontFaceAlphaByDistance = new Cesium.NearFarScalar(
    100,
    0,
    20000,
    1.0
  );
  const data = [
    [114.44829726914871, 38.132655549577066],
    [114.39125413452091, 38.150414102535983],
    [114.33539939853108, 38.148544984717915],
    [114.31044302713137, 38.162562200857607],
    [114.27479106798899, 38.156021168611844],
    [114.25339989250355, 38.151348643484098],
    [114.21893633199923, 38.139198677216605],
    [114.21893633199923, 38.12237230662749],
    [114.22250152791344, 38.106477172992363],
    [114.22250152791344, 38.101801475345852],
    [114.24864629795121, 38.093384465543451],
    [114.26171868297003, 38.090578580179503],
    [114.28073306117933, 38.083095692631112],
    [114.29737064211243, 38.079353961643996],
    [114.30925462849331, 38.077483024350038],
    [114.3282690067026, 38.07467652866049],
    [114.33302260125487, 38.07467652866049],
    [114.35084858082611, 38.073741006164738],
    [114.37699335086387, 38.06906321419649],
    [114.37699335086387, 38.072805471702921],
    [114.42452929638715, 38.076547537753235],
  ];
  datasource.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray((data as any).flat()),
      material: Cesium.Color.RED,
      width: 5,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 50000.0),
    },
  });
  mapDataStore.cesiumViewer.zoomTo(datasource);
}

/**
 * 加载白膜数据
 */
function addWhiteData() {
  // 读取数据
  const request = new XMLHttpRequest();
  request.open("get", "/assets/resources/datas/baimo/chaoyangbaimo.json");
  request.send(null);
  request.onload = function () {
    const data = JSON.parse(request.responseText);
    console.log(data);
    // 移除地形
    cesiumLoad.removeTerrainProvider();
    data.features.forEach((feature: any) => {
      // console.log(feature);
      feature.geometry.coordinates.forEach((coordinate: any) => {
        datasource.entities.add({
          id: feature.properties.gml_id,
          wall: {
            positions: Cesium.Cartesian3.fromDegreesArray(coordinate.flat()),
            minimumHeights: new Array(coordinate.length).fill(0),
            maximumHeights: new Array(coordinate.length).fill(
              feature.properties.height * 3
            ),
            // material: new Cesium.Color(1.0, 1.0, 1.0, 1),
            material: new Cesium.ImageMaterialProperty({
              image: "/assets/resources/images/bmtt/louti.png",
              repeat: new Cesium.Cartesian2(10, feature.properties.height / 12),
            }),
          },
          polygon: {
            // hierarchy: Cesium.Cartesian3.fromDegreesArray(coordinate.flat()),
            hierarchy: new Cesium.PolygonHierarchy(
              Cesium.Cartesian3.fromDegreesArray(coordinate.flat())
            ),
            // width: 2, src\assets\resources\images\bmtt\louti.png
            //material:new Cesium.Color(1.0,1.0,1.0,1),
            material: new Cesium.ImageMaterialProperty({
              image: "/assets/resources/images/bmtt/wuding.png",
              repeat: new Cesium.Cartesian2(1, 1),
            }),
            height: feature.properties.height * 3,
            // extrudedHeight: feature.properties.height * 3,
          },
        });
      });
    });
    mapDataStore.cesiumViewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(116.45, 39.932, 3000),
    });
  };
}

function addParticleData() {
  controlers = {
    startColor: 0.2,
    endColor: 0.2,
    startScale: 3,
    endScale: 3,
    minimumParticleLife: 10,
    maximumParticleLife: 12,
    minimumSpeed: 10,
    maximumSpeed: 10,
    imageSize: 5,
    emissionRate: 1000,
    emitterNumber: 100,
    alt: 100,
    h: 180,
    p: 0,
    q: -180,
  };

  let startColorParam = folder.add(controlers, "startColor", 0.01, 1.0);
  startColorParam.onChange((param: any) => {
    particle.startColor = Cesium.Color.WHITE.withAlpha(param);
  });
  let endColorParam = folder.add(controlers, "endColor", 0.01, 1.0);
  endColorParam.onChange((param: any) => {
    particle.endColor = Cesium.Color.WHITE.withAlpha(param);
  });

  let startScaleParam = folder.add(controlers, "startScale", 0.1, 20);
  startScaleParam.onChange((param: any) => {
    particle.startScale = param;
  });

  let endScaleParam = folder.add(controlers, "endScale", 0.1, 20);
  endScaleParam.onChange((param: any) => {
    particle.endScale = param;
  });

  let minimumParticleLifeParam = folder.add(controlers, "minimumParticleLife", 0.1, 50);
  minimumParticleLifeParam.onChange((param: any) => {
    particle.minimumParticleLife = param;
  });

  let maximumParticleLifeParam = folder.add(controlers, "maximumParticleLife", 0.1, 50);
  maximumParticleLifeParam.onChange((param: any) => {
    particle.maximumParticleLife = param;
  });

  let minimumSpeedParam = folder.add(controlers, "minimumSpeed", 0.1, 50);
  minimumSpeedParam.onChange((param: any) => {
    particle.minimumSpeed = param;
  });

  let maximumSpeedParam = folder.add(controlers, "maximumSpeed", 0.1, 50);
  maximumSpeedParam.onChange((param: any) => {
    particle.maximumSpeed = param;
  });

  let imageSizeParam = folder.add(controlers, "imageSize", 0.1, 50);
  imageSizeParam.onChange((param: any) => {
    // (particle as any).imageSize = new Cesium.Cartesian2(param, param);
    (particle as any).imageSize = new Cesium.Cartesian2(0.5, param);
  });

  let emissionRateParam = folder.add(controlers, "emissionRate", 1, 10000);
  emissionRateParam.onChange((param: any) => {
    particle.emissionRate = param;
  });

  let emitterNumberParam = folder.add(controlers, "emitterNumber", 0.1, 10000);
  emitterNumberParam.onChange((param: any) => {
    particle.emitter = new Cesium.CircleEmitter(param);
  });

  let altParam = folder.add(controlers, "alt", 0, 5000);
  altParam.onChange((param: any) => {
    particle.modelMatrix = computeModelMatrix({ lon: 116.45, lat: 39.932, alt: param });
  });

  let hParam = folder.add(controlers, "h", -180, 180);
  hParam.onChange((param: any) => {
    particle.emitterModelMatrix = computeEmitterModelMatrix(
      param,
      controlers.p,
      controlers.q
    );
  });
  let pParam = folder.add(controlers, "p", -180, 180);
  pParam.onChange((param: any) => {
    particle.emitterModelMatrix = computeEmitterModelMatrix(
      controlers.h,
      param,
      controlers.q
    );
  });
  let qParam = folder.add(controlers, "q", -180, 180);
  qParam.onChange((param: any) => {
    particle.emitterModelMatrix = computeEmitterModelMatrix(
      controlers.h,
      controlers.p,
      param
    );
  });

  folder.open();
  // 移除地形
  cesiumLoad.removeTerrainProvider();
  const particle = new Cesium.ParticleSystem({
    // image: "src/assets/resources/images/particle/fire.png",
    // image: "/assets/resources/images/particle/snowflake.png",
    // image: "src/assets/resources/images/particle/water.png",
    image: "/assets/resources/images/particle/water2.png",
    startColor: Cesium.Color.WHITE.withAlpha(controlers.startColor),
    endColor: Cesium.Color.WHITE.withAlpha(controlers.endColor),
    startScale: controlers.startScale,
    endScale: controlers.endScale,
    // 存活时间
    minimumParticleLife: controlers.minimumParticleLife,
    maximumParticleLife: controlers.maximumParticleLife,
    // 速度
    minimumSpeed: controlers.minimumSpeed,
    maximumSpeed: controlers.maximumSpeed,
    // 图片大小
    imageSize: new Cesium.Cartesian2(0.5, controlers.imageSize),
    // 是否以米
    sizeInMeters: false,
    // 粒子数量
    emissionRate: controlers.emissionRate,
    // 发射器
    emitter: new Cesium.CircleEmitter(controlers.emitterNumber),
    // 世界坐标系矩阵，模型位置
    modelMatrix: computeModelMatrix({ lon: 116.45, lat: 39.932, alt: controlers.alt }),
    // 以发射器为原点的矩阵，
    emitterModelMatrix: computeEmitterModelMatrix(
      controlers.h,
      controlers.p,
      controlers.q
    ),
    updateCallback: (particle: any, dt: any) => {
      let gravityVector = new Cesium.Cartesian3();
      gravityVector = Cesium.Cartesian3.multiplyByScalar(
        gravityVector,
        Cesium.Math.randomBetween(-10.0, -100.0),
        gravityVector
      );
      // Cesium.Cartesian3.multiplyByScalar(gravityVector, -9.8 * dt, gravityVector);
      particle.velocity = Cesium.Cartesian3.add(
        particle.velocity,
        gravityVector,
        particle.velocity
      );
    },
  });
  mapDataStore.cesiumViewer.scene.primitives.add(particle);
  mapDataStore.cesiumViewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.45, 39.932, 3000),
  });
}

function computeModelMatrix(position: any) {
  const center = Cesium.Cartesian3.fromDegrees(position.lon, position.lat, position.alt);
  const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
  return matrix;
}
function computeEmitterModelMatrix(
  h = 0,
  p = 0,
  r = 0,
  tx = 0,
  ty = 0,
  tz = 0,
  sx = 1.0,
  sy = 1.0,
  sz = 1.0
) {
  // 粒子的朝向，俯仰，滚转
  let hpr = Cesium.HeadingPitchRoll.fromDegrees(h, p, r);
  // 由平移、旋转和缩放定义的仿射变换。
  let trs = new Cesium.TranslationRotationScale();
  // 位置矩阵
  // 平移
  trs.translation = Cesium.Cartesian3.fromElements(tx, ty, tz);
  // 旋转
  trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(hpr);

  trs.scale = new Cesium.Cartesian3(sx, sy, sz);
  // 创建Matrix4矩阵
  let result = Cesium.Matrix4.fromTranslationRotationScale(trs);
  return result;
}

let a = 0;
function applyGravity(particle: any, dt: any) {
  const position = particle.position;
  const ellipsoid = mapDataStore.cesiumViewer.scene.globe.ellipsoid;
  const cartographic = ellipsoid.cartesianToCartographic(position);
  const lon = Cesium.Math.toDegrees(cartographic.longitude);
  const lat = Cesium.Math.toDegrees(cartographic.latitude);
  const alt = cartographic.height;
  debugger;
  a += dt;
  let n = 0;
  let t = 0;
  // ~~取整
  switch (~~a % 4) {
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
    vectorSpeed.x * 1.5,
    vectorSpeed.y * 1.5,
    vectorSpeed.z * 1.5,
    vectorSpeed
  );

  // console.log(dt);

  // Cesium.Cartesian3.multiplyByScalar(gravityVector, -9.8 * dt, gravityVector);
  Cesium.Cartesian3.add(particle.velocity, vectorSpeed, particle.velocity);
}

/**
 * 大气层
 */
function atmosphericEffect() {
  controlers = {
    atmosphereLightIntensity: 50.0,
    atmosphereMieAnisotropy: 0.9,

    hueShift: 0.1,
    saturationShift: 0.1,
    brightnessShift: 0.1,

    density: 0.0001,
    minimumBrightness: 0.03,
  };

  let atmosphereLightIntensityParam = folder.add(
    controlers,
    "atmosphereLightIntensity",
    0.0,
    100.0
  );
  atmosphereLightIntensityParam.onChange((param: any) => {
    mapDataStore.cesiumViewer.scene.skyAtmosphere.atmosphereLightIntensity =
      controlers.atmosphereLightIntensity;
  });

  let atmosphereMieAnisotropyParam = folder.add(
    controlers,
    "atmosphereMieAnisotropy",
    -1.0,
    1.0
  );
  atmosphereMieAnisotropyParam.onChange((param: any) => {
    mapDataStore.cesiumViewer.scene.skyAtmosphere.atmosphereMieAnisotropy =
      controlers.atmosphereMieAnisotropy;
  });

  let hueShiftParam = folder.add(controlers, "hueShift", -1.0, 1.0);
  hueShiftParam.onChange((param: any) => {
    mapDataStore.cesiumViewer.scene.skyAtmosphere.hueShift = controlers.hueShift;
  });

  let saturationShiftParam = folder.add(controlers, "saturationShift", -1.0, 1.0);
  saturationShiftParam.onChange((param: any) => {
    mapDataStore.cesiumViewer.scene.skyAtmosphere.saturationShift =
      controlers.saturationShift;
  });

  let brightnessShiftParam = folder.add(controlers, "brightnessShift", -1.0, 1.0);
  brightnessShiftParam.onChange((param: any) => {
    mapDataStore.cesiumViewer.scene.skyAtmosphere.brightnessShift =
      controlers.brightnessShift;
  });

  let densityParam = folder.add(controlers, "density", 0.0, 0.1);
  densityParam.onChange((param: any) => {
    mapDataStore.cesiumViewer.scene.fog.density = controlers.density;
  });

  let minimumBrightnessParam = folder.add(controlers, "minimumBrightness", 0.0, 5.0);
  minimumBrightnessParam.onChange((param: any) => {
    mapDataStore.cesiumViewer.scene.fog.minimumBrightness = controlers.minimumBrightness;
  });

  mapDataStore.cesiumViewer.scene.skyAtmosphere.atmosphereLightIntensity =
    controlers.atmosphereLightIntensity;
  mapDataStore.cesiumViewer.scene.skyAtmosphere.atmosphereMieAnisotropy =
    controlers.atmosphereMieAnisotropy;
  mapDataStore.cesiumViewer.scene.skyAtmosphere.perFragmentAtmosphere = true;
  mapDataStore.cesiumViewer.scene.skyAtmosphere.hueShift = controlers.hueShift;
  mapDataStore.cesiumViewer.scene.skyAtmosphere.saturationShift =
    controlers.saturationShift;
  mapDataStore.cesiumViewer.scene.skyAtmosphere.brightnessShift =
    controlers.brightnessShift;
  mapDataStore.cesiumViewer.scene.fog.density = controlers.density;
  mapDataStore.cesiumViewer.scene.fog.minimumBrightness = controlers.minimumBrightness;

  folder.open();
}

/**
 * 下雪，后处理方式
 */
function weatherEffect() {
  // weather = new Snow(mapDataStore.cesiumViewer, {
  //   snowSize: 0.02, // 雪花大小
  //   snowSpeed: 60.0, // 雪速
  // });
  // weather = new Rain(mapDataStore.cesiumViewer, {
  //   tiltAngle: -0.6, //倾斜角度
  //   rainSize: 0.6, // 雨大小
  //   rainSpeed: 120.0, // 雨速
  // });
  // weather = new Fog(mapDataStore.cesiumViewer, {
  //   visibility: 0.2,
  //   color: new Cesium.Color(0.8, 0.8, 0.8, 0.3),
  // });

  weather = new Lightning(mapDataStore.cesiumViewer, {
    visibility: 0.2,
    color: new Cesium.Color(0.8, 0.8, 0.8, 0.3),
  });
}

function test() {
  const scene = mapDataStore.cesiumViewer.scene;
  mapDataStore.cesiumViewer.scene.globe.enableLighting = false;
  mapDataStore.cesiumViewer.shadows = false;
  // cesiumLoad.add3dtiles("/api/test3dtiles/tileset.json", 1, true);

  const customShader = new Cesium.CustomShader({
    fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                    // 定义默认颜色
                    vec3 color = material.diffuse;
                    float contrast = 1.5;
                    vec3 yiq = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)),
                                    dot(color.rgb, vec3(0.596, -0.275, -0.321)),
                                    dot(color.rgb, vec3(0.212, -0.523, 0.311)));
                    yiq.r = (yiq.r - 0.5) * contrast + 0.5;
                    color.rgb = vec3(dot(yiq, vec3(1.0, 0.956, 0.621)),
                                     dot(yiq, vec3(1.0, -0.272, -0.647)),
                                     dot(yiq, vec3(1.0, -1.107, 1.704)));
                    material.diffuse = color*1.5;
        }
    `,
  });

  const tileset = new Cesium.Cesium3DTileset({
    url: "/api/test3dtiles/tileset.json",
    // url: "/api/cdbm/chengdu/tileset.json",
    // url: "/assets/resources/datas/test3dtiles/tileset.json",
    maximumScreenSpaceError: 1,
    customShader,
  });

  tileset.readyPromise.then((t: any) => {
    //原始点
    var center = t.boundingSphere.center;
    var cartographic = Cesium.Cartographic.fromCartesian(center);
    var longitude = cartographic.longitude;
    var latitude = cartographic.latitude;
    var alt = cartographic.height;
    //偏移后点
    var altt = alt + 10;
    var offset = Cesium.Cartesian3.fromRadians(longitude, latitude, altt);
    // // 计算向量
    const vectorAB = Cesium.Cartesian3.subtract(offset, center, new Cesium.Cartesian3());
    // // 矩阵偏移
    t.modelMatrix = Cesium.Matrix4.fromTranslation(vectorAB);

    var alt1 = alt - 18;
    var position1 = Cesium.Cartesian3.fromRadians(longitude, latitude, alt1);
    var modelMatrix1 = Cesium.Transforms.eastNorthUpToFixedFrame(position1); //gltf数据加载位置——中点
    // model_add("/assets/resources/datas/models/xiaofangche.gltf", modelMatrix, position);
    debugger;
    // model_add("/api/glb/枫树10.gltf", modelMatrix1);
    // model_add("/api1/红纱模型1/打棒球男.glb", modelMatrix1); // x
    // model_add("/api1/红纱模型1/打保龄球男.glb", modelMatrix1); // x
    // model_add("/api1/红纱模型1/打电话男.glb", modelMatrix1); // x
    // model_add("/api1/红纱模型1/狗.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/狗2.glb", modelMatrix1); // x
    // model_add("/api1/红纱模型1/红色汽车.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/红色汽车1.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/货车.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/鸡.glb", modelMatrix1); // x
    // model_add("/api1/红纱模型1/蓝色卡车.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/聊天男.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/聊天女.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/聊天女1.glb", modelMatrix1); // x
    // model_add("/api1/红纱模型1/皮卡.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/汽车.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/汽车1.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/赛车.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/手部动作女.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/躺着运动男.glb", modelMatrix1); // x
    // model_add("/api1/红纱模型1/闲逛男.glb", modelMatrix1); // x
    // model_add("/api1/红纱模型1/鹰.glb", modelMatrix1); // x
    // model_add("/api1/红纱模型1/走路的猫.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/走路男.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/走路男1.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/走路男2.glb", modelMatrix1); // x
    // model_add("/api1/红纱模型1/走路男3.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/做着聊天女.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/做着聊天女1.glb", modelMatrix1); // x
    // model_add("/api1/红纱模型1/跳舞女.glb", modelMatrix1); // x
    // model_add("/api1/红纱模型1/聊天女2.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/聊天女3.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型1/聊天女4.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型2/聊天女4.glb", modelMatrix1); // √
    // model_add("/api1/红纱模型2/站立女.glb", modelMatrix1); // √
    model_add("/api1/红纱模型1/狗3.glb", modelMatrix1); // √
  });

  mapDataStore.cesiumViewer.scene.primitives.add(tileset);
  mapDataStore.cesiumViewer.zoomTo(tileset);

  // const stages = mapDataStore.cesiumViewer.scene.postProcessStages;
  // var fs =
  //   "uniform sampler2D colorTexture;\n" +
  //   "varying vec2 v_textureCoordinates;\n" +
  //   "uniform float scale;\n" +
  //   "uniform vec3 offset;\n" +
  //   "void main() {\n" +
  //   "    vec4 color = texture2D(colorTexture, v_textureCoordinates);\n" + //获取片段颜色
  //   "    gl_FragColor = vec4(color.rgb * scale + offset, 10.0);\n" +
  //   "}\n"; //放大片段颜色系数

  // mapDataStore.cesiumViewer.scene.postProcessStages.add(
  //   new Cesium.PostProcessStage({
  //     fragmentShader: fs,
  //     uniforms: {
  //       scale: 0.1,
  //       offset: function () {
  //         // return new Cesium.Cartesian3(0.1, 0.2, 0.3);
  //         return new Cesium.Cartesian3(0.01, 0.02, 0.03);
  //       },
  //     },
  //   })
  // );

  // const position = new Cesium.Cartesian3(
  //   -2292103.8036559448,
  //   5002510.4877891615,
  //   3214422.9444327876
  // );

  // mapDataStore.cesiumViewer.camera.setView({
  //   destination: Cesium.Cartesian3.fromDegrees(104, 30.6, 1000),
  // });
  // const position = Cesium.Cartesian3.fromDegrees(116.4, 39.9, 3000);
  // const heading = Cesium.Math.toRadians(135);
  // const pitch = 0;
  // const roll = 0;
  // const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  // const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

  // const model = Cesium.Model.fromGltf({
  //   url: "/api/test3dtiles/tileset.json",
  //   debugShowBoundingVolume: true,
  //   id: 101,
  //   color: Cesium.Color.RED,
  // });

  // model.readyPromise.then((tilese: any) => {
  //   console.log(tilese);
  //   debugger;
  //   //     x: -2292103.8036559448
  //   // y: 5002510.4877891615
  //   // z: 3214422.9444327876
  //   mapDataStore.cesiumViewer.camera.flyToBoundingSphere(tilese.boundingSphere, {
  //     duration: 2,
  //   });
  // });

  // datasource.entities.add({
  //   model,
  //   position,
  //   orientation,
  // });

  // mapDataStore.cesiumViewer.camera.setView({
  //   destination: position,
  // });

  // mapDataStore.cesiumViewer.camera.flyTo({
  //   destination: new Cesium.Cartesian3(
  //     -2292103.8036559448,
  //     5002510.4877891615,
  //     3214422.9444327876
  //   ),
  // });

  //       // Load the NYC buildings tileset.
  // const tileset = new Cesium.Cesium3DTileset({
  //   // url: Cesium.IonResource.fromAssetId(1552164),
  //   url: Cesium.IonResource.fromAssetId(69380),
  //   shadows: Cesium.ShadowMode.CAST_ONLY,
  //   // url: "/api/AGI_HQ.kmz",
  //   customShader: new Cesium.CustomShader({
  //     lightingModel: Cesium.LightingModel.UNLIT,
  //     uniforms: {
  //       maxHeight: {
  //         type: Cesium.UniformType.FLOAT,
  //         value: 100.0,
  //       },
  //       minHeight: {
  //         type: Cesium.UniformType.FLOAT,
  //         value: 0.0,
  //       },
  //     },
  //     fragmentShaderText: `
  //         void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
  //                 float curz = fsInput.attributes.positionMC.z;
  //                 float d = (curz - minHeight) / (maxHeight - minHeight);
  //                 float r = 0.01;
  //                 r = fract(r * czm_frameNumber);
  //                 float c = smoothstep(r, r+0.03, d) - smoothstep(r + 0.035,r + 0.04, d);
  //                 vec3 linearColor = mix(vec3(1.0,1.0,1.0) ,vec3(255.0,48.0,48.0)/255.0,r);
  //                 vec3 renderColor = mix(vec3(0.0,0.96,1.0) ,linearColor,c);
  //                 material.diffuse = renderColor;
  //     }`,
  //   }),
  //   backFaceCulling: false,
  // });
  // 547.75 -11.89
  // let [maxHeight,minHeight] = [tileset._properties.Height.maximum,tileset._properties.Height.minimum]

  // tileset.readyPromise.then((tileset: any) => {
  //   console.log(tileset);
  //   // let [maxheight, minheight] = [
  //   //   tileset.properties.Height.maximum,
  //   //   tileset.properties.Height.minimum,
  //   // ];
  //   // tileset.customShader.setUniform("maxHeight", maxheight);
  //   // tileset.customShader.setUniform("minHeight", minheight);
  //   mapDataStore.cesiumViewer.zoomTo(tileset);
  //   // console.log(`Maximum building height: ${maxheight}`);
  //   // console.log(`Minimum building height: ${minheight}`);
  // });
  // console.log(tileset);
  // scene.primitives.add(tileset);

  // mapDataStore.cesiumViewer.scene.globe.enableLighting = false;
  // mapDataStore.cesiumViewer.shadows = false;

  // const exampleSource = new ExampleSource();

  // const tilese = new Cesium.Cesium3DTileset({
  //   url: "/api/test3dtiles/tileset.json",
  //   customShader: exampleSource.createCustomShader(),
  // });
  // mapDataStore.cesiumViewer.scene.primitives.add(tilese);

  // mapDataStore.cesiumViewer.zoomTo(tilese);

  // // 添加3dtiles数据
  // const tileset = cesiumLoad.add3dtiles("/api/test3dtiles/tileset.json", 5, false);

  // tileset.readyPromise.then((til: any) => {
  //   console.log(til);
  //   /**平移方法1 */
  //   til.modelMatrix = new Cesium.Matrix4(1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 20, 0, 0, 0, 1);
  //   // mapDataStore.cesiumViewer.camera.flyToBoundingSphere(til.boundingSphere, {
  //   //   duration: 2,
  //   // });
  //   debugger;
  //   //原始点
  //   var boundingSphere = til.boundingSphere;
  //   var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
  //   var longitude = cartographic.longitude;
  //   var latitude = cartographic.latitude;
  //   var alt = cartographic.height;
  //   //偏移后点
  //   var alt1 = alt - 20;
  //   var offset = Cesium.Cartesian3.fromRadians(longitude, latitude, alt1);
  //   debugger;

  //   const pointLightSource = new PointLightSource({
  //     cameraPositionWC: mapDataStore.cesiumViewer.scene.camera.positionWC,
  //     lightColor: Cesium.Color.WHITE,
  //     lightPosition: offset,
  //   });

  //   const customShader = pointLightSource.createCustomShader();

  //   // const tiles = new Cesium.Cesium3DTileset({
  //   //   url: "src/assets/resources/datas/models/Stork.glb",
  //   //   customShader: customShader,
  //   // });

  //   // const model = Cesium.Model.fromGltf({
  //   //   url: "src/assets/resources/datas/models/SimpleSkinning.gltf",
  //   // customShader: customShader,
  //   // });

  //   // mapDataStore.cesiumViewer.scene.primitives.add(model);
  //   // mapDataStore.cesiumViewer.zoomTo(model);
  //   // const points = mapDataStore.cesiumViewer.scene.primitives.add(
  //   //   new Cesium.PointPrimitiveCollection()
  //   // );

  //   // points.add({
  //   //   position: offset,
  //   //   color: customShader,
  //   // });
  // });

  /**创建管线 */
  // const redTube= datasource.entities.add({
  // // const redTube = mapDataStore.cesiumViewer.entities.add({
  //   polylineVolume: {
  //     positions: Cesium.Cartesian3.fromDegreesArrayHeights([
  //       104.06,
  //       30.65,
  //       600,
  //       104.07,
  //       30.65,
  //       600,
  //       104.07,
  //       30.64,
  //       600,
  //     ]),
  //     shape: cesiumLoad.computeCircle(10),
  //     material: new Cesium.ColorMaterialProperty(
  //       new Cesium.CallbackProperty(() => {
  //         return Cesium.Color.fromRandom({
  //           minimumRed: 0.7,
  //           minimumGreen: 0.7,
  //           minimumBlue: 0.7,
  //           alpha: 1.0,
  //         });
  //       }, false)
  //     ),
  //   },
  // });

  // mapDataStore.cesiumViewer.flyTo(redTube);

  // // 深度测试
  // mapDataStore.cesiumViewer.scene.globe.depthTestAgainstTerrain = true;
  // // 添加3dtiles数据
  // const tileset = cesiumLoad.add3dtiles("/api/test3dtiles/tileset.json", 5, false);
  // debugger;
  // tileset.readyPromise.then((til: any) => {
  //   console.log(til);

  // /**平移方法1 */
  // tileset.modelMatrix=new Cesium.Matrix4(
  //   1,0,0,1,
  //   0,1,0,1,
  //   0,0,1,20,
  //   0,0,0,1
  //   )

  /** 平移方法2*/
  // // 原始点
  // const pointA = til.boundingSphere.center;
  // // 偏移后点
  // const pointB = new Cesium.Cartesian3(pointA.x, pointA.y, pointA.z + 20);
  // // 计算向量
  // const vectorAB = Cesium.Cartesian3.subtract(pointB, pointA, new Cesium.Cartesian3());
  // // 矩阵偏移
  // tileset.modelMatrix = Cesium.Matrix4.fromTranslation(vectorAB);

  /**旋转 */
  // const pointA = til.boundingSphere.center;
  // const pointB = new Cesium.Cartesian3(0, 0, 0);
  // // 平移到地心的向量
  // const vectorAB = Cesium.Cartesian3.subtract(pointB, pointA, new Cesium.Cartesian3());
  // const moveto_matrix = Cesium.Matrix4.fromTranslation(vectorAB);
  // const backto_matrix = Cesium.Matrix4.fromTranslation(pointA);
  // // const rotateX = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(20));
  // const rotate = Cesium.Matrix3.fromHeadingPitchRoll(new Cesium.HeadingPitchRoll(0,0,Cesium.Math.toRadians(180)));
  // const rotate_matrix = Cesium.Matrix4.fromRotationTranslation(rotate,new Cesium.Cartesian3(1,1,20));
  // const temp = Cesium.Matrix4.multiply(rotate_matrix,moveto_matrix,new Cesium.Matrix4());
  // const final = Cesium.Matrix4.multiply(backto_matrix,temp,new Cesium.Matrix4());
  // tileset.modelMatrix=final

  /**缩放 */
  // const pointA = til.boundingSphere.center;
  // const pointB = new Cesium.Cartesian3(0, 0, 0);
  // // 平移到地心的向量
  // const vectorAB = Cesium.Cartesian3.subtract(pointB, pointA, new Cesium.Cartesian3());
  // const moveto_matrix = Cesium.Matrix4.fromTranslation(vectorAB);
  // const backto_matrix = Cesium.Matrix4.fromTranslation(pointA);
  // const zoom_matrix=new Cesium.Matrix4(
  //   10,0,0,1,
  //   0,10,0,1,
  //   0,0,10,1,
  //   0,0,0.0,1
  // );
  // const temp = Cesium.Matrix4.multiply(zoom_matrix,moveto_matrix,new Cesium.Matrix4());
  // const final = Cesium.Matrix4.multiply(backto_matrix,temp,new Cesium.Matrix4());
  // tileset.modelMatrix= Cesium.Matrix4.multiply(Cesium.Matrix4.fromTranslation(new Cesium.Cartesian3(1,1,1000)),final,new Cesium.Matrix4());
  // // tileset.modelMatrix=final

  //   mapDataStore.cesiumViewer.camera.flyToBoundingSphere(til.boundingSphere, {
  //     duration: 2,
  //   });
  // });
  // mapDataStore.cesiumViewer.camera.setView({
  //   destination: Cesium.Cartesian3.fromDegrees(114, 38, 100000),
  //   orientation: {
  //     heading: Cesium.Math.toRadians(0.0),
  //     pitch: Cesium.Math.toRadians(-90),
  //     roll: 0.0,
  //   },
  // });

  // var ambientOcclusion =
  //   mapDataStore.cesiumViewer.scene.postProcessStages.ambientOcclusion;
  // ambientOcclusion.enabled = true;
  // ambientOcclusion.uniforms.ambientOcclusionOnly = false;
  // ambientOcclusion.uniforms.intensity = 3;
  // ambientOcclusion.uniforms.bias = 0.1;
  // ambientOcclusion.uniforms.lengthCap = 0.03;
  // ambientOcclusion.uniforms.stepSize = 1;
  // ambientOcclusion.uniforms.blurStepSize = 0.86;
  // const polygon = new Cesium.PolygonOutlineGeometry({
  //   polygonHierarchy: new Cesium.PolygonHierarchy(
  //     Cesium.Cartesian3.fromDegreesArray([
  //       -72.0,
  //       40.0,
  //       -70.0,
  //       35.0,
  //       -75.0,
  //       30.0,
  //       -70.0,
  //       30.0,
  //       -68.0,
  //       40.0,
  //     ])
  //   ),
  // });
  // const geometry = Cesium.PolygonOutlineGeometry.createGeometry(polygon);
  // const polygonWithHole = new Cesium.PolygonOutlineGeometry({
  //   polygonHierarchy: new Cesium.PolygonHierarchy(
  //     Cesium.Cartesian3.fromDegreesArray([
  //       -109.0,
  //       30.0,
  //       -95.0,
  //       30.0,
  //       -95.0,
  //       40.0,
  //       -109.0,
  //       40.0,
  //     ]),
  //     [
  //       new Cesium.PolygonHierarchy(
  //         Cesium.Cartesian3.fromDegreesArray([
  //           -107.0,
  //           31.0,
  //           -107.0,
  //           39.0,
  //           -97.0,
  //           39.0,
  //           -97.0,
  //           31.0,
  //         ]),
  //         [
  //           new Cesium.PolygonHierarchy(
  //             Cesium.Cartesian3.fromDegreesArray([
  //               -105.0,
  //               33.0,
  //               -99.0,
  //               33.0,
  //               -99.0,
  //               37.0,
  //               -105.0,
  //               37.0,
  //             ]),
  //             [
  //               new Cesium.PolygonHierarchy(
  //                 Cesium.Cartesian3.fromDegreesArray([
  //                   -103.0,
  //                   34.0,
  //                   -101.0,
  //                   34.0,
  //                   -101.0,
  //                   36.0,
  //                   -103.0,
  //                   36.0,
  //                 ])
  //               ),
  //             ]
  //           ),
  //         ]
  //       ),
  //     ]
  //   ),
  // });
  // const geometry = Cesium.PolygonOutlineGeometry.createGeometry(polygonWithHole);
  // const extrudedPolygon = new Cesium.PolygonOutlineGeometry({
  //   polygonHierarchy: new Cesium.PolygonHierarchy(
  //     Cesium.Cartesian3.fromDegreesArray([
  //       -72.0,
  //       40.0,
  //       -70.0,
  //       35.0,
  //       -75.0,
  //       30.0,
  //       -70.0,
  //       30.0,
  //       -68.0,
  //       40.0,
  //     ])
  //   ),
  //   extrudedHeight: 300000,
  // });
  // const geometry = Cesium.PolygonOutlineGeometry.createGeometry(extrudedPolygon);
  // debugger;
  // const instance = new Cesium.GeometryInstance({
  //   geometry: geometry as any,
  //   attributes: {
  //     color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.PINK),
  //   },
  // });
  // const pri = new Cesium.Primitive({
  //   geometryInstances: instance,
  //   appearance: new Cesium.PerInstanceColorAppearance({
  //     flat: true,
  //   }),
  //   asynchronous: false,
  // });
  // debugger;
  // mapDataStore.cesiumViewer.scene.primitives.add(pri);
  // mapDataStore.cesiumViewer.camera.setView({
  //   destination: Cesium.Cartesian3.fromDegrees(-72.0, 40.0, 1000000),
  // });
}

//加载gltf格式数据到cesium，z为模型名称，modelMatrix为模型中心点的经纬度坐标
function model_add(url: string, modelMatrix: any, position?: any) {
  const model = mapDataStore.cesiumViewer.scene.primitives.add(
    Cesium.Model.fromGltf({
      url: url, //如果为bgltf则为.bgltf
      modelMatrix: modelMatrix,
      scale: 10, //放大倍数
      // scale: 0.02, //放大倍数
      // customShader: exampleSource.createCustomShader(),
    })
  );
  model.readyPromise.then((g: any) => {
    g.activeAnimations.addAll({
      multiplier: 1.0,
      loop: Cesium.ModelAnimationLoop.REPEAT,
    });
  });

  // /*获取3D model 的旋转矩阵modelMatrix*/
  // let m = model.modelMatrix;
  // //构建一个三阶旋转矩阵。模型旋转一定的角度，fromRotation[Z]来控制旋转轴，toRadians()为旋转角度，转为弧度再参与运算
  // let m1 = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(-78));
  // //矩阵计算
  // Cesium.Matrix4.multiplyByMatrix3(m, m1, m);
  // //将计算结果再赋值给modelMatrix
  // model.modelMatrix = m;
}

// 实现光照
function lightSourceTest() {
  //  关闭地图光照
  mapDataStore.cesiumViewer.scene.globe.enableLighting = false;
  mapDataStore.cesiumViewer.shadows = false;
  // 深度测试
  mapDataStore.cesiumViewer.scene.globe.depthTestAgainstTerrain = true;
  const exampleSource = new ExampleSource();
  //原始点
  var center = new Cesium.Cartesian3(
    -2292103.8036559448,
    5002510.4877891615,
    3214422.9444327876
  );
  var cartographic = Cesium.Cartographic.fromCartesian(center);
  var longitude = cartographic.longitude;
  var latitude = cartographic.latitude;
  var alt = cartographic.height;
  //偏移后点
  var lightPosition = Cesium.Cartesian3.fromRadians(
    longitude - 0.000001,
    latitude - 0.000001,
    alt - 13
  );

  // 添加模型
  const tileset = new Cesium.Cesium3DTileset({
    url: "/api/test3dtiles/tileset.json",
    // url: "/api/cdbm/chengdu/tileset.json",
    // url: "src/assets/resources/datas/test3dtiles/tileset.json",
    maximumScreenSpaceError: 1,
    shadows: Cesium.ShadowMode.ENABLED,
    customShader: exampleSource.createCustomShader(Cesium.Color.WHITE, lightPosition, 15),
  });

  // const tileset = Cesium.Model.fromGltf({
  //   url: "/api/test3dtiles/tileset.json",
  //   shadows: Cesium.ShadowMode.ENABLED,
  //   id: 101,
  //   customShader: exampleSource.createCustomShader(Cesium.Color.WHITE, lightPosition, 15),
  // });

  tileset.readyPromise.then((t: any) => {
    //原始点
    var center = t.boundingSphere.center;
    var cartographic = Cesium.Cartographic.fromCartesian(center);
    var longitude = cartographic.longitude;
    var latitude = cartographic.latitude;
    var alt = cartographic.height;
    //偏移后点
    var offset = Cesium.Cartesian3.fromRadians(longitude, latitude, alt + 10);
    // // 计算向量
    const vectorAB = Cesium.Cartesian3.subtract(offset, center, new Cesium.Cartesian3());
    // // 矩阵偏移
    t.modelMatrix = Cesium.Matrix4.fromTranslation(vectorAB);

    // 添加点光源位置标识
    const point = new Cesium.Entity({
      position: lightPosition,
      point: {
        pixelSize: 5,
        color: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1,
      },
    });
    datasource.entities.add(point);
    const maxNum = 18;
    const minNum = -18;
    const setup = 0.2;
    let i = 20;
    let upOrDown = true; // true 标识上升

    function renderScene() {
      if (upOrDown) {
        if (i >= maxNum) {
          upOrDown = false;
          i -= setup;
        } else {
          i += setup;
        }
      } else {
        if (i <= minNum) {
          upOrDown = true;
          i += setup;
        } else {
          i -= setup;
        }
      }
      lightPosition = Cesium.Cartesian3.fromRadians(
        longitude - 0.000001,
        latitude - 0.000001,
        alt + i
      );
      // console.log(lightPosition);
      point.position = lightPosition;
      tileset.customShader.setUniform("u_lightPosition", lightPosition);
      requestAnimationFrame(renderScene);
    }
    renderScene();
  });

  mapDataStore.cesiumViewer.scene.primitives.add(tileset);
  mapDataStore.cesiumViewer.zoomTo(tileset);
}

// 后处理
function postStageTest() {
  // 深景效果
  controlers = {
    focalDistance: 100,
    delta: 1.0,
    sigma: 2.0,
    stepSize: 1.0,
  };
  let focalDistanceParam = folder.add(controlers, "focalDistance", 0.0, 1000.0);
  focalDistanceParam.onChange((param: any) => {
    postStage.uniforms.focalDistance = controlers.focalDistance;
  });
  let deltaParam = folder.add(controlers, "delta", 0.0, 100.0);
  deltaParam.onChange((param: any) => {
    postStage.uniforms.delta = controlers.delta;
  });
  let sigmaParam = folder.add(controlers, "sigma", 0.0, 100.0);
  sigmaParam.onChange((param: any) => {
    postStage.uniforms.sigma = controlers.sigma;
  });
  let stepSizeParam = folder.add(controlers, "stepSize", 0.0, 100.0);
  stepSizeParam.onChange((param: any) => {
    postStage.uniforms.stepSize = controlers.stepSize;
  });
  folder.open();
  const postStage = Cesium.PostProcessStageLibrary.createDepthOfFieldStage();
  postStage.uniforms.focalDistance = controlers.focalDistance;
  postStage.uniforms.delta = controlers.delta;
  postStage.uniforms.sigma = controlers.sigma;
  postStage.uniforms.stepSize = controlers.stepSize;
  mapDataStore.cesiumViewer.scene.postProcessStages.add(postStage);
  //  高斯模糊
  // controlers = {
  //   delta: 1.0,
  //   sigma: 2.0,
  //   stepSize: 1.0,
  // };
  // let deltaParam = folder.add(controlers, "delta", 0.0, 100.0);
  // deltaParam.onChange((param: any) => {
  //   postStage.uniforms.delta = controlers.delta;
  // });
  // let sigmaParam = folder.add(controlers, "sigma", 0.0, 100.0);
  // sigmaParam.onChange((param: any) => {
  //   postStage.uniforms.sigma = controlers.sigma;
  // });
  // let stepSizeParam = folder.add(controlers, "stepSize", 0.0, 100.0);
  // stepSizeParam.onChange((param: any) => {
  //   postStage.uniforms.stepSize = controlers.stepSize;
  // });
  // folder.open();
  // const postStage = Cesium.PostProcessStageLibrary.createBlurStage();
  // postStage.uniforms.delta = controlers.delta;
  // postStage.uniforms.sigma = controlers.sigma;
  // postStage.uniforms.stepSize = controlers.stepSize;
  // mapDataStore.cesiumViewer.scene.postProcessStages.add(postStage);
  // 黑白渐变渲染输入纹理
  // controlers = {
  //   gradations: 1.0,
  // };
  // let gradationsParam = folder.add(controlers, "gradations", 0.0, 100.0);
  // gradationsParam.onChange((param: any) => {
  //   postStage.uniforms.gradations = controlers.gradations;
  // });
  // folder.open();
  // const postStage = Cesium.PostProcessStageLibrary.createBlackAndWhiteStage();
  // postStage.uniforms.gradations = controlers.gradations;
  // mapDataStore.cesiumViewer.scene.postProcessStages.add(postStage);
  // 饱和度
  // controlers = {
  //   brightness: 1.0,
  // };
  // let brightnessParam = folder.add(controlers, "brightness", 0.0, 100.0);
  // brightnessParam.onChange((param: any) => {
  //   postStage.uniforms.brightness = controlers.brightness;
  // });
  // folder.open();
  // const postStage = Cesium.PostProcessStageLibrary.createBrightnessStage();
  // postStage.uniforms.brightness = controlers.brightness;
  // mapDataStore.cesiumViewer.scene.postProcessStages.add(postStage);
  // 边缘检测
  // controlers = {
  //   length: 1.0,
  // };
  // let lengthParam = folder.add(controlers, "length", 0.0, 100.0);
  // lengthParam.onChange((param: any) => {
  //   postStage.uniforms.length = controlers.length;
  // });
  // folder.open();
  // const postStage = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
  // postStage.uniforms.color = Cesium.Color.YELLOW;
  // postStage.uniforms.length = controlers.length;
  // mapDataStore.cesiumViewer.scene.postProcessStages.add(
  //   Cesium.PostProcessStageLibrary.createSilhouetteStage([postStage])
  // );
  // 模拟光照亮相机镜头的效果 TODO
  // controlers = {
  //   intensity: 2.0,
  //   distortion: 10.0,
  //   ghostDispersal: 0.4,
  //   haloWidth: 0.4,
  //   dirtAmount: 0.4,
  // };
  // let intensityParam = folder.add(controlers, "intensity", 0.0, 100.0);
  // intensityParam.onChange((param: any) => {
  //   postStage.uniforms.intensity = controlers.intensity;
  // });
  // let distortionParam = folder.add(controlers, "distortion", 0.0, 100.0);
  // distortionParam.onChange((param: any) => {
  //   postStage.uniforms.distortion = controlers.distortion;
  // });
  // let ghostDispersalParam = folder.add(controlers, "ghostDispersal", 0.0, 100.0);
  // ghostDispersalParam.onChange((param: any) => {
  //   postStage.uniforms.ghostDispersal = controlers.ghostDispersal;
  // });
  // let haloWidthParam = folder.add(controlers, "haloWidth", 0.0, 100.0);
  // haloWidthParam.onChange((param: any) => {
  //   postStage.uniforms.haloWidth = controlers.haloWidth;
  // });
  // let dirtAmountParam = folder.add(controlers, "dirtAmount", 0.0, 100.0);
  // dirtAmountParam.onChange((param: any) => {
  //   postStage.uniforms.dirtAmount = controlers.dirtAmount;
  // });
  // folder.open();
  // const postStage = Cesium.PostProcessStageLibrary.createLensFlareStage();
  // postStage.uniforms.dirtTexture = "src/assets/resources/images/404.jpg";
  // postStage.uniforms.starTexture = "src/assets/resources/images/404.jpg";
  // postStage.uniforms.intensity = controlers.intensity;
  // postStage.uniforms.distortion = controlers.distortion;
  // postStage.uniforms.ghostDispersal = controlers.ghostDispersal;
  // postStage.uniforms.haloWidth = controlers.haloWidth;
  // postStage.uniforms.dirtAmount = controlers.dirtAmount;
  // mapDataStore.cesiumViewer.scene.postProcessStages.add(postStage);
  // 夜视效果
  // const postStage = Cesium.PostProcessStageLibrary.createNightVisionStage();
  // mapDataStore.cesiumViewer.scene.postProcessStages.add(
  //   Cesium.PostProcessStageLibrary.createSilhouetteStage([postStage])
  // );
}

// 白膜加载测试

function add3dtilesTest() {
  //  关闭地图光照
  mapDataStore.cesiumViewer.scene.globe.enableLighting = false;
  mapDataStore.cesiumViewer.shadows = false;
  // 深度测试
  mapDataStore.cesiumViewer.scene.globe.depthTestAgainstTerrain = true;

  // 添加模型
  const tileset = new Cesium.Cesium3DTileset({
    // url: "/api/cdbm/chengdu/tileset.json",
    url: "/api/cesiumlab-baimoanli/tileset.json",
    // maximumScreenSpaceError: 8,
    // shadows: Cesium.ShadowMode.ENABLED,
  });

  // tileset.readyPromise.then((t) => {
  //   t.style = new Cesium.Cesium3DTileStyle({
  //     color: {
  //       conditions: [
  //         ["${floor} >= 80", "color('purple')"],
  //         ["${floor} >= 60", "color('red')"],
  //         ["${floor} >= 20", "color('orange')"],
  //         ["true", "color('blue')"],
  //       ],
  //     },
  //   });
  //   debugger;
  // });

  tileset.readyPromise.then((t) => {
    t.style = new Cesium.Cesium3DTileStyle({
      color: {
        conditions: [
          ["${isClick}", "color('red')"],
          ["true", "color('blue')"],
        ],
      },
    });
  });

  // tileset.tileVisible.addEventListener(function (tile) {
  //   var content = tile.content;
  //   var featuresLength = content.featuresLength;
  //   for (var i = 0; i < featuresLength; i += 2) {
  //     const feature = content.getFeature(i);
  //     if (feature.isClick) {
  //       feature.color = Cesium.Color.RED;
  //       console.log("ok");
  //     } else {
  //       feature.color = Cesium.Color.fromRandom();
  //     }
  //   }
  // });

  mapDataStore.cesiumViewer.scene.primitives.add(tileset);
  mapDataStore.cesiumViewer.zoomTo(tileset);

  const handler = new Cesium.ScreenSpaceEventHandler(mapDataStore.cesiumViewer.canvas);

  // When a feature is left clicked, print its class name and properties
  handler.setInputAction((movement: any) => {
    const feature = mapDataStore.cesiumViewer.scene.pick(movement.position);
    if (!Cesium.defined(feature)) {
      return;
    }
    debugger;
    console.log(feature);

    feature.setProperty("isClick", true);
    // feature.isClick = !feature.isClick;
    // feature.color = Cesium.Color.RED;
    // console.log(`Class: ${feature.getExactClassName()}`);
    // console.log("Properties:");
    // const propertyIds = feature.getPropertyIds();
    // const length = propertyIds.length;
    // for (let i = 0; i < length; ++i) {
    //   const propertyId = propertyIds[i];
    //   const value = feature.getProperty(propertyId);
    //   console.log(`  ${propertyId}: ${value}`);
    // }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// 添加gltf测试
function addGLTFTest() {
  // mapDataStore.cesiumViewer.shadows = false;
  // 修改阴影深度（越小越深）
  // mapDataStore.cesiumViewer.shadowMap.darkness = 0.6;
  // debugger;

  const position = Cesium.Cartesian3.fromDegrees(104.066, 30.656, 600);
  const heading = Cesium.Math.toRadians(135);
  const pitch = 0;
  const roll = 0;
  const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
  const orientationMatrix4 = Cesium.Matrix4.fromTranslationQuaternionRotationScale(
    position,
    orientation,
    Cesium.Cartesian3.ONE
  );

  const L00 = new Cesium.Cartesian3(
    1.234709620475769,
    1.221461296081543,
    1.273156881332397
  );
  const L1_1 = new Cesium.Cartesian3(
    1.135921120643616,
    1.171217799186707,
    1.287644743919373
  );
  const L10 = new Cesium.Cartesian3(
    1.245193719863892,
    1.245591878890991,
    1.282818794250488
  );
  const L11 = new Cesium.Cartesian3(
    -1.106930732727051,
    -1.112522482872009,
    -1.153198838233948
  );
  const L2_2 = new Cesium.Cartesian3(
    -1.086226940155029,
    -1.079731941223145,
    -1.101912498474121
  );
  const L2_1 = new Cesium.Cartesian3(
    1.189834713935852,
    1.185906887054443,
    1.214385271072388
  );
  const L20 = new Cesium.Cartesian3(
    0.01778045296669,
    0.02013735473156,
    0.025313569232821
  );
  const L21 = new Cesium.Cartesian3(
    -1.086826920509338,
    -1.084611177444458,
    -1.111204028129578
  );
  const L22 = new Cesium.Cartesian3(
    -0.05241484940052,
    -0.048303380608559,
    -0.041960217058659
  );

  const environmentMapURL =
    "https://cesium.com/public/SandcastleSampleData/kiara_6_afternoon_2k_ibl.ktx2";

  const coefficients = [L00, L1_1, L10, L11, L2_2, L2_1, L20, L21, L22];

  const imageBasedLighting = new Cesium.ImageBasedLighting();
  imageBasedLighting.luminanceAtZenith = 0.5;
  imageBasedLighting.sphericalHarmonicCoefficients = coefficients;
  imageBasedLighting.specularEnvironmentMaps = environmentMapURL;

  const gltf = Cesium.Model.fromGltf({
    url: "src/assets/resources/datas/models/Cesium_Air.glb",
    // scene: mapDataStore.cesiumViewer.scene,
    scale: 5,
    modelMatrix: orientationMatrix4,
    id: Cesium.createGuid(),
    minimumPixelSize: 100,
    maximumScale: 100,
    shadows: Cesium.ShadowMode.CAST_ONLY,
    // debugShowBoundingVolume: true,
    // debugWireframe: true,
    // clampAnimations: false,
    // heightReference: Cesium.HeightReference.NONE,
    // color: Cesium.Color.PINK,
    // colorBlendMode: Cesium.ColorBlendMode.HIGHLIGHT,
    // colorBlendAmount: 0.9,
    // clippingPlanes: new Cesium.ClippingPlaneCollection({
    //   planes: [new Cesium.ClippingPlane(new Cesium.Cartesian3(1.0, 0.0, 0.0), 0.0)],
    // }),
    // lightColor: new Cesium.Cartesian3(1.0, 1.0, 1.0),
    // imageBasedLighting: imageBasedLighting,
    showCreditsOnScreen: true,
  });

  gltf.readyPromise.then((g: any) => {
    g.activeAnimations.addAll({
      multiplier: 1.0,
      loop: Cesium.ModelAnimationLoop.REPEAT,
    });
    mapDataStore.cesiumViewer.camera.flyToBoundingSphere(g.boundingSphere, {
      duration: 2,
    });
  });
  mapDataStore.cesiumViewer.scene.primitives.add(gltf);

  const handler = new Cesium.ScreenSpaceEventHandler(mapDataStore.cesiumViewer.canvas);

  // When a feature is left clicked, print its class name and properties
  handler.setInputAction((movement: any) => {
    const feature = mapDataStore.cesiumViewer.scene.pick(movement.position);
    debugger;
    if (!Cesium.defined(feature)) {
      return;
    }
    console.log(feature);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

/**
 * 可视域
 */
function addViewshed() {
  //  关闭地图光照
  mapDataStore.cesiumViewer.scene.globe.enableLighting = true;
  mapDataStore.cesiumViewer.shadows = true;
  // 深度测试
  mapDataStore.cesiumViewer.scene.globe.depthTestAgainstTerrain = true;

  // 添加模型
  const tileset = new Cesium.Cesium3DTileset({
    url: "/api/cesiumlab-baimoanli/tileset.json",
  });

  tileset.readyPromise.then((t) => {
    debugger;
    t.boundingSphere;
    t.style = new Cesium.Cesium3DTileStyle({
      color: {
        conditions: [
          ["${floor} >= 80", "color('purple')"],
          ["${floor} >= 60", "color('red')"],
          ["${floor} >= 20", "color('orange')"],
          ["true", "color('blue')"],
        ],
      },
    });

    var cartographic = Cesium.Cartographic.fromCartesian(t.boundingSphere.center);
    var longitude = cartographic.longitude;
    var latitude = cartographic.latitude;
    var alt = cartographic.height;
    // 相机点
    var offset = Cesium.Cartesian3.fromRadians(longitude, latitude, alt - 130);
    // 指向点
    var offsetEnd = Cesium.Cartesian3.fromRadians(longitude, latitude + 0.0003, alt);
    const viewShed = new ViewShed(mapDataStore.cesiumViewer, {
      viewPosition: offset,
      viewPositionEnd: offsetEnd,
    });
  });
  // x: -2852077.6410658467, y: 4654140.247312652, z: 3288558.84539160
  // x: -2852060.427186479, y: 4654112.156980316, z: 3288613.1627483796

  mapDataStore.cesiumViewer.scene.primitives.add(tileset);
  mapDataStore.cesiumViewer.zoomTo(tileset);
}

/**
 *改变模型对比度
 */
function changeContrast() {
  const scene = mapDataStore.cesiumViewer.scene;
  mapDataStore.cesiumViewer.scene.globe.enableLighting = false;
  mapDataStore.cesiumViewer.shadows = false;
  controlers = {
    contrast: 1.0,
    brightness: 0.0,
  };

  let contrastParam = folder.add(controlers, "contrast", 0.0, 5.0, 0.01);
  let brightnessParam = folder.add(controlers, "brightness", -1.0, 1.0, 0.01);

  const customShader = new Cesium.CustomShader({
    uniforms: {
      contrast: {
        type: Cesium.UniformType.FLOAT,
        value: controlers.contrast,
      },
      brightness: {
        type: Cesium.UniformType.FLOAT,
        value: controlers.brightness,
      },
    },
    fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                    // 定义默认颜色
                    vec3 color = material.diffuse;
                    vec3 yiq = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)),
                                    dot(color.rgb, vec3(0.596, -0.275, -0.321)),
                                    dot(color.rgb, vec3(0.212, -0.523, 0.311)));
                    yiq.r = (yiq.r - 0.5) * contrast + 0.5; // 对比度调整  contrast默认1.0
                    yiq.r += brightness; // 亮度调整 brightness 默认0.0
                    color.rgb = vec3(dot(yiq, vec3(1.0, 0.956, 0.621)),
                                     dot(yiq, vec3(1.0, -0.272, -0.647)),
                                     dot(yiq, vec3(1.0, -1.107, 1.704)));
                    material.diffuse = color;
        }
    `,
  });

  contrastParam.onChange((param: any) => {
    customShader.uniforms.contrast.value = controlers.contrast;
  });

  brightnessParam.onChange((param: any) => {
    customShader.uniforms.brightness.value = controlers.brightness;
  });
  const tileset = new Cesium.Cesium3DTileset({
    url: "/api/test3dtiles/tileset.json",
    // url: "/api/cdbm/chengdu/tileset.json",
    // url: "/assets/resources/datas/test3dtiles/tileset.json",
    maximumScreenSpaceError: 1,
    customShader,
  });

  tileset.readyPromise.then((t: any) => {
    folder.open();
    //原始点
    var center = t.boundingSphere.center;
    var cartographic = Cesium.Cartographic.fromCartesian(center);
    var longitude = cartographic.longitude;
    var latitude = cartographic.latitude;
    var alt = cartographic.height;
    //偏移后点
    var offset = Cesium.Cartesian3.fromRadians(longitude, latitude, alt + 10);
    // // 计算向量
    const vectorAB = Cesium.Cartesian3.subtract(offset, center, new Cesium.Cartesian3());
    // // 矩阵偏移
    t.modelMatrix = Cesium.Matrix4.fromTranslation(vectorAB);
  });

  mapDataStore.cesiumViewer.scene.primitives.add(tileset);
  mapDataStore.cesiumViewer.zoomTo(tileset);
}

/**
 * 自定义primitive
 */
function drawCommand() {
  // 经纬度
  let lon = 104.066;
  let lat = 30.656;
  let height = 250000 / 2;
  // 得到笛卡尔坐标
  let origin = Cesium.Cartesian3.fromDegrees(lon, lat, height);
  // 创建矩阵
  let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
  let myPrimitive = new MyPrimitive(modelMatrix);
  debugger;
  mapDataStore.cesiumViewer.scene.primitives.add(myPrimitive);

  // mapDataStore.cesiumViewer.flyTo(myPrimitive);
}

/**
 * 泛光效果
 */
function bloomTest() {
  const fs = `
// uniform sampler2D colorTexture;
// uniform vec3 defaultColor;
// uniform float defaultOpacity;
// uniform float luminosityThreshold;
// uniform float smoothWidth;

// czm_material czm_getMaterial(czm_materialInput materialInput) { 
//             czm_material material = czm_getDefaultMaterial(materialInput); 
//             vec4 texel = texture2D(image, materialInput.st);
//             vec3 luma = vec3(0.299, 0.587, 0.114);
//             float v = dot(texel.xyz, luma);
//             vec4 outputColor = vec4(defaultColor.rgb, defaultOpacity);
//             float alpha = smoothstep(luminosityThreshold, luminosityThreshold + smoothWidth, v);
//             vec4 fragColor = mix(outputColor, texel, alpha);
//             material.diffuse = fragColor.rgb;
//             material.alpha = fragColor.a; 
//             return material; 
//         }


// varying vec2 v_textureCoordinates;
uniform sampler2D colorTexture;
uniform vec2 colorTextureDimensions;
uniform vec2 direction;

float gaussianPdf(in float x, in float sigma) {
    return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;
}

czm_material czm_getMaterial(czm_materialInput materialInput) { 
  vec2 invSize = 1.0 / colorTextureDimensions;
    float fSigma = float(SIGMA);
    float weightSum = gaussianPdf(0.0, fSigma);
    vec3 diffuseSum = texture2D( colorTexture, materialInput.st).rgb * weightSum;
    for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
        float x = float(i);
        float w = gaussianPdf(x, fSigma);
        vec2 uvOffset = direction * invSize * x;
        vec3 sample1 = texture2D( colorTexture, materialInput.st + uvOffset).rgb;
        vec3 sample2 = texture2D( colorTexture, materialInput.st - uvOffset).rgb;
        diffuseSum += (sample1 + sample2) * w;
        weightSum += 2.0 * w;
    }
    vec4 fragColor = vec4(diffuseSum/weightSum, 1.0);
    material.diffuse = fragColor.rgb;
    material.alpha = fragColor.a; 
    return material; 
 }



// varying vec2 v_textureCoordinates;
// uniform sampler2D blurTexture1;
// uniform sampler2D blurTexture2;
// uniform sampler2D blurTexture3;
// uniform sampler2D blurTexture4;
// uniform sampler2D blurTexture5;
// uniform sampler2D colorTexture;
// uniform float bloomStrength;
// uniform float bloomRadius;
// uniform float bloomFactors[NUM_MIPS];
// uniform vec3 bloomTintColors[NUM_MIPS];
// uniform bool glowOnly;

// float lerpBloomFactor(const in float factor) {
//     float mirrorFactor = 1.2 - factor;
//     return mix(factor, mirrorFactor, bloomRadius);
// }

// void main() {

//     vec4 color = texture2D(colorTexture, v_textureCoordinates);
//     vec4 bloomColor = bloomStrength * (
//         lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.) * texture2D(blurTexture1, v_textureCoordinates) +
//         lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.) * texture2D(blurTexture2, v_textureCoordinates) +
//         lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.) * texture2D(blurTexture3, v_textureCoordinates) +
//         lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.) * texture2D(blurTexture4, v_textureCoordinates) +
//         lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.) * texture2D(blurTexture5, v_textureCoordinates)
//     );

//     gl_FragColor = glowOnly ? bloomColor : bloomColor + color;
// }
  `;

  const ellipsoid = new Cesium.EllipsoidGeometry({
    // vertexFormat: Cesium.VertexFormat.POSITION_ONLY,
    radii: new Cesium.Cartesian3(1000000.0, 500000.0, 500000.0),
  });

  const instance = new Cesium.GeometryInstance({
    geometry: ellipsoid,
  });

  mapDataStore.cesiumViewer.scene.primitives.add(
    new Cesium.Primitive({
      geometryInstances: instance,
      modelMatrix: Cesium.Matrix4.multiplyByTranslation(
        Cesium.Transforms.eastNorthUpToFixedFrame(
          Cesium.Cartesian3.fromDegrees(104.066, 30.656, 250000 / 2)
        ),
        new Cesium.Cartesian3(0.0, 0.0, 500000.0),
        new Cesium.Matrix4()
      ),
      appearance: new Cesium.EllipsoidSurfaceAppearance({
        // fragmentShaderSource: fs,
        material: new Cesium.Material({
          fabric: {
            type: "Bloom",
            uniforms: {
              // image: "src/assets/resources/images/elevation/color2.png",
              // defaultColor: new Cesium.Cartesian3(1, 0, 0),
              // defaultOpacity: 1.0,
              // luminosityThreshold: 1.0,
              // smoothWidth: 10.0,
              colorTexture: "src/assets/resources/images/elevation/color.png",
              colorTextureDimensions: new Cesium.Cartesian2(1, 1),
              direction: new Cesium.Cartesian2(221, 20),
            },
            source: fs,
          },
        }),
      }),
    })
  );
}
</script>

<style scoped>
.cesium-map {
  height: 100%;
  width: 100%;
}
#cesiumContainer {
  height: 100vh;
  width: 100vw;
}

.map-tools {
  position: absolute;
  left: 65vw;
  top: 2vw;
  max-width: 30vw;
  pointer-events: all;
}
</style>
