import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

function createWindow(): BrowserWindow {
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
  return mainWindow
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
  ipcMain.handle('print:html', async (_event, payload: { html: string; silent?: boolean }) => {
    if (!payload || typeof payload.html !== 'string' || payload.html.length === 0) {
      throw new Error('打印内容无效')
    }
    const win = getPrintWindow()
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(payload.html))
    return new Promise((resolve) => {
      win.webContents.print(
        { silent: payload.silent ?? false, printBackground: true },
        (success, failureReason) => {
          if (!success && failureReason) {
            console.warn('打印失败:', failureReason)
          }
          resolve({ ok: success, reason: failureReason ?? null })
        }
      )
    })
  })
}

/**
 * 截图工具（开发模式）：设置 HIS_CAPTURE_DIR 环境变量时，
 * 依次加载各视图并保存 PNG，完成后自动退出。
 */
async function captureViewsIfRequested(mainWindow: BrowserWindow): Promise<boolean> {
  const dir = process.env['HIS_CAPTURE_DIR']
  if (!dir || !is.dev || !process.env['ELECTRON_RENDERER_URL']) return false
  const fs = await import('fs')
  const shots: Array<[string, string]> = [
    ['login', '#/login'],
    ['workbench', '#/workbench'],
    ['inpatient', '#/inpatient'],
    ['emr', '#/emr'],
    ['consultations', '#/consultations']
  ]
  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
  try {
    for (const [name, hash] of shots) {
      await mainWindow.loadURL(`${rendererUrl}/${hash}`)
      await sleep(2600)
      const image = await mainWindow.webContents.capturePage()
      fs.writeFileSync(join(dir, `${name}.png`), image.toPNG())
      console.log(`[capture] saved ${name}.png`)
    }
    // 患者360：进入工作台后模拟点击“调档接诊”
    await mainWindow.loadURL(`${rendererUrl}/#/workbench`)
    await sleep(2600)
    await mainWindow.webContents.executeJavaScript(
      `document.querySelector('.qs-result .btn-primary')?.click()`
    )
    await sleep(3000)
    const p360 = await mainWindow.webContents.capturePage()
    fs.writeFileSync(join(dir, 'p360.png'), p360.toPNG())
    console.log('[capture] saved p360.png')
  } catch (e) {
    console.error('[capture] failed:', e)
  }
  await sleep(300)
  app.quit()
  return true
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.his.workstation')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerPrintHandler()
  const mainWindow = createWindow()

  mainWindow.webContents.once('did-finish-load', () => {
    // 等待初始页面稳定后再开始截图，避免连续 loadURL 竞争
    setTimeout(() => {
      void captureViewsIfRequested(mainWindow)
    }, 800)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
