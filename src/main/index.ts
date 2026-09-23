import { app, shell, BrowserWindow, ipcMain, safeStorage, Tray, Menu, nativeImage } from 'electron'
import type { Size, NativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

/** B5 自定义纸张（176×250mm，微米单位，医疗病历常用尺寸） */
const B5_SIZE: Size = { width: 176000, height: 250000 }

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
/** 用户明确选择"全部关闭"或进入退出流程后放行 close 事件，避免重复弹窗 */
let isQuitting = false

/** 生成 16×16 托盘图标（蓝色底 + 白色医疗十字，避免依赖外部图片资源） */
function createTrayIcon(): NativeImage {
  const size = 16
  const buf = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const onCross =
        (Math.abs(x - 7.5) <= 1.4 && Math.abs(y - 7.5) <= 3.6) ||
        (Math.abs(y - 7.5) <= 1.4 && Math.abs(x - 7.5) <= 3.6)
      // BGRA 像素顺序（Windows 位图）
      if (onCross) {
        buf[i] = 255
        buf[i + 1] = 255
        buf[i + 2] = 255
        buf[i + 3] = 255
      } else {
        buf[i] = 0xd9
        buf[i + 1] = 0x52
        buf[i + 2] = 0x00
        buf[i + 3] = 255
      }
    }
  }
  return nativeImage.createFromBitmap(buf, { width: size, height: size })
}

/** 恢复并聚焦主窗口（托盘单击 / 应用挂后台期间再次双击启动图标） */
function showMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow()
    return
  }
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

/** 挂到后台：隐藏窗口并保留系统托盘图标 */
function hideToTray(): void {
  if (!mainWindow) return
  mainWindow.hide()
  ensureTray()
}

/** 完全退出：销毁托盘并结束整个进程 */
function quitApp(): void {
  isQuitting = true
  if (tray) {
    tray.destroy()
    tray = null
  }
  app.quit()
}

