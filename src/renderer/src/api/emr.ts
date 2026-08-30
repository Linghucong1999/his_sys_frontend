import request from './request'
import type { MedicalRecord, DiagnosisItem } from './types'

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
  diagnosis?: DiagnosisItem[]
  prescriptionSummary?: string
}

export function listRecords(params?: {
  keyword?: string
  signed?: string
  type?: string
}): Promise<MedicalRecord[]> {
  return request.get('/emr/records', { params })
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
