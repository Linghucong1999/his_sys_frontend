/** 后端 { code, data, message } 解包后的类型（axios 拦截器已解包，业务层直接用 data） */

export interface LoginResult {
  token: string
  user: UserInfo
}

export interface UserInfo {
  userId: string
  username: string
  realName: string
  roles: string[]
  department?: string
  title?: string
}

export interface Patient {
  _id: string
  empiId: string
  name: string
  gender?: string
  birthDate?: string
  idCardNo?: string
  phone?: string
  address?: string
  medicalRecordNo?: string
  insuranceType?: string
  /** 待完成接诊项（未写病历/未写处方/未写检查） */
  pending?: string[]
  status?: string
}

export interface DiagnosisItem {
  code: string
  name: string
}

export interface MedicalRecord {
  _id: string
  recordNo: string
  type: 'outpatient' | 'admission' | 'prescription' | 'exam'
  patientId: string
  patientName: string
  department: string
  doctorName: string
  visitId?: string
  chiefComplaint?: string
  presentIllness?: string
  pastHistory?: string
  physicalExam?: string
  diagnosis: DiagnosisItem[]
  prescriptionSummary?: string
  examRequest?: string
  signed: boolean
  prescriptionItems?: RxItem[]
  signedAt?: string
  signedBy?: string
  visitedAt?: string
  createdAt?: string
}

export interface Visit {
  _id: string
  visitNo: string
  patientId: string
  patientName: string
  type: 'first' | 'followup'
  department: string
  doctorName: string
  chiefComplaint?: string
  status: 'in_progress' | 'completed'
  visitedAt: string
}

export interface Consultation {
  _id: string
  consultNo: string
  patientId: string
  patientName: string
  patientRef?: string
  fromDept: string
  toDept: string
  type: 'urgent' | 'normal'
  summary: string
  status: 'pending' | 'accepted' | 'completed'
  urgeCount: number
  createdAt?: string
}

export interface Bed {
  _id: string
  bedNo: string
  ward: string
  status: 'occupied' | 'empty'
  patientId?: string | { _id: string; name: string; gender?: string; birthDate?: string }
  patientName?: string
  admissionNo?: string
  flag?: 'normal' | 'postop' | 'leaving'
  note?: string
}

export interface InpatientOrder {
  _id: string
  patientId: string
  bedNo: string
  type: 'long' | 'temp'
  category: 'drug' | 'nursing' | 'exam'
  content: string
  frequency?: string
  status: 'active' | 'stopped' | 'done'
}

export interface DashboardSummary {
  todayVisits: number
  followupVisits: number
  firstVisits: number
  pendingSigns: number
  pendingConsultations: number
  activeConsultations: number
  completedConsultationsToday: number
  todoCount: number
}

export interface TodoItem {
  id: string
  icon: string
  title: string
  sub: string
  kind: 'sign' | 'rx' | 'emr' | 'consult' | 'report'
  ref?: string
}

export interface SearchResultItem {
  kind: 'patient' | 'record' | 'drug' | 'command'
  title: string
  sub?: string
  ref?: string
  patientId?: string
  manufacturer?: string
  instructions?: string
  spec?: string
}

export interface RxItem {
  drug: string
  spec?: string
  dose?: string
  frequency?: string
  route?: string
  duration?: string
}

/** 药品说明书库条目 */
export interface DrugManual {
  _id: string
  drugName: string
  genericName?: string
  spec?: string
  manufacturer?: string
  approvalNo?: string
  indications?: string
  usage?: string
  adverseReactions?: string
  contraindications?: string
  precautions?: string
  fullText?: string
  source?: string
  category?: string
  crawledAt?: string
}

/** 未知药品记录 */
export interface UnknownDrug {
  _id: string
  drugName: string
  count: number
  doctorId?: string
  doctorName?: string
  patientName?: string
  status: string
}

export interface DictionaryItem {
  _id: string
  category: string
  code: string
  name: string
  extra?: Record<string, string>
}
