import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      platform: string
      /** 打印 HTML 文档（主进程隐藏窗口渲染 + 系统打印对话框；silent=true 静默打默认打印机） */
      printHtml: (
        html: string,
        options?: { silent?: boolean; copies?: number }
      ) => Promise<{ ok: boolean; reason?: string | null }>
    }
  }
}

export {}
