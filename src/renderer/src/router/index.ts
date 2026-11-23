import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { useUserStore } from '@/stores/user'

// 桌面端使用 hash 模式（加载本地文件，history 模式会 404）
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layouts/GlassShell.vue'),
    redirect: '/workbench',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'workbench',
        name: 'Workbench',
        component: () => import('@/views/WorkbenchView.vue'),
        meta: { title: '智能工作台' }
      },
      {
        path: 'p360',
        name: 'P360',
        component: () => import('@/views/P360View.vue'),
        meta: { title: '患者 360° 工作站', roles: ['doctor', 'nurse', 'admin', 'manager'] }
      },
      {
        path: 'inpatient',
        name: 'Inpatient',
        component: () => import('@/views/InpatientView.vue'),
        meta: { title: '住院工作站', roles: ['doctor', 'nurse', 'admin', 'manager'] }
      },
      {
        path: 'emr',
        name: 'Emr',
        component: () => import('@/views/EmrView.vue'),
        meta: { title: '电子病历 EMR', roles: ['doctor', 'nurse', 'pharmacist', 'admin', 'manager'] }
      },
      {
        path: 'consultations',
        name: 'Consultations',
        component: () => import('@/views/ConsultationView.vue'),
        meta: { title: '会诊管理', roles: ['doctor', 'admin', 'manager'] }
      },
      {
        path: 'drugs',
        name: 'Drugs',
        component: () => import('@/views/DrugsView.vue'),
        meta: { title: '药品说明书', roles: ['doctor', 'nurse', 'pharmacist', 'admin', 'manager'] }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: { title: '系统设置', roles: ['admin', 'manager'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return { path: '/login' }
  }
  // 角色裁剪兜底：直接敲 hash 进入无权限模块时，退回工作台并提示
  const roles = to.meta.roles as string[] | undefined
  if (roles?.length && userStore.user && !userStore.user.roles.some((r) => roles.includes(r))) {
    ElMessage.warning('当前账号无权访问该模块')
    return { path: '/workbench' }
  }
  document.title = `${to.meta.title ?? ''} - HIS 医疗信息管理系统`
  return true
})

export default router
