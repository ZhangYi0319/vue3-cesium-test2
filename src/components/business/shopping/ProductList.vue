<template>
  <h2>商品列表</h2>
  <ul>
    <li v-for="item in productsStore.all">
      {{ item.title }} - {{ item.price }}￥
      <br />
      <button :disabled="!item.inventory" @click="cartStore.addProductToCart(item)">
        添加到购物车
      </button>
    </li>
    <!-- <li>
      商品名称-商品价格
      <br />
      <button>添加到购物车</button>
    </li>
    <li>
      商品名称-商品价格
      <br />
      <button>添加到购物车</button>
    </li> -->
  </ul>
</template>

<script setup lang="ts">
import { useCartStore } from "@/stores/cart";
import { useProductsStore } from "@/stores/products";

const productsStore = useProductsStore();
const cartStore = useCartStore();

// 加载所有数据
productsStore.loadAllProducts();
</script>

<style scoped></style>
