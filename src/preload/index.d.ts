import { ElectronAPI } from '@electron-toolkit/preload'

interface PrinterInfo {
  name: string
  displayName: string
  status: number
  isDefault: boolean
}

interface PrintOptions {
  silent?: boolean
  copies?: number
  deviceName?: string
  pageSize?: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      platform: string
      /** 系统打印机列表 */
      listPrinters: () => Promise<PrinterInfo[]>
      /** 打印 HTML 文档（silent=true 静默打印到指定/默认打印机） */
      printHtml: (html: string, options?: PrintOptions) => Promise<{ ok: boolean; reason?: string | null }>
    }
  }
}

export {}
