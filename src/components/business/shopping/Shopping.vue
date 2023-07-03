<template>
  <div class="shopping-container">
    <h1>购物车示例</h1>
    <hr />
    <ProductList />
    <hr />
    <ShoppingCart />
  </div>
</template>

<script setup lang="ts">
import ProductList from "./ProductList.vue";
import ShoppingCart from "./ShoppingCart.vue";
</script>

<style scoped>
.shopping-container {
  margin: 5vw 1vw;
  padding: 1vw;
  color: white;
  width: 30vw;
  border: 1px solid #079393;
  border-radius: 1vw;
  pointer-events: all;
}
</style>
