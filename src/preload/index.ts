import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 通过 contextBridge 暴露给渲染进程的 API。
// 打印（处方/病历）：渲染进程生成打印 HTML，主进程隐藏窗口渲染并调系统打印
const api = {
  platform: process.platform,
  printHtml: (
    html: string,
    options?: { silent?: boolean; copies?: number }
  ): Promise<{ ok: boolean; reason?: string | null }> =>
    ipcRenderer.invoke('print:html', {
      html,
      silent: options?.silent ?? false,
      copies: options?.copies ?? 1
    })
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
