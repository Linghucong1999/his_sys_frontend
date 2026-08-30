import request from './request'
import type { DictionaryItem, SearchResultItem, Visit } from './types'

export function listDictionaries(category: string, keyword?: string): Promise<DictionaryItem[]> {
  return request.get(`/dictionaries/${category}`, { params: { keyword } })
}

export function globalSearch(q: string, limit = 8): Promise<SearchResultItem[]> {
  return request.get('/search', { params: { q, limit } })
}

export function createVisit(data: {
  patientId: string
  empiId: string
  patientName: string
  type: 'first' | 'followup'
  chiefComplaint?: string
}): Promise<Visit> {
  return request.post('/outpatient/visits', data)
}

export function listVisitsByPatient(patientId: string): Promise<Visit[]> {
  return request.get(`/outpatient/visits/patient/${patientId}`)
}
