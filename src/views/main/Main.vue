<template>
  <div class="main-container">
    <div class="main-header">
      <p class="header-title">头部标题头部标题头部标题</p>
    </div>
    <Business />
    <Map />
  </div>
</template>

<script setup lang="ts">
import Business from "@/components/business/Business.vue";
// import Business from "../../components/business/Business.vue";
import Map from "@/components/map/Map.vue";
// import Map from "../../components/map/Map.vue";
import { onBeforeMount, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
const route = useRoute();
const router = useRouter();
onBeforeMount(() => {});
onMounted(() => {});
// import { storeToRefs } from "pinia";
// import { useMainStore } from "@/stores/counter";
// const mainStore = useMainStore();
// console.log(mainStore.count);

// // 有问题，一次性的
// // const { count, foo } = mainStore;
// // pinia 其实就是把state数据都做了 reactive 处理了
// // 解决办法,变为响应式
// // 把解构的数据做ref响应式代理
// const { count, foo } = storeToRefs(mainStore);

// console.log(count.value);
// const changeState = () => {
//   // 方式一：数据修改最简单的方式就是这样，改单个
//   // mainStore.count++;
//   // mainStore.foo = "hello";
//   // 方式二：如果修改多个数据，建议使用$patch批量修改,具有性能优化
//   // mainStore.$patch({
//   //   count: mainStore.count + 1,
//   //   foo: "hello",
//   //   arr: [...mainStore.arr, 4],
//   // });
//   // 方式三：$patch 一个函数,更好批量更新的更新方式
//   // mainStore.$patch((state) => {
//   //   state.count++;
//   //   state.foo = "hello";
//   //   state.arr.push(4);
//   // });
//   // 方式四：逻辑多的时候，可以封装到actions做处理
//   mainStore.changeState(10);
// };
</script>

<style scoped>
.main-container {
  height: 100vh;
  width: 100vw;
}
.main-header {
  position: absolute;
  width: 100%;
  height: 4.74vw;
  /* background-color: pink; */
  background-image: url("/assets/resources/images/main/header.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;
  z-index: 51;
  text-align: center;
  padding: 0.5vw 0;
  pointer-events: none;
}
.header-title {
  font-size: 2vw;
  color: white;
}
</style>
