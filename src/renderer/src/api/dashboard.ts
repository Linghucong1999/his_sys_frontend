import request from './request'
import type { DashboardSummary, TodoItem } from './types'

export function fetchSummary(): Promise<DashboardSummary> {
  return request.get('/dashboard/summary')
}

export function fetchTodos(): Promise<TodoItem[]> {
  return request.get('/dashboard/todos')
}
