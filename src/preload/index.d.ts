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
      /** 记住密码：加密保存账号密码到用户数据目录 */
      saveCredentials: (username: string, password: string) => Promise<{ ok: boolean; reason?: string | null }>
      /** 读取已记住的账号密码（未保存或解密失败时返回 null） */
      loadCredentials: () => Promise<{ username: string; password: string } | null>
      /** 清除已记住的账号密码 */
      clearCredentials: () => Promise<{ ok: boolean }>
      /** 挂到后台：隐藏窗口，保留系统托盘 */
      hideToTray: () => void
      /** 完全退出应用（结束进程） */
      quitApp: () => void
      /** 监听"用户点击窗口关闭按钮"事件，返回取消订阅函数 */
      onCloseRequested: (callback: () => void) => () => void
    }
  }
}

export {}
