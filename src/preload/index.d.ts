import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      platform: string
      /** 打印 HTML 文档（主进程隐藏窗口渲染 + 系统打印对话框） */
      printHtml: (html: string, options?: { silent?: boolean }) => Promise<{ ok: boolean; reason?: string | null }>
    }
  }
}

export {}
