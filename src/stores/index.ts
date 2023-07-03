// import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// export const useCounterStore = defineStore('counter', () => {
//   const count = ref(0)
//   const doubleCount = computed(() => count.value * 2)
//   function increment() {
//     count.value++
//   }
//   return { count, doubleCount, increment }
// })
// 1.定义并导出容器
// 参数1：容器的ID，必须唯一，将来Pinia会把所有的容器挂载到根容器
// 参数2：选项对象
export const useMainStore = defineStore('main', {
  /**
   * 类似于组件的data，用来存储全局状态的
   * 1.必须是函数，这样是为了在服务端渲染的时候避免交叉请求导致的数据状态污染
   * 2.必须是箭头函数，这是为了更好TS类型推导
   */
  state: () => {
    return {
      count: 100,
      foo: 'bar',
      arr: [1, 2, 3]
    }
  },
  /**
   * 类似于组件的computed,用来封装计算属性，有缓存的功能
   */
  getters: {
    // 函数接收一个可选参数：state 状态对象
    // count10(state) {
    //   console.log('调用count10');
    //   return state.count + 10;
    // }
    // 如果getters中使用了this，必须手动指定返回值类型
    count10(): number {
      console.log('调用count10');
      return this.count + 10;
    }
  },
  /**
   * 类似于组件的methods，封装业务逻辑，修改state
   */
  actions: {
    // 注意不要使用箭头函数定义actions
    changeState(num: number) {
      // this.count++;
      // this.foo = 'hello';
      // this.arr.push(4);

      this.$patch(state => {
        state.count += num;
        state.foo = 'hello';
        state.arr.push(num);
      })
    }
  }
})
