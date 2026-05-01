# 短剧速看 · NovelQuick

抖音/红果短剧风格的短剧 Web 平台 + Tauri 移动壳。

## 仓库结构

```
novelquick/
├── apps/
│   ├── web              # 前台（消费者侧，3000）
│   ├── admin            # 后台（运营侧，3001）
│   └── mobile           # Tauri 2 薄壳（android/ios/desktop）
├── packages/
│   ├── db               # Prisma schema + client（@nq/db）
│   ├── shared           # zod schema / 常量 / 工具（@nq/shared）
│   ├── ui               # shadcn 风格组件库（@nq/ui）
│   └── api              # tRPC routers + better-auth + queue（@nq/api）
└── services/
    └── transcoder       # FFmpeg → HLS worker（消费 BullMQ 队列）
```

## 技术栈

| 层 | 技术 |
|---|---|
| 运行时 | Node 22+ · pnpm 10 · Turbo 2 |
| Web | Next.js 16 · React 19 · App Router · Tailwind 4 · Radix UI |
| 状态 | Zustand · TanStack Query 5 |
| 接口 | tRPC 11 · Zod |
| 认证 | better-auth（email/password） |
| 数据库 | Postgres 17 + Prisma 7 |
| 队列 | BullMQ · Redis 7 |
| 视频 | hls.js 客户端播放 · FFmpeg 服务端转码（多码率 HLS） |
| 移动端 | Tauri 2（指向 web URL 的 webview 壳） |

## 第一次启动

```bash
# 1. 安装依赖
pnpm install

# 2. 起 Postgres + Redis（docker）
cp .env.example .env
pnpm docker:up

# 3. 推 schema + 灌种子数据
pnpm db:push
pnpm db:seed

# 4. 起前台 + 后台 + 转码
pnpm dev
# 或者分别起：
pnpm web:dev          # http://localhost:3000
pnpm admin:dev        # http://localhost:3001
pnpm transcoder:dev   # 后台转码 worker（要 ffmpeg）

# 5. 第一个管理员
# 先在前台 /sign-up 注册，再用下面的 SQL 把自己升成 SUPERADMIN：
# UPDATE "user" SET role='SUPERADMIN' WHERE email='you@example.com';
```

## 视频开发流程

开发期视频存本地：`./storage/videos`（由 `VIDEO_LOCAL_DIR` 控制）。

1. 在后台 → 剧集管理 → 新增剧集
2. 进入剧集详情 → 集数管理 → 「添加第 N 集」
3. 点「上传源文件」选一个视频 → 自动入队转码
4. 转码 worker 调用 `ffmpeg` 生成多码率 HLS 到 `storage/videos/hls/{episodeId}/`
5. 前台 `/api/media/hls/{episodeId}/master.m3u8` 流式输出（支持 Range）

## 移动端

```bash
# 桌面预览（最快验证）
pnpm mobile:desktop:dev

# 真机调试（需要 Android SDK / Xcode）
pnpm mobile:android:dev
NOVELQUICK_WEB_URL=https://your.domain pnpm mobile:android:build
```

Tauri 壳里没有任何前端代码，只是一个指向 `NOVELQUICK_WEB_URL` 的 WebView。

## 功能概览

### 前台

- **沉浸式推荐流**：竖屏全屏 · 上下滑切剧 · 自动连播
- **观看页**：弹幕 · 选集抽屉 · 评论抽屉 · 进度条 · 自动续播 · 解锁
- **发现 / 分类 / 榜单 / 搜索**
- **追剧 / 收藏 / 历史**
- **个人中心 / VIP / 金币 / 订单**

### 后台

- **总览看板**：用户/剧集/订单/收入
- **剧集管理**：CRUD · 分类标签 · VIP / 免费集数 / 解锁金币
- **集数管理**：上传源文件 → FFmpeg 转码 → HLS
- **转码任务**：状态 / 进度 / 失败原因
- **推荐位**：首页 Banner / 热播 / 新剧 / 小编精选
- **榜单**：算法重建（热播/新剧/追剧/VIP）
- **评论审核**：通过/隐藏/删除
- **用户**：角色 · 封禁 · VIP · 金币
- **VIP / 金币包 / 订单**

## 路线图（v0.1 之后）

- [ ] 真支付接入（微信/支付宝/Stripe）
- [ ] 视频去水印 / 防盗链 token
- [ ] 推荐算法（向量/协同过滤）
- [ ] CDN + S3/R2 切换
- [ ] PWA 离线缓存
- [ ] 短链分享 + 海报生成
- [ ] 观看时长 / 完播率统计与上报
