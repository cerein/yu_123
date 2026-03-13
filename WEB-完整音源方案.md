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
