import { createRouter, createWebHistory } from 'vue-router';

// 1. 定义路由组件
// import Login from '@/views/login/Login.vue'
const Login = () => import('../views/login/Login.vue')
const Main = () => import('../views/main/Main.vue')
const NotFound = () => import('../views/notFound/NotFound.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      // 重定向
      // redirect: '/home'
      // 重定向命名路由
      // redirect: {
      //     name: 'home'
      // }
      redirect: (to) => {
        console.log(to);
        return {
          path: '/main'
        }
      }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    }, {
      path: '/main',
      name: 'main',
      component: Main,
    },
    {
      // 404页面
      // 使用正则的方式,匹配任意的
      path: '/:path(.*)',
      component: NotFound
    }
  ]
})

export default router
