# HIS 医生工作站 - 前端（Windows 桌面端）

医生工作站 + 电子病历 EMR 桌面客户端：Electron 外壳 + Vue3 渲染界面，通过 HTTP REST API 与后端（his_sys_backend）通信。

## 技术栈

| 组件 | 选型 |
|---|---|
| 桌面外壳 | Electron + electron-vite |
| 框架 | Vue 3（TypeScript，组合式 API） |
| UI 组件库 | Element Plus（中文 locale） |
| 状态管理 | Pinia |
| 路由 | Vue Router 4（hash 模式，适配桌面端本地文件加载） |
| HTTP | axios（统一拦截器：token 注入 + 响应解包） |
| 包管理 | yarn |
| 打包 | electron-builder（Windows 安装包） |

## 目录结构

```
├── electron.vite.config.ts     # electron-vite 构建配置（main/preload/renderer 三段）
├── src/
│   ├── main/index.ts           # Electron 主进程：窗口管理、外链拦截、打印/外设扩展点
│   ├── preload/
│   │   ├── index.ts            # contextBridge 安全桥（window.electron / window.api）
│   │   └── index.d.ts          # 渲染进程侧类型声明
│   └── renderer/               # Vue3 渲染进程
│       ├── index.html
│       └── src/
│           ├── main.ts         # 应用入口：Element Plus + Pinia + Router + 图标全局注册
│           ├── App.vue
│           ├── api/request.ts  # axios 封装（baseURL、token 注入、{code,data,message} 解包）
│           ├── router/         # 路由（hash 模式、登录守卫占位）
│           ├── assets/         # 全局样式
│           └── views/          # 页面（LoginView 登录页、HomeView 工作台占位）
```

## 快速开始

### 前置条件

- Node.js 18+
- yarn（1.x）
- 后端服务已启动（默认 `http://127.0.0.1:3000/api`）

### 安装

```bash
yarn install
```

> 若 Electron 二进制下载缓慢，可先执行：
> `export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"` 后再安装。

### 开发

```bash
yarn dev    # 启动 Electron 窗口（渲染进程热重载）
```

### 构建与打包

```bash
yarn build        # 构建 main/preload/renderer 三产物到 out/
yarn typecheck    # 主进程 + 渲染进程 TypeScript 类型检查
yarn build:win    # 构建并打 Windows 安装包（NSIS）
```

## 后端连接配置

后端地址通过环境变量 `VITE_API_BASE_URL` 配置，默认 `http://127.0.0.1:3000/api`：

```bash
VITE_API_BASE_URL=http://192.168.1.100:3000/api yarn dev
```

修改 `src/renderer/src/api/request.ts` 中的 `BASE_URL` 亦可。

## 页面说明

- `LoginView`：登录页占位（TODO：接入 `POST /api/auth/login`，保存 token 与用户角色）
- `HomeView`：工作台占位（等待 UI 设计稿后填充业务模块页面）

## 桌面能力扩展点

- 打印（处方/病历）：主进程 `webContents.print()`，经 preload 暴露 IPC 后由渲染进程调用
- 读卡器/小票机等外设：主进程 Node 环境直接调 DLL/串口

## 提交规范

采用 Conventional Commits：`feat:` 新功能 / `fix:` 修复 / `docs:` 文档 / `chore:` 工程配置 / `test:` 测试 / `refactor:` 重构。
