import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css'
import * as Cesium from "cesium"
import 'cesium/Build/Cesium/Widgets/widgets.css';
// import '/lib/Cesium/Widgets/widgets.css';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as turf from '@turf/turf'
// import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

if (typeof (window as any).Cesium === "undefined") {
    (window as any).Cesium = Cesium;
}

if (typeof (window as any).turf === "undefined") {
    (window as any).turf = turf;
}

(window as any).CESIUM_BASE_URL = "node_modules/cesium/Build/Cesium";
// (window as any).CESIUM_BASE_URL = "/";

const app = createApp(App)
const pinia = createPinia()


app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.mount('#app')

// export default Cesium