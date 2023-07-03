<!--  ctrl+cmd+i
 * @license: 张怡 版权所有
 * @作者: 张怡
 * @创建时间: 2023-01-12 09:36:50
 * @名称: 
 * @修改人: 张怡
 * @修改时间: 2023-01-12 09:38:43
 * @描述: 
 * 
-->

<template>
  <!-- <div class="business-container">这是业务层</div> -->
  <div class="business-container">
    <div class="menu-container">
      <el-radio-group v-model="radio">
        <el-radio-button label="购物车"></el-radio-button>
        <el-radio-button label="功能2"></el-radio-button>
        <el-radio-button label="功能3"></el-radio-button>
        <el-radio-button label="功能4"></el-radio-button>
      </el-radio-group>
    </div>
    <Shopping v-if="radio == '购物车'"></Shopping>
  </div>
</template>

<script setup lang="ts">
import Shopping from "./shopping/Shopping.vue";
import { ref, reactive, toRefs } from "vue";
// import { ToRefs } from "vue";
// const radio = ToRefs("购物车");
const radio = ref("购物车");
</script>

<style scoped>
.business-container {
  position: absolute;
  width: inherit;
  height: inherit;
  /* background-color: rgba(0, 255, 255, 0.1); */
  z-index: 50;
  pointer-events: none;
}
.menu-container {
  margin: 2vw 1vw;
  width: 30vw;
  pointer-events: all;
}
</style>
