# 🎵 SoundSpot — 音乐识别与推荐系统 项目开发文档

> **版本**: v2.0.0 | **日期**: 2026-05-06 | **状态**: 核心功能已实现

---

## 目录

1. [项目概述](#1-项目概述)
2. [系统架构设计](#2-系统架构设计)
3. [技术栈选型](#3-技术栈选型)
4. [功能模块设计](#4-功能模块设计)
5. [API 接口设计](#5-api-接口设计)
6. [数据库设计](#6-数据库设计)
7. [音频识别算法](#7-音频识别算法)
8. [前端设计](#8-前端设计)
9. [项目结构](#9-项目结构)
10. [开发计划](#10-开发计划)
11. [部署方案](#11-部署方案)
12. [测试策略](#12-测试策略)
13. [已知限制与后续规划](#13-已知限制与后续规划)

---

## 1. 项目概述

### 1.1 项目背景

日常生活中，用户经常遇到"听到一首好听的歌但不知道名字"的场景。本项目构建了一套**前后端分离**的音乐识别与推荐系统，通过浏览器麦克风录音实现"听音识曲"功能，并提供音乐播放、推荐、歌单管理等完整体验。

### 1.2 项目目标

| 目标维度 | 描述 | 当前状态 |
|----------|------|----------|
| **识别准确率** | 安静环境下曲库内歌曲识别准确率 ≥ 90% | ✅ 已实现 |
| **识别速度** | 从录音到返回结果 ≤ 5 秒 | ✅ 已实现 |
| **推荐功能** | 每日推荐 + 相似歌曲推荐 | ✅ 已实现（基于内容特征） |
| **音乐播放** | 在线播放曲库歌曲，完整播放器 | ✅ 已实现 |
| **用户体验** | 暗色主题 UI，全站跳转，流畅交互 | ✅ 已实现 |

### 1.3 目标用户

- **核心用户**: 18-35 岁音乐爱好者，有"听歌识曲"需求
- **扩展用户**: 音乐创作者、播客制作者（识别采样来源）

### 1.4 核心功能

1. **音乐识别** ✅: 麦克风录音 → 音频指纹提取 → 子序列交叉相关匹配 → 返回歌曲信息
2. **音乐播放** ✅: 在线播放曲库歌曲，支持播放/暂停/上下曲/进度拖拽/音量调节
3. **个性化推荐** ✅: 基于内容特征的每日推荐和相似歌曲推荐
4. **音乐库管理** ✅: 收藏、歌单 CRUD、播放历史
5. **搜索** ✅: 关键词实时搜索歌曲
6. **社交功能** 📋: 计划中（分享识别记录、发现好友歌单）

### 1.5 当前曲库

曲库包含 **9 首周杰伦歌曲**，MP3 文件存放在 `soundspot-server/static/audio/`：

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

---

## 2. 系统架构设计

### 2.1 实际架构

```
┌──────────────────────────────────────────────────────┐
│                     客户端层                          │
│              ┌───────────────────┐                   │
│              │    Web 前端        │                   │
│              │  React + Vite     │                   │
│              │   (localhost:5173)│                   │
│              └────────┬──────────┘                   │
└───────────────────────┼──────────────────────────────┘
                        │ HTTP (Axios)
                        ▼
┌──────────────────────────────────────────────────────┐
│               后端服务层 (Python)                      │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │           FastAPI 单体应用 (port 8001)          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │  │
│  │  │ 认证路由  │ │ 歌曲路由  │ │ 识别路由  │       │  │
│  │  └──────────┘ └──────────┘ └──────────┘       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐       │  │
│  │  │ 推荐路由  │ │ 歌单路由  │ │ 收藏路由  │       │  │
│  │  └──────────┘ └──────────┘ └──────────┘       │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │        音频指纹模块 (fingerprint.py)      │  │  │
│  │  │  librosa CQT chroma + MFCC 子序列匹配    │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
│                        │                             │
│         ┌──────────────┼──────────────┐              │
│         ▼              ▼              ▼              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐         │
│  │  SQLite   │ │ 静态文件   │ │  内存      │         │
│  │  业务数据  │ │  MP3 音频  │ │ 指纹缓存   │         │
│  └───────────┘ └───────────┘ └───────────┘         │
└──────────────────────────────────────────────────────┘
```

### 2.2 架构特点

- **后端**: FastAPI 单体应用，按 Router 模块化拆分
- **通信**: 前后端通过 REST API 通信，Axios 请求自动携带 JWT Token
- **音频存储**: MP3 文件通过 FastAPI StaticFiles 直接提供
- **指纹缓存**: 音频指纹在启动时加载到内存，避免每次请求重复计算

### 2.3 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 数据库 | SQLite | 轻量级，无需额外部署，适合 Demo 阶段 |
| 音频指纹 | librosa CQT chroma + MFCC | 纯 Python 实现，无需外部依赖，CQT 对噪声更鲁棒 |
| 匹配算法 | 子序列交叉相关 | 解决录音时间偏移问题，无需对齐起点 |
| 音频存储 | 本地文件系统 + StaticFiles | 简单直接，无需对象存储服务 |
| 前端样式 | Tailwind CSS v4 | 原子化 CSS，暗色主题实现简单 |

---

## 3. 技术栈选型

### 3.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | 6 | 类型安全 |
| Vite | 8 | 构建工具 |
| Tailwind CSS | 4 | 样式方案（暗色主题） |
| Zustand | 5 | 全局状态管理 |
| TanStack Query | 5 | 数据请求与缓存 |
| React Router | 7 | 路由管理 |
| Axios | 1 | HTTP 客户端 |
| Lucide React | 1 | 图标库 |
| Web Audio API | - | 麦克风录音（MediaRecorder） |

### 3.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 主要开发语言 |
| FastAPI | 0.115 | Web 框架 |
| SQLAlchemy | 2.0 | ORM |
| Pydantic | 2.9 | 数据校验 |
| python-jose | 3.3 | JWT 认证 |
| bcrypt | - | 密码加密（直接使用，非 passlib） |
| librosa | - | 音频分析（CQT chroma + MFCC 特征提取） |
| soundfile | - | 音频格式转换（webm → wav） |
| numpy | - | 数值计算（余弦相似度） |
| uvicorn | 0.30 | ASGI 服务器 |

### 3.3 数据层

| 技术 | 用途 |
|------|------|
| SQLite | 关系型数据库（业务数据） |
| 本地文件系统 | MP3 音频文件存储 |
| 内存 | 音频指纹缓存（启动时加载） |

> ⚠️ 与原规划的差异：未使用 PostgreSQL / Redis / MinIO / Milvus / Celery / RabbitMQ。MVP 阶段采用最小化方案，后续可按需升级。

---

## 4. 功能模块设计

### 4.1 用户模块 ✅

```
用户模块
├── 注册/登录
│   └── 邮箱注册 + 登录 ✅
├── 认证与授权
│   ├── JWT Token 签发 ✅
│   └── Bearer Token 认证 ✅
└── 安全
    └── 密码加密（bcrypt） ✅
```

**测试账号**: `test@soundspot.com` / `123456`

### 4.2 识别模块 ✅

```
识别模块
├── 音频采集
│   └── 麦克风实时录音（MediaRecorder API） ✅
│       ├── 关闭浏览器回声消除（保留原始音频）
│       ├── 关闭浏览器降噪（保留更多细节）
│       ├── 开启自动增益控制
│       └── 最少录音 5 秒
├── 音频预处理
│   ├── 格式转换（webm → wav，librosa + soundfile） ✅
│   └── 音量归一化 ✅
├── 指纹提取
│   ├── CQT chroma 特征（12维，旋律匹配核心） ✅
│   └── MFCC 特征（20维，音色辅助匹配） ✅
├── 指纹匹配
│   └── 子序列交叉相关匹配 ✅
│       ├── 在参考曲目上滑动录音窗口
│       ├── 逐帧 L2 归一化后计算余弦相似度
│       └── 取所有时间偏移中的最高分
├── 结果判断
│   ├── 动态绝对阈值（0.55） ✅
│   ├── 动态 gap 阈值（0.01~0.05） ✅
│   └── 不匹配返回"无法识别该音乐" ✅
└── 识别记录
    ├── 历史记录存储 ✅
    └── 历史记录删除 ✅
```

### 4.3 推荐模块 ✅

```
推荐模块
├── 每日推荐 ✅
│   └── 基于内容特征的推荐
├── 相似歌曲推荐 ✅
│   └── 基于音频特征的相似度排序
└── 推荐理由 ✅
    └── 附带推荐理由说明
```

### 4.4 音乐库模块 ✅

```
音乐库模块
├── 歌曲管理
│   ├── 歌曲列表 ✅
│   ├── 歌曲详情 ✅
│   ├── 关键词搜索 ✅
│   └── 在线播放 ✅
├── 歌单功能
│   ├── 歌单列表 ✅
│   └── 创建歌单 ✅
├── 收藏
│   ├── 收藏列表 ✅
│   ├── 添加收藏 ✅
│   └── 取消收藏 ✅
└── 识别历史
    ├── 历史列表 ✅
    └── 删除记录 ✅
```

### 4.5 社交模块 📋

```
社交模块（计划中）
├── 分享识别结果
├── 歌单分享
└── 热门识别排行
```

---

## 5. API 接口设计

### 5.1 接口规范

- **风格**: RESTful API
- **认证**: Bearer Token (JWT)
- **版本**: URL 路径版本 `/api/v1/`
- **编码**: UTF-8 JSON
- **分页**: `page` + `page_size`

### 5.2 已实现 API

#### 认证模块

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 | ✅ |
| POST | `/api/v1/auth/login` | 用户登录 | ✅ |
| GET | `/api/v1/users/me` | 获取当前用户信息 | ✅ |

#### 识别模块

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| POST | `/api/v1/recognize/upload` | 上传录音识别（multipart） | ✅ |
| GET | `/api/v1/recognize/history` | 获取识别历史 | ✅ |
| DELETE | `/api/v1/recognize/history/{id}` | 删除识别记录 | ✅ |

#### 推荐模块

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| GET | `/api/v1/recommend/daily` | 每日推荐歌单 | ✅ |
| GET | `/api/v1/recommend/similar/{song_id}` | 相似歌曲推荐 | ✅ |

#### 歌曲模块

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| GET | `/api/v1/songs` | 歌曲列表 | ✅ |
| GET | `/api/v1/songs/{id}` | 歌曲详情 | ✅ |
| GET | `/api/v1/songs/search?q=keyword` | 搜索歌曲 | ✅ |

#### 歌单模块

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| GET | `/api/v1/playlists` | 歌单列表 | ✅ |
| POST | `/api/v1/playlists` | 创建歌单 | ✅ |

#### 收藏模块

| 方法 | 路径 | 描述 | 状态 |
|------|------|------|------|
| GET | `/api/v1/collections` | 收藏列表 | ✅ |
| POST | `/api/v1/collections` | 添加收藏 | ✅ |
| DELETE | `/api/v1/collections/{id}` | 取消收藏 | ✅ |

### 5.3 关键接口详细设计

#### 上传录音识别

```
POST /api/v1/recognize/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Parameters:
  audio: (required, binary) 音频文件，支持 webm/ogg/wav/mp3

Response 200 (识别成功):
{
  "task_id": "rec_abc123",
  "status": "completed",
  "result": {
    "song": {
      "id": "f8b884a5-...",
      "title": "晴天",
      "artist": {"id": "70f9da05-...", "name": "周杰伦"},
      "album": {"id": "171e4575-...", "title": "叶惠美", "cover_url": "..."},
      "duration": 269,
      "genre": "流行",
      "cover_url": "...",
      "audio_url": "/static/audio/晴天.mp3",
      "release_date": "2003-07-31"
    },
    "confidence": 0.72,
    "match_type": "fingerprint",
    "offset_ms": 0
  }
}

Response 200 (未识别):
{
  "task_id": "rec_abc123",
  "status": "completed",
  "result": null,
  "message": "无法识别该音乐，请确保音乐在库中且录音时长足够（建议5秒以上）"
}
```

#### 每日推荐

```
GET /api/v1/recommend/daily
Authorization: Bearer <token>

Response 200:
{
  "items": [
    {
      "song": {
        "id": "...",
        "title": "晴天",
        "artist": {"id": "...", "name": "周杰伦"},
        "album": {"id": "...", "title": "叶惠美", "cover_url": "..."},
        "duration": 269,
        "cover_url": "...",
        "audio_url": "/static/audio/晴天.mp3"
      },
      "reason": "基于你的听歌偏好推荐",
      "reason_type": "content_based",
      "confidence": 0.85
    }
  ]
}
```

---

## 6. 数据库设计

### 6.1 数据库选型

当前使用 **SQLite**（文件：`soundspot-server/soundspot.db`），无需额外部署数据库服务。

### 6.2 ER 关系概览

```
┌─────────┐     ┌──────────────┐     ┌─────────┐
│  users  │────<│  recognize_  │     │  songs  │
│         │     │   records    │>────│         │
└────┬────┘     └──────────────┘     └────┬────┘
     │                                    │
     │          ┌──────────────┐          │
     ├─────────<│  collections │>─────────┤
     │          └──────────────┘          │
     │                                    │
     │          ┌──────────────┐     ┌────┴────┐
     ├─────────<│  playlist_   │>────│  albums │
     │          │   songs      │     └────┬────┘
     │          └──────┬───────┘          │
     │                 │            ┌─────┴────┐
     │          ┌──────┴───────┐    │  artists │
     │          │  playlists   │    └──────────┘
     │          └──────────────┘
     └─────────────────────────────┘
```

### 6.3 核心表结构

#### users — 用户表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | VARCHAR(36) | PK | 用户 ID (UUID) |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱 |
| phone | VARCHAR(20) | UNIQUE | 手机号（可选） |
| nickname | VARCHAR(50) | NOT NULL | 昵称 |
| avatar_url | VARCHAR(500) | | 头像 URL |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 密码哈希 |
| status | VARCHAR(20) | DEFAULT 'active' | 状态 |
| created_at | DATETIME | DEFAULT NOW | 创建时间 |
| updated_at | DATETIME | DEFAULT NOW | 更新时间 |

#### artists — 艺人表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | VARCHAR(36) | PK | 艺人 ID |
| name | VARCHAR(100) | NOT NULL | 艺人名 |
| avatar_url | VARCHAR(500) | | 头像 |
| genre | VARCHAR(50) | | 主要流派 |
| country | VARCHAR(50) | | 国家/地区 |
| bio | TEXT | | 简介 |

#### albums — 专辑表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | VARCHAR(36) | PK | 专辑 ID |
| title | VARCHAR(200) | NOT NULL | 专辑名 |
| artist_id | VARCHAR(36) | FK → artists.id | 主艺人 |
| cover_url | VARCHAR(500) | | 封面 |
| release_date | VARCHAR(10) | | 发行日期 |
| type | VARCHAR(20) | DEFAULT 'album' | 类型 |

#### songs — 歌曲表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | VARCHAR(36) | PK | 歌曲 ID |
| title | VARCHAR(200) | NOT NULL | 歌曲名 |
| artist_id | VARCHAR(36) | FK → artists.id | 主艺人 ID |
| album_id | VARCHAR(36) | FK → albums.id | 专辑 ID |
| duration | INTEGER | | 时长（秒） |
| genre | VARCHAR(50) | | 流派 |
| language | VARCHAR(20) | | 语言 |
| release_date | VARCHAR(10) | | 发行日期 |
| isrc | VARCHAR(15) | UNIQUE | 国际标准录音代码 |
| fingerprint_hash | VARCHAR(64) | INDEX | 指纹哈希（预留） |
| cover_url | VARCHAR(500) | | 封面图 URL |
| audio_url | VARCHAR(500) | | 音频文件路径 |
| status | VARCHAR(20) | DEFAULT 'active' | 状态 |
| created_at | DATETIME | DEFAULT NOW | 入库时间 |

#### recognize_records — 识别记录表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | VARCHAR(36) | PK | 记录 ID |
| user_id | VARCHAR(36) | FK → users.id | 用户 ID |
| song_id | VARCHAR(36) | FK → songs.id, NULLABLE | 识别出的歌曲（NULL=未识别） |
| confidence | FLOAT | | 置信度（0~1） |
| match_type | VARCHAR(20) | | 匹配方式（fingerprint） |
| offset_ms | INTEGER | | 匹配偏移（毫秒） |
| audio_duration | FLOAT | | 提交音频时长（秒） |
| note | TEXT | | 备注 |
| created_at | DATETIME | DEFAULT NOW | 识别时间 |

#### playlists — 歌单表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | VARCHAR(36) | PK | 歌单 ID |
| user_id | VARCHAR(36) | FK → users.id | 创建者 |
| name | VARCHAR(100) | NOT NULL | 歌单名 |
| description | TEXT | | 描述 |
| cover_url | VARCHAR(500) | | 封面 |
| is_public | BOOLEAN | DEFAULT true | 是否公开 |
| type | VARCHAR(20) | DEFAULT 'custom' | 类型 |
| created_at | DATETIME | DEFAULT NOW | 创建时间 |

#### playlist_songs — 歌单-歌曲关联表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | VARCHAR(36) | PK | ID |
| playlist_id | VARCHAR(36) | FK → playlists.id | 歌单 ID |
| song_id | VARCHAR(36) | FK → songs.id | 歌曲 ID |
| position | INTEGER | | 排序位置 |
| added_at | DATETIME | DEFAULT NOW | 添加时间 |

#### collections — 收藏表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | VARCHAR(36) | PK | ID |
| user_id | VARCHAR(36) | FK → users.id | 用户 ID |
| target_type | VARCHAR(20) | NOT NULL | 目标类型（song/artist/album） |
| target_id | VARCHAR(36) | NOT NULL | 目标 ID |
| created_at | DATETIME | DEFAULT NOW | 收藏时间 |

---

## 7. 音频识别算法

### 7.1 算法选型

采用 **librosa CQT chroma + MFCC 子序列交叉相关匹配**，纯 Python 实现，无需外部依赖。

| 特征 | 维度 | 权重 | 作用 |
|------|------|------|------|
| CQT chroma | 12 | 0.75 | 旋律匹配核心（对噪声和音高偏移鲁棒） |
| MFCC | 20 | 0.25 | 音色辅助匹配 |

> 选择 CQT chroma 而非 STFT chroma 的原因：CQT 在频率轴上是对数分布，更接近人耳感知，对噪声更鲁棒。

### 7.2 指纹构建流程

```
启动时 build_fingerprint_db():
    │
    ├── 扫描 static/audio/ 下所有 .mp3/.wav 文件
    │
    ├── 对每个文件：
    │   ├── librosa.load(sr=22050, duration=60, mono=True)
    │   ├── 音量归一化（峰值 → 0.8）
    │   ├── librosa.feature.chroma_cqt(y, sr, n_chroma=12, hop_length=512)
    │   └── librosa.feature.mfcc(y, sr, n_mfcc=20, hop_length=512)
    │
    └── 存入内存字典 _fingerprint_db { filename: {chroma, mfcc} }
```

- 采样率: 22050 Hz
- hop_length: 512（每帧约 23ms）
- 提取时长: 前 60 秒
- 9 首歌加载约需 15-20 秒

### 7.3 匹配算法

```
match_audio(query_path):
    │
    ├── 提取录音特征（同上流程，duration=30s）
    │
    ├── 对每首参考曲目：
    │   └── _subsequence_cross_corr(query, reference)
    │       │
    │       ├── 逐帧 L2 归一化
    │       │
    │       ├── 滑动窗口搜索（step=2）：
    │       │   └── 对每个偏移 t：
    │       │       └── score = mean(Σ query_normed[:,i] · ref_normed[:,t+i])
    │       │
    │       ├── 精细搜索：最佳偏移 ±2 范围内逐帧
    │       │
    │       └── chroma_score × 0.75 + mfcc_score × 0.25 = combined
    │
    ├── 按 combined 排序，取 Top 1
    │
    └── 阈值判断：
        ├── best >= 0.85  → gap >= 0.03
        ├── best >= 0.70  → gap >= 0.02
        ├── best >= 0.55  → gap >= 0.01
        └── 否则 → "无法识别该音乐"
```

**核心思想**：录音可能从歌曲中间开始，所以需要在参考曲目上滑动窗口搜索最佳对齐位置，而不是简单地将整首歌展平比较。

### 7.4 算法迭代历史

| 版本 | 算法 | 问题 |
|------|------|------|
| v1 | 展平余弦相似度 | 无法处理时间偏移，麦克风录音完全无法识别（阈值 0.85 太高） |
| v2 | 子序列交叉相关 | 解决时间偏移问题，绝对阈值降至 0.55，适配麦克风录音 |

### 7.5 录音处理流水线

```
浏览器 MediaRecorder (webm/opus)
        │
        ▼
  上传到后端 (multipart/form-data)
        │
        ▼
  保存为临时文件
        │
        ▼
  librosa.load() + soundfile.write() → WAV
        │
        ▼
  _extract_features() → {chroma, mfcc}
        │
        ▼
  match_audio() → 匹配结果
        │
        ▼
  清理临时文件
```

---

## 8. 前端设计

### 8.1 页面结构

```
App (BrowserRouter)
├── /login (LoginPage)          ← 公开页面
└── Layout (侧边栏 + 底部播放器)
    ├── / (HomePage)            ← 识别入口 + 每日推荐 + 最近识别
    ├── /recognize (RecognizePage) ← 录音识曲
    ├── /discover (DiscoverPage)   ← 发现音乐
    ├── /library (LibraryPage)     ← 音乐库（收藏/歌单/历史）
    ├── /search (SearchPage)       ← 搜索
    └── /song/:id (SongDetailPage) ← 歌曲详情 + 相似推荐
```

### 8.2 全站跳转逻辑

| 触发位置 | 点击行为 | 效果 |
|----------|----------|------|
| 歌曲卡片（首页/发现/搜索） | 点击卡片 | 跳转 `/song/:id` |
| 歌曲卡片播放按钮 | 点击遮罩层 | 播放歌曲（stopPropagation，不跳转） |
| 识别成功结果 | 点击结果区域 | 跳转 `/song/:id` |
| 识别历史列表 | 点击记录 | 跳转 `/song/:id` |
| 最近识别列表 | 点击记录 | 跳转 `/song/:id` |
| 底部播放器歌曲信息 | 点击信息区域 | 跳转当前歌曲 `/song/:id` |
| 歌曲详情页相似推荐 | 点击卡片 | 跳转对应 `/song/:id` |
| 歌曲详情页播放按钮 | 点击遮罩层 | 播放歌曲（不跳转） |

### 8.3 核心交互流程

#### 识别流程

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 点击麦克风 │───>│ 录音中... │───>│  分析中  │───>│ 识别结果 │
│   按钮    │    │ 计时显示  │    │  加载动画 │    │ 点击跳转 │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │                               │
     ▼               ▼                               ▼
 请求麦克风权限   至少5秒才能停止               成功→歌曲详情
                  关闭回声消除/降噪             失败→提示信息
```

#### 播放器流程

```
┌──────────────────────────────────────────────┐
│                  PlayerBar                    │
│  ┌──────┐  ◄◀  ▶/❚❚  ▶▶  0:45/4:29  🔊━━  │
│  │封面图 │  上一曲 播放 下一曲   进度    音量  │
│  │+标题  │                                    │
│  │+艺人  │  点击歌曲信息 → 跳转歌曲详情页      │
│  └──────┘                                    │
└──────────────────────────────────────────────┘
```

### 8.4 UI 主题

- **风格**: 暗色主题，indigo 主色调
- **背景色**: `#0f0f1a`（主区域）、`#12122a`（侧边栏/播放器）、`#1a1a2e`（卡片）
- **边框色**: `#2d2d4a`
- **主题色**: indigo-500/400
- **字体**: Inter + 系统字体回退

---

## 9. 项目结构

### 9.1 后端目录结构

```
soundspot-server/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 入口，lifespan 启动指纹库
│   ├── config.py               # 配置管理（JWT密钥、数据库URL等）
│   ├── database.py             # SQLAlchemy 连接 + Session
│   ├── dependencies.py         # 依赖注入（get_current_user, get_db）
│   ├── models.py               # SQLAlchemy 模型定义（7张表）
│   ├── schemas.py              # Pydantic 请求/响应模型
│   ├── auth.py                 # 密码加密/验证（bcrypt）
│   ├── seed.py                 # 种子数据（9首周杰伦歌曲 + 艺人 + 专辑）
│   ├── fingerprint.py          # 音频指纹模块（核心算法）
│   │                           #   build_fingerprint_db() - 启动构建
│   │                           #   match_audio() - 匹配识别
│   │                           #   _subsequence_cross_corr() - 子序列交叉相关
│   │                           #   _extract_features() - CQT chroma + MFCC
│   └── routers/
│       ├── __init__.py
│       ├── auth.py             #   注册/登录
│       ├── songs.py            #   歌曲 CRUD + 搜索
│       ├── recognize.py        #   录音识别（上传→转WAV→匹配→返回结果）
│       ├── recommend.py        #   每日推荐 + 相似推荐
│       ├── playlists.py        #   歌单 CRUD
│       └── collections.py      #   收藏管理
│
├── static/audio/               # 9个 MP3 音频文件
├── requirements.txt            # Python 依赖
└── soundspot.db                # SQLite 数据库
```

### 9.2 前端目录结构

```
soundspot-web/
├── src/
│   ├── main.tsx                # 入口
│   ├── App.tsx                 # 路由配置 + 认证守卫
│   ├── index.css               # 全局样式 + Tailwind + 动画
│   │
│   ├── api/                    # API 请求层
│   │   ├── client.ts           #   Axios 实例 + JWT 拦截器
│   │   ├── auth.ts             #   认证 API
│   │   ├── songs.ts            #   歌曲 API
│   │   ├── recognize.ts        #   识别 API
│   │   ├── recommend.ts        #   推荐 API
│   │   ├── playlists.ts        #   歌单 API
│   │   └── types.ts            #   TypeScript 类型定义（所有接口类型集中管理）
│   │
│   ├── components/
│   │   ├── Layout.tsx          #   侧边栏布局（可展开/收起）+ 导航
│   │   └── PlayerBar.tsx       #   底部播放器（进度/播放/音量）
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx       #   登录页
│   │   ├── HomePage.tsx        #   首页（识别按钮 + 每日推荐 + 最近识别）
│   │   ├── RecognizePage.tsx   #   录音识曲页（MediaRecorder + 计时 + 结果展示）
│   │   ├── DiscoverPage.tsx    #   发现页
│   │   ├── LibraryPage.tsx     #   音乐库（收藏/歌单/历史 Tab）
│   │   ├── SearchPage.tsx      #   搜索页（防抖搜索）
│   │   └── SongDetailPage.tsx  #   歌曲详情 + 相似推荐
│   │
│   └── stores/
│       ├── authStore.ts        #   认证状态（token, user, login/logout）
│       └── playerStore.ts      #   播放器状态（当前歌曲、队列、进度、音量）
│
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 10. 开发计划

### 10.1 已完成

| 阶段 | 任务 | 状态 |
|------|------|------|
| Phase 1 | 项目初始化、前后端分离架构搭建 | ✅ |
| Phase 1 | 用户注册/登录、JWT 认证 | ✅ |
| Phase 1 | 暗色主题 UI、侧边栏导航 | ✅ |
| Phase 1 | 录音组件、音频上传接口 | ✅ |
| Phase 2 | 音频指纹提取与匹配 | ✅ |
| Phase 2 | 歌曲搜索、歌曲详情页 | ✅ |
| Phase 2 | 在线播放器、播放队列 | ✅ |
| Phase 2 | 全站跳转逻辑（卡片→详情） | ✅ |
| Phase 2 | 推荐接口（每日推荐 + 相似推荐） | ✅ |
| Phase 2 | 歌单 CRUD、收藏管理 | ✅ |

### 10.2 进行中/待优化

| 任务 | 优先级 | 说明 |
|------|--------|------|
| 识别算法优化 | 高 | 周杰伦歌曲风格相近，部分歌曲可能误识别 |
| 曲库扩充 | 高 | 当前仅 9 首，需扩充以提升实用价值 |
| 测试覆盖 | 中 | 需补充单元测试和集成测试 |

### 10.3 后续规划

| 阶段 | 任务 | 预期 |
|------|------|------|
| Phase 3 | 接入 PostgreSQL 替换 SQLite | 生产环境准备 |
| Phase 3 | 接入 Redis 缓存推荐结果 | 性能优化 |
| Phase 3 | 深度学习音频编码器（替代手工特征） | 提升识别准确率 |
| Phase 3 | 协同过滤推荐（需用户行为数据积累） | 推荐质量提升 |
| Phase 4 | 社交功能（分享、关注、动态） | 用户粘性 |
| Phase 4 | Docker 容器化部署 | 运维标准化 |

---

## 11. 部署方案

### 11.1 当前开发环境

```
前端: npm run dev (Vite, localhost:5173)
后端: uvicorn app.main:app --port 8001 --reload
数据库: SQLite 本地文件
音频: 本地文件系统 static/audio/
```

### 11.2 生产环境规划

```
                    ┌─────────────────┐
                    │   Nginx         │
                    │   反向代理 + 静态资源│
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼                             ▼
        ┌──────────┐                 ┌──────────┐
        │  前端    │                 │  后端    │
        │  静态文件 │                 │  FastAPI  │
        └──────────┘                 └────┬─────┘
                                          │
                                   ┌──────┼──────┐
                                   ▼      ▼      ▼
                              ┌──────┐┌──────┐┌──────┐
                              │  PG  ││Redis ││ MinIO│
                              └──────┘└──────┘└──────┘
```

> 当前使用最小化方案（SQLite + 本地文件），生产环境按需升级。

---

## 12. 测试策略

### 12.1 测试账号

| 邮箱 | 密码 | 说明 |
|------|------|------|
| test@soundspot.com | 123456 | 预置测试账号 |

### 12.2 功能测试项

| 类别 | 测试项 | 方法 | 状态 |
|------|--------|------|------|
| 认证 | 注册/登录 | 手动测试 | ✅ |
| 识别 | 安静环境识别 | 手机外放 + 麦克风录制 | ✅ |
| 识别 | 非曲库歌曲 | 播放不支持的歌 → "无法识别" | ✅ |
| 识别 | 短录音（<5秒） | 按钮禁用，无法停止 | ✅ |
| 播放 | 播放/暂停/上下曲 | 底部播放器操作 | ✅ |
| 播放 | 进度拖拽/音量调节 | 播放器交互 | ✅ |
| 跳转 | 卡片→详情页 | 点击歌曲卡片 | ✅ |
| 跳转 | 播放器→详情页 | 点击底部歌曲信息 | ✅ |
| 搜索 | 关键词搜索 | 输入歌曲名搜索 | ✅ |
| 推荐 | 每日推荐/相似推荐 | 页面查看 | ✅ |

### 12.3 识别算法测试

| 场景 | 预期结果 | 实际表现 |
|------|----------|----------|
| 安静环境，手机外放 | 正确识别 | ✅ 正常 |
| 2% 高斯噪声 | 正确识别 | ✅ 置信度 ~83%+ |
| 纯噪声 | "无法识别" | ✅ 正确拒绝 |
| 5% 高斯噪声 | 正确识别 | ⚠️ 边界情况，可能误判为相似风格歌曲 |

---

## 13. 已知限制与后续规划

### 13.1 已知限制

| 限制 | 原因 | 影响 |
|------|------|------|
| 曲库仅 9 首歌曲 | 手动添加 MP3 | 只能识别这 9 首歌 |
| 周杰伦歌曲风格相近 | 相似旋律和编曲 | 嘈杂环境下可能误识别为另一首 |
| SQLite 并发能力有限 | 单文件数据库 | 多用户同时操作可能锁定 |
| 指纹加载耗时 15-20s | librosa 特征提取慢 | 启动后需等待才能使用识别 |
| 无用户行为追踪 | 未实现播放历史记录 | 推荐算法无法基于用户偏好优化 |
| 无音频格式转换 | 仅支持浏览器录音格式 | 不支持直接上传本地音频文件识别 |

### 13.2 后续优化方向

| 方向 | 优先级 | 方案 |
|------|--------|------|
| 曲库扩充 | 高 | 接入免费音乐 API 或批量导入 |
| 识别算法 | 高 | 引入深度学习编码器（VGGish/PANNs）替代手工特征 |
| 数据库升级 | 中 | SQLite → PostgreSQL |
| 缓存层 | 中 | 引入 Redis 缓存推荐结果和指纹查询 |
| 异步处理 | 中 | 识别任务改为异步（Celery），避免阻塞请求 |
| 社交功能 | 低 | 分享识别结果、关注、动态 |

---

## 附录

### A. 环境变量

```bash
# JWT
JWT_SECRET_KEY=<secret>          # JWT 签名密钥
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440  # Token 有效期（分钟）

# 数据库
DATABASE_URL=sqlite:///./soundspot.db  # 当前使用 SQLite

# 音频
AUDIO_DIR=./static/audio         # 音频文件目录
```

### B. 常用开发命令

```bash
# 启动后端
cd soundspot-server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# 启动前端
cd soundspot-web
npm run dev

# 杀后端进程（Windows）
taskkill /F /IM python.exe /T

# 重建数据库
del soundspot-server\soundspot.db
# 然后重启后端，seed.py 会自动创建种子数据
```

### C. 踩坑记录

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Python print 含 emoji 报错 | Windows GBK 编码 | 避免 print 中使用 emoji/特殊字符 |
| Vite ESM 循环依赖 | 从有副作用的模块导入类型 | 类型定义统一放在 `types.ts` |
| passlib/bcrypt 不兼容 | passlib 版本与 bcrypt 2.x 不兼容 | 改用 `bcrypt` 库直接加密/验证 |
| 数据库重建后数据未更新 | 旧 uvicorn 进程持有旧数据 | 彻底杀进程后重启 |
| 展平余弦相似度无法识别麦克风录音 | 时间偏移导致无法对齐 | 改用子序列交叉相关匹配 |
| 阈值 0.85 太高 | 麦克风录音信号损失大 | 降至 0.55 + 动态 gap |

---

> **文档维护说明**: 本文档随项目开发持续更新，反映当前实际实现状态。标注 ✅ 为已实现，📋 为计划中。

### 变更日志

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-04-29 | v1.0.0 | 初始版本，完整项目开发文档（规划阶段） |
| 2026-05-06 | v2.0.0 | 全面更新至实际实现状态：技术栈、架构、算法、API、数据库、前端、跳转逻辑、识别算法迭代 |
