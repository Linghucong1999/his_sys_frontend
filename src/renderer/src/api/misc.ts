import request from './request'
import type { DictionaryItem, SearchResultItem, Visit, DrugManual, UnknownDrug, RegionTreeNode } from './types'

export function listDictionaries(category: string, keyword?: string): Promise<DictionaryItem[]> {
  return request.get(`/dictionaries/${category}`, { params: { keyword } })
}

/** 药品说明书库 */
export function fetchDrugManuals(keyword?: string, source?: string, category?: string): Promise<DrugManual[]> {
  return request.get('/drug-manuals', { params: { keyword, source, category } })
}

/** 药理分类列表 */
export function fetchDrugCategories(): Promise<string[]> {
  return request.get('/drug-manuals/categories')
}

/** 未知药品列表（医生开过但药库中没有的） */
export function fetchUnknownDrugs(): Promise<UnknownDrug[]> {
  return request.get('/drug-manuals/unknown')
}

/** 注册新药入库（自动词根分类） */
export function registerDrug(data: { drugName: string; spec?: string; category?: string; fullText?: string }): Promise<DrugManual> {
  return request.post('/drug-manuals/register', data)
}

/** 省市区三级树（建档住址级联选择用） */
export function fetchRegions(): Promise<RegionTreeNode[]> {
  return request.get('/regions')
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
