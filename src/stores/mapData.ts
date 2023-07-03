import { defineStore } from 'pinia';
import type { Viewer } from 'cesium'

export const useMapDataStore = defineStore('mapData', {
    state: () => {
        return {
            cesiumViewer: null as unknown as Viewer,
            isLoadTerrain: false
        }
    },
    getters: {},
    actions: {
        /**
         * 设置地图viewer
         * @param viewer 
         */
        setCesiumViewer(viewer: Viewer) {
            this.cesiumViewer = viewer;
        }
    }
})