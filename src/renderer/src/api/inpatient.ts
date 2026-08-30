import request from './request'
import type { Bed, InpatientOrder } from './types'

export function listBeds(ward?: string): Promise<Bed[]> {
  return request.get('/inpatient/beds', { params: { ward } })
}

export function listOrders(params?: { patientId?: string; bedNo?: string }): Promise<InpatientOrder[]> {
  return request.get('/inpatient/orders', { params })
}

export function createOrder(data: {
  patientId: string
  bedNo: string
  type: 'long' | 'temp'
  category: 'drug' | 'nursing' | 'exam'
  content: string
  frequency?: string
}): Promise<InpatientOrder> {
  return request.post('/inpatient/orders', data)
}

export function stopOrder(id: string): Promise<InpatientOrder> {
  return request.post(`/inpatient/orders/${id}/stop`)
}
