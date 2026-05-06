# SoundSpot

基于音频指纹技术的音乐识别与个性化推荐平台，支持麦克风录音识曲、音频播放、歌曲推荐、歌单管理等功能。

## 功能概览

### 已实现功能

| 模块 | 功能 | 说明 |
|------|------|------|
| 用户系统 | 注册/登录 | 邮箱注册，JWT Token 认证 |
| 音乐识别 | 麦克风录音识曲 | 外界播放音乐 → 浏览器麦克风录制 → 音频指纹匹配识别 |
| 音乐播放 | 在线播放 | 底部播放器，支持播放/暂停/上下曲/进度/音量 |
| 歌曲推荐 | 每日推荐/相似推荐 | 基于内容特征的推荐策略 |
| 搜索 | 歌曲搜索 | 关键词实时搜索 |
| 音乐库 | 收藏/歌单/历史 | 歌单 CRUD、识别历史、收藏管理 |
| 歌曲详情 | 详情页 + 相似推荐 | 点击任意歌曲跳转详情，展示相似推荐 |
| 导航跳转 | 全站跳转 | 所有歌曲卡片/列表/识别结果/播放器均可跳转详情页 |

### 识别算法

采用 **子序列交叉相关匹配** 算法：

1. **指纹构建**：启动时对曲库所有 MP3 提取 CQT chroma（12维旋律特征）+ MFCC（20维音色特征）
2. **录音处理**：浏览器 MediaRecorder 录制 → webm 上传 → 后端转 WAV → 提取同样特征
3. **匹配算法**：在参考曲目上滑动录音窗口，逐帧 L2 归一化后计算余弦相似度，取所有偏移中的最高分
4. **阈值策略**：绝对阈值 0.55 + 动态 gap 阈值，适配麦克风录音的信号衰减

```
录音特征 (12 chroma + 20 mfcc)
        │
        ▼
  ┌─────────────────────────────────┐
  │  对每首参考曲目：                │
  │  滑动窗口搜索最佳时间偏移        │
  │  score = 0.75×chroma_sim        │
  │       + 0.25×mfcc_sim           │
  └─────────────────────────────────┘
        │
        ▼
  最高分 >= 0.55 且 gap 达标 → 识别成功
  否则 → "无法识别该音乐"
```

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | 6 | 类型安全 |
| Vite | 8 | 构建工具 |
| Tailwind CSS | 4 | 样式方案 |
| Zustand | 5 | 全局状态管理 |
| TanStack Query | 5 | 数据请求与缓存 |
| React Router | 7 | 路由 |
| Axios | 1 | HTTP 客户端 |
| Lucide React | 1 | 图标库 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 开发语言 |
| FastAPI | 0.115 | Web 框架 |
| SQLAlchemy | 2.0 | ORM |
| Pydantic | 2.9 | 数据校验 |
| python-jose | 3.3 | JWT 认证 |
| bcrypt | - | 密码加密 |
| librosa | - | 音频分析（CQT chroma + MFCC） |
| soundfile | - | 音频格式转换 |
| SQLite | - | 数据库 |

## 项目结构

```
SoundSpot/
├── soundspot-server/              # 后端 (FastAPI)
│   ├── app/
│   │   ├── main.py                # 入口，lifespan 启动指纹库
│   │   ├── config.py              # 配置
│   │   ├── database.py            # 数据库连接
│   │   ├── dependencies.py        # 依赖注入（JWT 认证）
│   │   ├── models.py              # SQLAlchemy 模型
│   │   ├── schemas.py             # Pydantic 数据模型
│   │   ├── auth.py                # 密码加密/验证
│   │   ├── seed.py                # 种子数据（9首周杰伦歌曲）
│   │   ├── fingerprint.py         # 音频指纹模块（核心算法）
│   │   └── routers/
│   │       ├── auth.py            #   注册/登录
│   │       ├── songs.py           #   歌曲 CRUD + 搜索
│   │       ├── recognize.py       #   录音识别
│   │       ├── recommend.py       #   推荐
│   │       ├── playlists.py       #   歌单管理
│   │       └── collections.py     #   收藏管理
│   ├── static/audio/              # MP3 音频文件（9首）
│   ├── requirements.txt
│   └── soundspot.db               # SQLite 数据库
│
├── soundspot-web/                 # 前端 (React + Vite)
│   ├── src/
│   │   ├── App.tsx                # 路由配置
│   │   ├── main.tsx               # 入口
│   │   ├── index.css              # 全局样式 + Tailwind
│   │   ├── api/                   # API 请求层
│   │   │   ├── client.ts          #   Axios 实例 + 拦截器
│   │   │   ├── auth.ts            #   认证 API
│   │   │   ├── songs.ts           #   歌曲 API
│   │   │   ├── recognize.ts       #   识别 API
│   │   │   ├── recommend.ts       #   推荐 API
│   │   │   ├── playlists.ts       #   歌单 API
│   │   │   └── types.ts           #   类型定义
│   │   ├── components/
│   │   │   ├── Layout.tsx         #   侧边栏布局
│   │   │   └── PlayerBar.tsx      #   底部播放器
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx      #   登录页
│   │   │   ├── HomePage.tsx       #   首页（识别入口 + 推荐 + 历史）
│   │   │   ├── RecognizePage.tsx  #   录音识曲页
│   │   │   ├── DiscoverPage.tsx   #   发现页
│   │   │   ├── LibraryPage.tsx    #   音乐库（收藏/歌单/历史）
│   │   │   ├── SearchPage.tsx     #   搜索页
│   │   │   └── SongDetailPage.tsx #   歌曲详情页
│   │   └── stores/
│   │       ├── authStore.ts       #   认证状态
│   │       └── playerStore.ts     #   播放器状态
│   └── package.json
│
├── music/                         # 原始 MP3 来源
└── README.md
```

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.11+
- 系统需安装 audio 后端（Windows 默认支持，Linux 需安装 `libsndfile1`）

