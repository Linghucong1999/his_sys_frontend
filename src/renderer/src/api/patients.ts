import request from './request'
import type { Patient } from './types'

export interface CreatePatientInput {
  name: string
  gender?: string
  age?: number
  phone?: string
  address?: string
}

export function createPatient(data: CreatePatientInput): Promise<Patient> {
  return request.post('/patients', data)
}

export function searchPatients(keyword: string): Promise<Patient[]> {
  return request.get('/patients/search', { params: { keyword } })
}

export function fetchPatient(id: string): Promise<Patient> {
  return request.get(`/patients/${id}`)
}
