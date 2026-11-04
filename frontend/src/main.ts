import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import { MotionPlugin } from '@vueuse/motion'

import App from './App.vue'
import router from './router'
import pinia from './stores'
import './styles/index.css'

const app = createApp(App)

// 统一兜底：页面级异常和未捕获的 Promise 异常都留下带时间戳的痕迹，方便对照后端日志
app.config.errorHandler = (err, _instance, info) => {
  console.error(`[vue-error ${new Date().toISOString()}] ${info}`, err)
}

window.addEventListener('unhandledrejection', (event) => {
  console.error(`[promise-error ${new Date().toISOString()}]`, event.reason)
})

app.use(pinia).use(router).use(ElementPlus, { locale: zhCn }).use(MotionPlugin).mount('#app')
