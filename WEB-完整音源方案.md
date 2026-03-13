# Web 版完整音源接入说明（对齐 AlgerMusicPlayer 核心思路）

## 1. 核心架构

- 主链路：网易云播放接口
- 备用链路：UnblockNeteaseMusic 多音源聚合
- 降级机制：多策略重试 + 失败短缓存 + 手动重解析 + waiting/stalled 自动自愈

当前网页项目已实现：

- 多候选播放地址解析（主源 + 备源）
- 失败自动切换候选 URL
- 手动重解析
- 播放卡顿自动恢复
- URL 缓存与失败缓存

## 2. 本地运行（推荐）

1) 复制环境变量

- 复制 `.env.example` 为 `.env`

2) 启动

- `npm run dev:stable`

3) 访问

- `http://localhost:3000`（若端口被占用会自动顺延）

## 3. 关键环境变量

- `VITE_UNBLOCK_PORT`：UNM 服务端口
- `VITE_UNBLOCK_SOURCES`：UNM 音源顺序，支持逗号或空格分隔  
  可用值：`qq kugou kuwo bodian migu joox youtube youtubedl ytdlp bilibili bilivideo pyncmd`
- `ENABLE_FLAC`：是否启用无损解析（建议 `true`）
- `ENABLE_LOCAL_VIP`：本地 VIP 模式（建议 `cvip`）
- `QQ_COOKIE` / `MIGU_COOKIE` / `JOOX_COOKIE`：启用对应音源时建议配置

## 4. 稳定性建议

- 默认先用 `kuwo kugou pyncmd bilibili`（按完整率优先排序），可在 `.env` 调整顺序
- 遇到“只能 30 秒”先点“重解析”
- 出现卡顿会自动触发重新取源
- 同一歌曲建议先播放 5~10 秒确认音源可用，再加入收藏

## 5. 与 AlgerMusicPlayer 对齐点

- 使用 UnblockNeteaseMusic 作为核心后备解析
- 使用策略化降级而不是单接口直连
- 通过缓存 + 失败冷却降低无效重试
- 提供用户可感知的重解析入口

## 6. GitHub Pages 部署必读

- GitHub Pages 是纯静态托管，不能直接运行 UNM 服务进程
- 若要接近本地效果，需额外准备两个远程服务：
  - 远程 UNM 服务（给前端提供 `/unm-api/...`）
  - HTTPS 流代理（把 `http://` 音频流转成 `https://` 可播放地址）

推荐配置：

- `VITE_REMOTE_UNM_BASE=https://your-unm.example.com/unm-api`
- `VITE_STREAM_PROXY_BASE=https://your-stream-proxy.workers.dev`

远程 UNM 容器示例：

- [Dockerfile.unm](file:///d:/blog/ops/Dockerfile.unm)
- [render.yaml](file:///d:/blog/render.yaml)

流代理 Worker 示例代码：

- [stream-proxy-worker.js](file:///d:/blog/ops/stream-proxy-worker.js)
- [wrangler.toml](file:///d:/blog/wrangler.toml)

自动发布 Worker（可选）：

- [deploy-stream-proxy.yml](file:///d:/blog/.github/workflows/deploy-stream-proxy.yml)

最少人工操作：

1. Render 新建 Blueprint，选择本仓库，自动读取 `render.yaml`
2. Cloudflare Worker 使用本仓库 `wrangler.toml` + `ops/stream-proxy-worker.js` 发布
3. 在 GitHub 仓库 Variables 填：
   - `VITE_REMOTE_UNM_BASE`
   - `VITE_STREAM_PROXY_BASE`
4. 在 GitHub 仓库 Secrets 填（若启用 Worker 自动发布）：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

可选自动化（本机 PowerShell 一次写入 Variables 并触发 Pages 部署）：

- [setup-github-pages-vars.ps1](file:///d:/blog/ops/setup-github-pages-vars.ps1)
- 运行示例：
  - `powershell -ExecutionPolicy Bypass -File ops/setup-github-pages-vars.ps1 -GithubToken "你的PAT" -RemoteUnmBase "https://your-unm.example.com/unm-api" -StreamProxyBase "https://your-stream-proxy.workers.dev"`
