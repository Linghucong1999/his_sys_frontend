/** 前端呈现用的权限矩阵：只决定「入口是否可见」，鉴权一律以后端 @Roles / @PatientScope 为准 */
export type Action =
  | 'patient.create'
  | 'emr.write'
  | 'emr.sign'
  | 'print'
  | 'order.write'
  | 'drug.manage'
  | 'admin.console'

const ACTION_ROLES: Record<Action, string[]> = {
  'patient.create': ['doctor', 'admin'],
  'emr.write': ['doctor', 'admin'],
  'emr.sign': ['doctor'],
  print: ['doctor', 'nurse', 'admin', 'manager'],
  'order.write': ['doctor'],
  'drug.manage': ['pharmacist', 'admin'],
  'admin.console': ['admin', 'manager']
}

export function can(user: { roles?: string[] } | null | undefined, action: Action): boolean {
  const roles = user?.roles ?? []
  return roles.some((r) => (ACTION_ROLES[action] ?? []).includes(r))
}