function ensureTray(): void {
  if (tray) return
  tray = new Tray(createTrayIcon())
  tray.setToolTip('HIS 医生工作站（后台运行，点击恢复窗口）')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '打开主界面', click: () => showMainWindow() },
      { type: 'separator' },
      { label: '完全退出', click: () => quitApp() }
    ])
  )
  tray.on('click', () => showMainWindow())
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
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
    mainWindow?.show()
  })

  // 点击关闭按钮时拦截：通知渲染进程弹出自定义关闭确认框（HIS 风格 UI）
  mainWindow.on('close', (e) => {
    if (isQuitting) return
    const win = mainWindow
    if (!win) return
    e.preventDefault()
    win.webContents.send('window:close-requested')
  })

  mainWindow.on('closed', () => {
    mainWindow = null
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

/** 打印请求（渲染进程 → 主进程）：与 Electron WebContentsPrintOptions 对齐 */
interface PrintHtmlPayload {
  html: string
  /** true=静默打印到指定/默认打印机；false=调起系统打印对话框 */
  silent?: boolean
  copies?: number
  /** 多份时逐份输出 */
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

function registerPrintHandler(): void {
  // 系统打印机列表（渲染进程预览对话框下拉选择用）
  ipcMain.handle('print:list-printers', async () => {
    return (await getPrintWindow().webContents.getPrintersAsync()).map((p) => ({
      name: p.name,
      displayName: p.displayName,
      status: (p as unknown as { status?: number }).status ?? 0,
      isDefault: (p as unknown as { isDefault?: boolean }).isDefault ?? false
    }))
  })

  ipcMain.handle(
    'print:html',
    async (_event, payload: PrintHtmlPayload) => {
      if (!payload || typeof payload.html !== 'string' || payload.html.length === 0) {
        throw new Error('打印内容无效')
      }
      const win = getPrintWindow()
      // 非静默打印（系统打印对话框）时需显示窗口，否则 Windows 下对话框不可见
      if (!payload.silent) win.show()
      // 打印稿写入临时文件后加载（data: URL 会被 CSP 拦截，临时文件不受影响）
      // 打印稿内已按所选纸张/方向生成 @page 与整体缩放，此处只需传入一致的物理纸张
      const fs = await import('fs')
      const os = await import('os')
      const tmpFile = join(os.tmpdir(), `his-print-${Date.now()}-${Math.random().toString(36).slice(2)}.html`)
      fs.writeFileSync(tmpFile, payload.html, 'utf-8')
      try {
        await win.loadFile(tmpFile)
        return new Promise((resolve) => {
          win.webContents.print(
            {
              silent: payload.silent ?? false,
              printBackground: true,
              copies: Math.max(1, payload.copies ?? 1),
              collate: payload.collate ?? true,
              deviceName: payload.deviceName || undefined,
              landscape: payload.landscape ?? false,
              color: payload.color ?? true,
              pageRanges: payload.pageRanges?.length ? payload.pageRanges : undefined,
              duplexMode: payload.duplexMode,
              scaleFactor: payload.scaleFactor,
              pagesPerSheet: payload.pagesPerSheet,
              pageSize:
                payload.pageSize === 'B5'
                  ? B5_SIZE
                  : ((payload.pageSize as 'A4' | 'A5' | 'Letter' | 'Legal') || 'A4')
            },
            (success, failureReason) => {
              if (!success && failureReason) {
                console.warn('打印失败:', failureReason)
              }
              if (!payload.silent) {
                win.hide()
              }
              fs.unlink(tmpFile, () => {
                // 清理临时打印稿
              })
              resolve({ ok: success, reason: failureReason ?? null })
            }
          )
        })
      } catch (e) {
        fs.unlink(tmpFile, () => {
          // 清理临时打印稿
        })
        throw e
      }
    }
  )
}

/** 记住密码：用系统级 safeStorage（Windows DPAPI）加密后存到 userData 目录 */
function registerCredentialHandler(): void {
  const credentialFile = (): string => join(app.getPath('userData'), 'credentials.json')

  ipcMain.handle(
    'credential:save',
    async (_event, payload: { username?: string; password?: string }) => {
      if (!payload || typeof payload.username !== 'string' || typeof payload.password !== 'string') {
        throw new Error('凭证无效')
      }
      if (!safeStorage.isEncryptionAvailable()) {
        return { ok: false, reason: '当前系统不支持安全加密，无法记住密码' }
      }
      const fs = await import('fs')
      const data = JSON.stringify({ username: payload.username, password: payload.password })
      const encrypted = safeStorage.encryptString(data).toString('base64')
      fs.mkdirSync(app.getPath('userData'), { recursive: true })
      fs.writeFileSync(credentialFile(), JSON.stringify({ v: 1, encrypted }), 'utf-8')
      return { ok: true, reason: null }
    }
  )

  ipcMain.handle('credential:load', async () => {
    if (!safeStorage.isEncryptionAvailable()) return null
    const fs = await import('fs')
    try {
      if (!fs.existsSync(credentialFile())) return null
      const raw = JSON.parse(fs.readFileSync(credentialFile(), 'utf-8'))
      if (!raw || typeof raw.encrypted !== 'string') return null
      const parsed = JSON.parse(safeStorage.decryptString(Buffer.from(raw.encrypted, 'base64')))
      if (typeof parsed?.username === 'string' && typeof parsed?.password === 'string') {
        return { username: parsed.username, password: parsed.password }
      }
      return null
    } catch {
      return null
    }
  })

  ipcMain.handle('credential:clear', async () => {
    const fs = await import('fs')
    try {
      if (fs.existsSync(credentialFile())) fs.unlinkSync(credentialFile())
    } catch {
      // 文件不存在或不可写时忽略
    }
    return { ok: true }
  })
}

// 单实例锁：应用挂后台期间再次双击图标启动时，唤醒已有实例而不是新开一个
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showMainWindow()
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.his.workstation')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    registerPrintHandler()
    registerCredentialHandler()

    // 关闭确认框回传：渲染进程自定义弹窗选择后的动作
    ipcMain.on('window:hide-to-tray', () => {
      hideToTray()
    })
    ipcMain.on('window:quit-app', () => {
      quitApp()
    })
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
