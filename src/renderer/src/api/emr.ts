import request from './request'
import type { MedicalRecord, DiagnosisItem, RxItem } from './types'

export interface SaveRecordInput {
  patientId: string
  patientName: string
  type: 'outpatient' | 'admission' | 'prescription'
  department?: string
  visitId?: string
  chiefComplaint?: string
  presentIllness?: string
  pastHistory?: string
  physicalExam?: string
  vitals?: {
    bpHigh?: string
    bpLow?: string
    breath?: string
    temp?: string
    pulse?: string
  }
  diagnosis?: DiagnosisItem[]
  prescriptionSummary?: string
  prescriptionItems?: RxItem[]
  /** 处方类型：western=西药/中成药；herbal=中药饮片 */
  prescriptionType?: 'western' | 'herbal'
  herbalUsage?: { decoction?: string; usage?: string; doses?: string }
  examRequest?: string
  /** 乐观锁版本号：来自当前编辑中的记录 */
  rev?: number
  /** 冲突后强制覆盖（后端会写审计） */
  force?: boolean
}

export function listRecords(params?: {
  keyword?: string
  signed?: string
  type?: string
}): Promise<MedicalRecord[]> {
  return request.get('/emr/records', { params })
}

/**
 * 患者维度病历：跨医生可见「已签名」记录（只读），未签名草稿只有本人可见。
 * 复诊调档必须走这个接口，否则看不到前一位医师书写的历史病历。
 */
export function listRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
  return request.get(`/emr/records/patient/${patientId}`)
}

export interface RecordPageQuery {
  keyword?: string
  signed?: string
  type?: string
  recent?: boolean
  page?: number
  pageSize?: number
}

export interface RecordPage {
  items: MedicalRecord[]
  total: number
}

export function fetchRecordPage(q: RecordPageQuery): Promise<RecordPage> {
  return request.get('/emr/records/page', {
    params: {
      keyword: q.keyword || undefined,
      signed: q.signed,
      type: q.type,
      recent: q.recent ? 'true' : undefined,
      page: q.page,
      pageSize: q.pageSize
    }
  })
}

export function fetchRecord(id: string): Promise<MedicalRecord> {
  return request.get(`/emr/records/${id}`)
}

export function saveRecord(data: SaveRecordInput): Promise<MedicalRecord> {
  return request.post('/emr/records', data)
}

export function updateRecord(id: string, data: SaveRecordInput): Promise<MedicalRecord> {
  return request.put(`/emr/records/${id}`, data)
}

export function signRecord(id: string): Promise<MedicalRecord> {
  return request.post(`/emr/records/${id}/sign`)
}
