import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/

export default defineConfig((({ command, mode, ssrBuild }: any) => {
  if (command === 'serve') {
    return {
      // dev 独有配置
      base: '/vue3-cesium-test2',
      plugins: [
        vue()
      ], //配置插件
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        }
      },
      // 配置代理
      server: {
        open: process.platform === "darwin",
        host: "0.0.0.0",
        port: 8088,
        https: false,
        proxy: {
          '/api': {
            target: 'http://localhost:8091', //实际请求地址
            changeOrigin: true,
            rewrite: (path: any) => path.replace(/^\/api/, 'api') // http://localhost:8091/api
          }
        }
      }
    }
  } else {
    // command === 'build'
    return {
      // build 独有配置
      base: '/vue3-cesium-test2',
      plugins: [
        vue()
      ], //配置插件
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        }
      },
      // 配置代理
      server: {
        open: process.platform === "darwin",
        host: "0.0.0.0",
        port: 8088,
        https: false,
        proxy: {
          '/api': {
            target: 'http://localhost:8091', //实际请求地址
            changeOrigin: true,
            rewrite: (path: any) => path.replace(/^\/api/, 'api') // http://localhost:8091/api
          },
          '/api1': {
            target: 'http://localhost:8091', //实际请求地址
            changeOrigin: true,
            rewrite: (path: any) => path.replace(/^\/api1/, 'api1') // http://localhost:8091/api1
          }
        }
      }
    }
  }
}) as any)

