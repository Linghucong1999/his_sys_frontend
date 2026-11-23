export interface NavItem {
  view: string
  icon: string
  tip: string
  /** 可见角色；缺省表示全部角色可见 */
  roles?: string[]
}

export const ALL_ROLES = ['admin', 'manager', 'doctor', 'nurse', 'pharmacist']

/**
 * 侧边导航唯一事实来源：菜单可见性由这里的 roles 决定，
 * 路由侧由 router/index.ts 的 meta.roles 兜底（直接敲 hash 也会被拦截）。
 */
export const NAV_ITEMS: NavItem[] = [
  { view: 'workbench', icon: '🏠', tip: '智能工作台' },
  { view: 'p360', icon: '🩺', tip: '患者 360° 工作站', roles: ['doctor', 'nurse', 'admin', 'manager'] },
  { view: 'inpatient', icon: '🛏', tip: '住院工作站', roles: ['doctor', 'nurse', 'admin', 'manager'] },
  { view: 'emr', icon: '📋', tip: '电子病历 EMR', roles: ['doctor', 'nurse', 'pharmacist', 'admin', 'manager'] },
  { view: 'consultations', icon: '🤝', tip: '会诊管理', roles: ['doctor', 'admin', 'manager'] },
  { view: 'drugs', icon: '💊', tip: '药品说明书', roles: ['doctor', 'nurse', 'pharmacist', 'admin', 'manager'] },
  { view: 'settings', icon: '⚙️', tip: '系统设置', roles: ['admin', 'manager'] }
]

/** 按角色过滤可见菜单 */
export function visibleNavs(roles: string[] = []): NavItem[] {
  return NAV_ITEMS.filter((n) => !n.roles || n.roles.some((r) => roles.includes(r)))
}
