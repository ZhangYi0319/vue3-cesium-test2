<template>
  <div class="map-container">
    <CesiumMap />
    <!-- <LeafletMap /> -->
  </div>
</template>

<script setup lang="ts">
import CesiumMap from "./cesium-map/CesiumMap.vue";
import LeafletMap from "./leaflet-map/LeafletMap.vue";
</script>

<style scoped>
.map-container {
  position: absolute;
  width: inherit;
  height: inherit;
  /* pointer-events: none; */
}
</style>
