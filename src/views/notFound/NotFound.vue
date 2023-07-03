<template>
  <div class="not-found">
    <a @click.prevent="goMain()" class="go-main">回到首页</a>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
function goMain() {
  router.push({ path: "/main", replace: true });
}
</script>

<style scoped>
.not-found {
  width: 100vw;
  height: 100vh;
  background-image: url("/assets/resources/images/404.jpg");
  /* background-image: url("../assets/resources/images/404.jpg"); */
  background-size: 100% 100%;
  background-position: center center;
}

.go-main {
  position: absolute;
  transform: translate(-50%, -50%);
  top: 23%;
  left: 48.5%;
  font-size: 20px;
}
</style>