### 1. 安装后端依赖

```bash
cd soundspot-server
pip install -r requirements.txt
pip install librosa soundfile numpy
```

> 注意：`librosa` 和 `soundfile` 未写入 requirements.txt，需手动安装。

### 2. 启动后端

```bash
cd soundspot-server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

首次启动时会在 `static/audio/` 下扫描 MP3 文件构建指纹库，9 首歌约需 **15-20 秒**，终端会输出：

```
  [FP] 晴天.mp3 OK (2583 frames)
  [FP] 反方向的钟.mp3 OK (2476 frames)
  ...
[OK] Fingerprint DB: 9 tracks
```

等待指纹库加载完毕后再使用识别功能。

### 3. 安装前端依赖

```bash
cd soundspot-web
npm install
```

### 4. 启动前端

```bash
cd soundspot-web
npm run dev
```

前端运行在 `http://localhost:5173`。

### 5. 测试账号

| 邮箱 | 密码 |
|------|------|
| test@soundspot.com | 123456 |

## 曲库

当前曲库包含 9 首周杰伦歌曲，MP3 文件存放在 `soundspot-server/static/audio/`：

| 歌曲 | 所属专辑 | 时长 |
|------|----------|------|
| 晴天 | 叶惠美 | 4:29 |
| 反方向的钟 | Jay | 4:18 |
| 搁浅 | 七里香 | 4:01 |
| 一路向北 | 十一月的萧邦 | 4:36 |
| 青花瓷 | 我很忙 | 3:53 |
| 爱在西元前 | 范特西 | 3:42 |
| 稻香 | 魔杰座 | 3:43 |
| 花海 | 魔杰座 | 4:24 |
| 蒲公英的约定 | 我很忙 | 4:07 |

> 识别功能仅支持识别以上 9 首歌曲。其他音乐将返回"无法识别该音乐"。

## API 接口

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 |
| POST | `/api/v1/auth/login` | 用户登录 |
| GET | `/api/v1/users/me` | 获取当前用户信息 |

### 歌曲

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/songs` | 歌曲列表 |
| GET | `/api/v1/songs/{id}` | 歌曲详情 |
| GET | `/api/v1/songs/search?q=keyword` | 搜索歌曲 |

### 识别

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/recognize/upload` | 上传录音识别 |
| GET | `/api/v1/recognize/history` | 识别历史 |
| DELETE | `/api/v1/recognize/history/{id}` | 删除识别记录 |

### 推荐

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/recommend/daily` | 每日推荐 |
| GET | `/api/v1/recommend/similar/{song_id}` | 相似推荐 |

### 歌单 & 收藏

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/playlists` | 歌单列表 |
| POST | `/api/v1/playlists` | 创建歌单 |
| GET | `/api/v1/collections` | 收藏列表 |
| POST | `/api/v1/collections` | 添加收藏 |
| DELETE | `/api/v1/collections/{id}` | 取消收藏 |

## 使用识别功能

1. 用手机或其他设备播放曲库中的歌曲
2. 在 SoundSpot 网页端进入**识别**页面
3. 点击中央麦克风按钮开始录音
4. 将手机靠近电脑麦克风，录制约 **10 秒**
5. 点击停止按钮，等待分析
6. 查看识别结果，点击可跳转歌曲详情

**提示**：
- 录音至少需要 5 秒
- 手机音量适中即可，太近可能失真
- 尽量在安静环境中使用
- 周杰伦歌曲风格相近，部分歌曲可能误识别（算法已知限制）

## 数据库

使用 SQLite，文件位于 `soundspot-server/soundspot.db`。核心表：

- `users` — 用户
- `artists` — 艺人
- `albums` — 专辑
- `songs` — 歌曲
- `recognize_records` — 识别记录
- `playlists` / `playlist_songs` — 歌单
- `collections` — 收藏

**重建数据库**：删除 `soundspot.db`，彻底杀掉后端进程后重启，`seed.py` 会自动创建种子数据。

## 前端路由

| 路径 | 页面 | 需登录 |
|------|------|--------|
| `/login` | 登录页 | 否 |
| `/` | 首页（推荐 + 识别入口） | 是 |
| `/recognize` | 听音识曲 | 是 |
| `/discover` | 发现音乐 | 是 |
| `/library` | 音乐库 | 是 |
| `/search` | 搜索 | 是 |
| `/song/:id` | 歌曲详情 | 是 |

## 开发笔记

### 识别算法迭代

- **v1**：展平余弦相似度 — 录音与参考曲目整体展平后计算余弦相似度，无法处理时间偏移，麦克风录音完全无法识别
- **v2**：子序列交叉相关 — 在参考曲目上滑动录音窗口搜索最佳偏移，逐帧 L2 归一化后算余弦相似度，绝对阈值 0.55，适配麦克风录音

### 踩坑记录

- Windows GBK 编码：Python print 含 emoji/中文会 `UnicodeEncodeError`，避免在脚本中使用 emoji
- Vite ESM 循环依赖：类型定义统一放在 `types.ts`，避免从有副作用的模块导入类型
- passlib/bcrypt 不兼容：改用 `bcrypt` 库直接加密/验证
- 数据库重建：删 `.db` 后需彻底杀 uvicorn 再重启，否则旧进程持有旧数据
- librosa 后端启动慢：9 首歌指纹提取约 15-20 秒，启动时需等足够长时间

## License

MIT
