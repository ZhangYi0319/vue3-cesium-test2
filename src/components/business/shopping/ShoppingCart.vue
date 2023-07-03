<template>
  <div class="cart">
    <h2>你的购物车</h2>
    <p>
      <i>请添加一些商品到购物车</i>
    </p>
    <ul>
      <li v-for="item in cartStore.cartProducts">
        {{ item.title }} - >{{ item.price }}￥ X >{{ item.quantity }}
      </li>
      <!-- <li>商品名称 - 商品价格 X 商品数量</li> -->
    </ul>
    <p>商品总价: {{ cartStore.totalPrice }}￥</p>
    <p>
      <button :disabled="cartStore.cartProducts.length < 1" @click="cartStore.checkout()">
        结算
      </button>
    </p>
    <p v-show="!!cartStore.checkoutStatus">结算{{ cartStore.checkoutStatus }}</p>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from "@/stores/cart";

const cartStore = useCartStore();
</script>

<style scoped></style>
