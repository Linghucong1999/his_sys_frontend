/** 全局数据变更事件：签名等操作后通知顶栏消息/工作台待办同步刷新 */
export const DATA_CHANGED_EVENT = 'his:data-changed'

export function emitDataChanged(): void {
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT))
}

export function onDataChanged(fn: () => void): () => void {
  const handler = (): void => fn()
  window.addEventListener(DATA_CHANGED_EVENT, handler)
  return () => window.removeEventListener(DATA_CHANGED_EVENT, handler)
}
