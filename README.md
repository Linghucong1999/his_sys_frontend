# HIS 医生工作站 - 前端（Windows 桌面端）

医生工作站 + 电子病历 EMR 桌面客户端：Electron 外壳 + Vue3 渲染界面，通过 HTTP REST API 与后端（his_sys_backend）通信。

## 技术栈

| 组件 | 选型 |
|---|---|
| 桌面外壳 | Electron + electron-vite |
| 框架 | Vue 3（TypeScript，组合式 API） |
| UI 体系 | **UI 稿直译的自研视觉组件**（双主题 CSS 变量 + 玻璃拟态，无第三方组件库依赖） |
| 工具库 | VueUse（useDark 深色模式，@vueuse/core） |
| 状态管理 | Pinia |
| 路由 | Vue Router 4（hash 模式，适配桌面端本地文件加载） |
| HTTP | axios（统一拦截器：token 注入 + {code,data,message} 解包） |
| 包管理 | yarn（全部依赖仅安装在本项目内，不使用全局环境） |
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
│           ├── main.ts         # 应用入口：Pinia + Router
│           ├── App.vue
│           ├── styles/
│           │   ├── tokens.css  # 双主题 CSS 变量（与 UI 稿一致）+ 通用卡片/按钮/输入控件
│           │   └── motion.css  # 动效（fadeUp/pulse）
│           ├── api/            # axios 封装 + 各域接口（auth/dashboard/emr/consultations/inpatient/…）
│           ├── stores/         # user（登录态）/ patient（建档调档）/ todo（统计待办）
│           ├── router/         # 嵌套路由（GlassShell 下 5 个视图）+ 登录守卫
│           ├── layouts/GlassShell.vue        # 玻璃拟态外壳（导航+顶栏+视图区）
│           ├── components/     # IconNav/TopBar/CommandPalette/StatCard/Sparkline/
│           │                   # PatientJourney/EmrBlock/AiCopilotPanel/QuickStartCard
│           └── views/          # LoginView/WorkbenchView/P360View/InpatientView/EmrView/ConsultationView
```

## 功能视图（第一版）

| 视图 | 功能 | 后端接口 |
|---|---|---|
| 登录 | 工号+密码登录，RBAC 角色展示 | `POST /api/auth/login` |
| 智能工作台 | 问候+统计卡+快速开始（新建首诊/复诊调档）+待办聚合+快捷入口 | `GET /api/dashboard/*`、`POST /api/patients`、`POST /api/outpatient/visits` |
| 患者 360° | 患者卡+就诊旅程、区块化病历编辑（ICD-10 智能匹配）、CA 签名、AI 辅助面板 | `GET/POST /api/emr/records`、`GET /api/dictionaries/icd10` |
| 住院工作站 | 病区筛选、床位卡片网格、长期/临时医嘱、停嘱 | `GET /api/inpatient/*` |
| 电子病历 | 病历/处方列表（筛选）、预览、CA 签名 | `GET /api/emr/records` |
| 会诊管理 | 会诊列表（待响应/进行中）、发起会诊、响应、催办 | `GET/POST /api/consultations` |
| Cmd+K | 患者调档/病历/药品/命令聚合搜索 | `GET /api/search?q=` |
| 深色模式 | 底部导航一键切换，localStorage 持久化 | — |

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
