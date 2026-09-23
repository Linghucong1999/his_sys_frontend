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
  collate?: boolean
  deviceName?: string
  pageSize?: 'A4' | 'A5' | 'B5' | 'Letter' | 'Legal'
  landscape?: boolean
  /** false=灰度打印 */
  color?: boolean
  pageRanges?: Array<{ from: number; to: number }>
  duplexMode?: 'simplex' | 'shortEdge' | 'longEdge'
  scaleFactor?: number
  pagesPerSheet?: number
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
      collate: options?.collate ?? true,
      deviceName: options?.deviceName,
      pageSize: options?.pageSize,
      landscape: options?.landscape ?? false,
      color: options?.color ?? true,
      pageRanges: options?.pageRanges,
      duplexMode: options?.duplexMode,
      scaleFactor: options?.scaleFactor,
      pagesPerSheet: options?.pagesPerSheet
    }),
  /** 记住密码：加密保存账号密码到用户数据目录 */
  saveCredentials: (username: string, password: string): Promise<{ ok: boolean; reason?: string | null }> =>
    ipcRenderer.invoke('credential:save', { username, password }),
  /** 读取已记住的账号密码（未保存或解密失败时返回 null） */
  loadCredentials: (): Promise<{ username: string; password: string } | null> =>
    ipcRenderer.invoke('credential:load'),
  /** 清除已记住的账号密码 */
  clearCredentials: (): Promise<{ ok: boolean }> => ipcRenderer.invoke('credential:clear'),
  /** 挂到后台：隐藏窗口，保留系统托盘 */
  hideToTray: (): void => ipcRenderer.send('window:hide-to-tray'),
  /** 完全退出应用（结束进程） */
  quitApp: (): void => ipcRenderer.send('window:quit-app'),
  /** 监听"用户点击窗口关闭按钮"事件，返回取消订阅函数 */
  onCloseRequested: (callback: () => void): (() => void) => {
    const listener = (): void => callback()
    ipcRenderer.on('window:close-requested', listener)
    return () => {
      ipcRenderer.removeListener('window:close-requested', listener)
    }
  }
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
