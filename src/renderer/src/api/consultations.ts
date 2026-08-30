import request from './request'
import type { Consultation } from './types'

export interface CreateConsultationInput {
  patientId: string
  patientName: string
  patientRef?: string
  toDept: string
  type: 'urgent' | 'normal'
  summary: string
}

export function listConsultations(params?: { status?: string }): Promise<Consultation[]> {
  return request.get('/consultations', { params })
}

export function createConsultation(data: CreateConsultationInput): Promise<Consultation> {
  return request.post('/consultations', data)
}

export function respondConsultation(id: string, opinion?: string): Promise<Consultation> {
  return request.post(`/consultations/${id}/respond`, { opinion })
}

export function urgeConsultation(id: string): Promise<Consultation> {
  return request.post(`/consultations/${id}/urge`)
}
