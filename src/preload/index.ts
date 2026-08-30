import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface PrinterInfo {
  name: string
  displayName: string
  status: number
  isDefault: boolean
}

export interface PrintOptions {
  silent?: boolean
  copies?: number
  deviceName?: string
  pageSize?: string
}

// 通过 contextBridge 暴露给渲染进程的 API。
// 打印（处方/病历）：渲染进程生成打印 HTML，主进程隐藏窗口渲染并调系统打印
const api = {
  platform: process.platform,
  /** 系统打印机列表（打印预览对话框选择用） */
  listPrinters: (): Promise<PrinterInfo[]> => ipcRenderer.invoke('print:list-printers'),
  /** 打印 HTML 文档（silent=true 静默打印到指定/默认打印机） */
  printHtml: (html: string, options?: PrintOptions): Promise<{ ok: boolean; reason?: string | null }> =>
    ipcRenderer.invoke('print:html', {
      html,
      silent: options?.silent ?? false,
      copies: options?.copies ?? 1,
      deviceName: options?.deviceName,
      pageSize: options?.pageSize
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
