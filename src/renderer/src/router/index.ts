import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 桌面端使用 hash 模式（加载本地文件，history 模式会 404）
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '工作台', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 登录守卫占位：接入后端 RBAC 后在这里校验 token 与角色
router.beforeEach((to) => {
  document.title = `${to.meta.title ?? ''} - HIS 医生工作站`
  return true
})

export default router
