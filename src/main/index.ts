import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    title: 'HIS 医生工作站',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 开发模式加载 electron-vite dev server，生产模式加载打包后的本地文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/** 打印窗口：隐藏渲染打印 HTML，调系统打印对话框（A4 比例） */
let printWindow: BrowserWindow | null = null

function getPrintWindow(): BrowserWindow {
  if (!printWindow || printWindow.isDestroyed()) {
    printWindow = new BrowserWindow({
      width: 794,
      height: 1123,
      show: false,
      webPreferences: { sandbox: false, contextIsolation: true }
    })
    printWindow.on('closed', () => {
      printWindow = null
    })
  }
  return printWindow
}

function registerPrintHandler(): void {
  ipcMain.handle(
    'print:html',
    async (_event, payload: { html: string; silent?: boolean; copies?: number }) => {
      if (!payload || typeof payload.html !== 'string' || payload.html.length === 0) {
        throw new Error('打印内容无效')
      }
      const win = getPrintWindow()
      // 非静默打印（系统打印对话框）时需显示窗口，否则 Windows 下对话框不可见
      if (!payload.silent) win.show()
      await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(payload.html))
      return new Promise((resolve) => {
        win.webContents.print(
          {
            silent: payload.silent ?? false,
            printBackground: true,
            copies: Math.max(1, payload.copies ?? 1)
          },
          (success, failureReason) => {
            if (!success && failureReason) {
              console.warn('打印失败:', failureReason)
            }
            if (!payload.silent) {
              win.hide()
            }
            resolve({ ok: success, reason: failureReason ?? null })
          }
        )
      })
    }
  )
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.his.workstation')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerPrintHandler()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
