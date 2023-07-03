import { buyProducts, type IProduct } from '@/api/shop';
import { defineStore } from 'pinia';
import { useProductsStore } from './products';

type CartProdut = { quantity: number } & Omit<IProduct, 'inventory'>;

export const useCartStore = defineStore('cart', {
    state() {
        return {
            cartProducts: [] as CartProdut[], // 购物车商品列表
            checkoutStatus: null as null | string
        }
    },

    getters: {
        totalPrice(state) {
            return state.cartProducts.reduce((total, item) => {
                return total + item.price * item.quantity
            }, 0);
        }
    },

    actions: {
        addProductToCart(product: IProduct) {
            // // 先看商品有没有库存
            if (product.inventory < 1) {
                return
            }
            // 检查是否已有商品
            //有则数量+1
            //无则加到购物车列表中
            const cartItem = this.cartProducts.find(item => item.id === product.id);
            if (!!cartItem) {
                cartItem.quantity++;
            } else {
                this.cartProducts.push({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    quantity: 1
                });
            }

            const productsStore = useProductsStore()
            productsStore.decrementProduct(product)
        },
        async checkout() {
            const ret = await buyProducts();
            this.checkoutStatus = ret ? '成功' : '失败'
            if (ret) {
                this.cartProducts = [];
            }
        }
    }
})