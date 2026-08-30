import { defineStore } from 'pinia'
import { fetchSummary, fetchTodos } from '@/api/dashboard'
import type { DashboardSummary, TodoItem } from '@/api/types'

interface TodoState {
  summary: DashboardSummary | null
  todos: TodoItem[]
}

export const useTodoStore = defineStore('todo', {
  state: (): TodoState => ({
    summary: null,
    todos: []
  }),
  actions: {
    async load(): Promise<void> {
      const [summary, todos] = await Promise.all([fetchSummary(), fetchTodos()])
      this.summary = summary
      this.todos = todos
    }
  }
})
