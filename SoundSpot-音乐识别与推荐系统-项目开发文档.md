# 🎵 SoundSpot — 音乐识别与推荐系统 项目开发文档

> **版本**: v1.0.0 | **日期**: 2026-04-29 | **状态**: 规划阶段

---

## 目录

1. [项目概述](#1-项目概述)
2. [系统架构设计](#2-系统架构设计)
3. [技术栈选型](#3-技术栈选型)
4. [功能模块设计](#4-功能模块设计)
5. [API 接口设计](#5-api-接口设计)
6. [数据库设计](#6-数据库设计)
7. [AI 模型设计](#7-ai-模型设计)
8. [前端设计](#8-前端设计)
9. [项目结构](#9-项目结构)
10. [开发计划](#10-开发计划)
11. [部署方案](#11-部署方案)
12. [测试策略](#12-测试策略)
13. [风险评估与应对](#13-风险评估与应对)

---

## 1. 项目概述

### 1.1 项目背景

日常生活中，用户经常遇到"听到一首好听的歌但不知道名字"的场景。现有音乐识别应用（如 Shazam、SoundHound）在识别准确性、推荐质量和用户体验上仍有提升空间。本项目旨在构建一套**前后端分离**的音乐识别与推荐系统，提供精准的音频指纹识别和个性化的音乐推荐服务。

### 1.2 项目目标

| 目标维度 | 描述 |
|----------|------|
| **识别准确率** | 主流音乐识别准确率 ≥ 95%，嘈杂环境下 ≥ 85% |
| **识别速度** | 从录音到返回结果 ≤ 3 秒 |
| **推荐质量** | 推荐曲目用户点击率 ≥ 30%（行业基准约 15-20%） |
| **并发能力** | 支持 1000 QPS 的识别请求 |
| **用户体验** | 首次使用到完成识别 ≤ 15 秒 |

### 1.3 目标用户

- **核心用户**: 18-35 岁音乐爱好者，有"听歌识曲"需求
- **扩展用户**: 音乐创作者、播客制作者（识别采样来源）
- **潜在用户**: 音乐平台运营方（B 端 API 服务）

### 1.4 核心功能

1. **音乐识别**: 录音/上传音频 → 音频指纹提取 → 数据库匹配 → 返回歌曲信息
2. **个性化推荐**: 基于用户听歌历史和偏好 → 多策略推荐 → 持续优化
3. **音乐库管理**: 收藏、歌单、播放历史、偏好标签
4. **社交功能**: 分享识别记录、发现好友歌单

---

## 2. 系统架构设计

### 2.1 整体架构

```
┌──────────────────────────────────────────────────────┐
│                       客户端层                        │
│   ┌───────────┐   ┌───────────┐   ┌───────────┐    │
│   │ Web 前端   │   │ iOS(未来)  │   │ Android   │    │
│   │ (React)   │   │           │   │ (未来)     │    │
│   └─────┬─────┘   └───────────┘   └───────────┘    │
└────────┼─────────────────────────────────────────────┘
         │ HTTPS / WebSocket
         ▼
┌──────────────────────────────────────────────────────┐
│                 API 网关层 (Nginx)                     │
│        负载均衡 · 限流 · SSL终止 · 静态资源             │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│                后端服务层 (Python)                     │
│                                                      │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐      │
│   │  用户服务  │  │  识别服务  │  │  推荐服务  │      │
│   │ (FastAPI) │  │ (FastAPI) │  │ (FastAPI) │      │
│   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘      │
│         │              │              │              │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐      │
│   │  音乐库   │  │ 音频处理   │  │  社交服务  │      │
│   │ (FastAPI) │  │ (Celery)  │  │ (FastAPI) │      │
│   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘      │
└────────┼───────────────┼───────────────┼────────────┘
         │               │               │
         ▼               ▼               ▼
┌──────────────────────────────────────────────────────┐
│                      数据层                           │
│                                                      │
│  ┌───────────┐ ┌───────────┐ ┌──────────┐ ┌───────┐ │
│  │ PostgreSQL │ │   Redis   │ │  MinIO   │ │Milvus│ │
│  │  业务数据  │ │ 缓存/会话  │ │ 音频文件  │ │向量检索│ │
│  └───────────┘ └───────────┘ └──────────┘ └───────┘ │
└──────────────────────────────────────────────────────┘
```

### 2.2 架构风格

- **后端**: 模块化单体起步，后续按需拆分为微服务
- **通信**: 内部通过 RabbitMQ 异步通信，外部 REST + WebSocket
- **数据**: 读写分离 + 缓存优先策略

### 2.3 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 架构风格 | 模块化单体 → 微服务 | 初期降低复杂度，后期按需拆分 |
| 音频指纹 | Chromaprint + 自研模型 | 成熟稳定，社区支持好，可扩展 |
| 向量检索 | Milvus | 支持十亿级规模向量检索 |
| 异步任务 | Celery + RabbitMQ | Python 生态成熟，与 FastAPI 集成好 |
| 对象存储 | MinIO | S3 兼容，私有部署，成本低 |

---

## 3. 技术栈选型

### 3.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18+ | UI 框架 |
| TypeScript | 5+ | 类型安全 |
| Vite | 5+ | 构建工具 |
| TanStack Query | 5+ | 数据请求与缓存 |
| Zustand | 4+ | 全局状态管理 |
| Tailwind CSS | 3+ | 样式方案 |
| Shadcn/UI | latest | 组件库 |
| Web Audio API | - | 音频录制与处理 |
| Framer Motion | 10+ | 动画 |

### 3.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 主要开发语言 |
| FastAPI | 0.100+ | Web 框架 |
| SQLAlchemy | 2.0+ | ORM |
| Alembic | 1.12+ | 数据库迁移 |
| Celery | 5.3+ | 异步任务队列 |
| RabbitMQ | 3.12+ | 消息中间件 |
| Pydantic | 2.0+ | 数据校验 |
| librosa | 0.10+ | 音频分析 |
| Chromaprint/fpcalc | - | 音频指纹提取 |
| scikit-learn | 1.3+ | 推荐算法 |
| PyTorch | 2.0+ | 深度学习模型 |

### 3.3 数据层技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| PostgreSQL | 15+ | 关系型数据库（主库） |
| Redis | 7+ | 缓存、会话、实时数据 |
| MinIO | latest | 对象存储（音频文件） |
| Milvus | 2.3+ | 向量数据库（指纹/特征检索） |

### 3.4 DevOps 技术栈

| 技术 | 用途 |
|------|------|
| Docker | 容器化 |
| Docker Compose | 本地编排 |
| GitHub Actions | CI/CD |
| Nginx | 反向代理/负载均衡 |
| Prometheus + Grafana | 监控告警 |

---

## 4. 功能模块设计

### 4.1 用户模块

```
用户模块
├── 注册/登录
│   ├── 邮箱注册
│   ├── 手机号注册
│   └── 第三方登录（微信/GitHub）
├── 用户信息
│   ├── 基本资料编辑
│   ├── 头像上传
│   └── 偏好设置
├── 认证与授权
│   ├── JWT Token 签发
│   ├── Refresh Token 刷新
│   └── RBAC 权限控制
└── 安全
    ├── 密码加密（bcrypt）
    ├── 登录设备管理
    └── 操作日志
```

### 4.2 识别模块

```
识别模块
├── 音频采集
│   ├── 麦克风实时录音（Web Audio API）
│   └── 文件上传（mp3/wav/flac/aac）
├── 音频预处理
│   ├── 格式转换（统一转 WAV 16kHz 单声道）
│   ├── 降噪处理（谱减法）
│   ├── 音量归一化
│   └── 静音检测与裁剪
├── 指纹提取
│   ├── Chromaprint 指纹生成
│   ├── 频谱特征提取（MFCC/Chroma）
│   └── 深度特征提取（CNN Encoder）
├── 指纹匹配
│   ├── 精确匹配（Chromaprint 比对）
│   ├── 模糊匹配（汉明距离容错）
│   └── 向量相似检索（Milvus ANN）
├── 结果排序
│   ├── 置信度评分
│   ├── 多候选结果合并
│   └── 歌曲元信息补全
└── 识别记录
    ├── 历史记录存储
    ├── 时间/地点标记
    └── 备注/标签
```

### 4.3 推荐模块

```
推荐模块
├── 数据采集
│   ├── 识别历史
│   ├── 收藏/歌单
│   ├── 播放行为（完播率/跳过率）
│   └── 显式反馈（喜欢/不喜欢）
├── 特征工程
│   ├── 用户画像（偏好标签、风格倾向）
│   ├── 歌曲特征（流派/节奏/情感/时代）
│   └── 上下文特征（时间/天气/场景）
├── 推荐策略
│   ├── 协同过滤（User-CF / Item-CF）
│   ├── 内容推荐（音频特征相似度）
│   ├── 深度学习推荐（Wide & Deep / DeepFM）
│   ├── 热门推荐（全局/分品类）
│   └── 新歌推荐（冷启动探索）
├── 推荐结果处理
│   ├── 多策略融合（加权/级联）
│   ├── 去重与过滤（已听/不感兴趣）
│   ├── 多样性保证（MMR 算法）
│   └── 实时更新（流式计算）
└── 反馈闭环
    ├── 曝光/点击/收藏追踪
    ├── A/B 实验框架
    └── 模型在线更新
```

### 4.4 音乐库模块

```
音乐库模块
├── 歌曲管理
│   ├── 歌曲信息 CRUD
│   ├── 专辑/艺人关联
│   ├── 标签/流派分类
│   └── 歌词存储
├── 歌单功能
│   ├── 创建/编辑歌单
│   ├── 智能歌单生成
│   ├── 歌单分享
│   └── 歌单导入/导出
├── 收藏与喜欢
│   ├── 收藏歌曲
│   ├── 收藏艺人/专辑
│   └── 最近播放
└── 搜索
    ├── 关键词搜索（歌曲/艺人/专辑）
    ├── 模糊搜索
    ├── 搜索建议/自动补全
    └── 热门搜索
```

### 4.5 社交模块

```
社交模块
├── 分享
│   ├── 识别结果分享
│   ├── 歌单分享
│   └── 外部平台分享（微信/微博）
├── 互动
│   ├── 点赞/评论
│   ├── 关注用户
│   └── 动态 Feed
└── 发现
    ├── 热门识别排行
    ├── 附近的人在听什么
    └── 音乐品味匹配
```

---

## 5. API 接口设计

### 5.1 接口规范

- **风格**: RESTful API
- **认证**: Bearer Token (JWT)
- **版本**: URL 路径版本 `/api/v1/`
- **编码**: UTF-8 JSON
- **分页**: `page` + `page_size`，返回 `total` + `items`
- **错误格式**: 统一 Error Response

```json
{
  "code": "RECOGNITION_FAILED",
  "message": "音频质量过低，无法识别",
  "detail": {
    "snr_db": -5.2,
    "min_required_db": 0
  }
}
```

### 5.2 核心 API 列表

#### 认证模块

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/refresh` | 刷新 Token |
| POST | `/api/v1/auth/logout` | 退出登录 |

#### 识别模块

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/recognize/record` | 提交录音识别（multipart） |
| POST | `/api/v1/recognize/upload` | 上传文件识别（multipart） |
| GET | `/api/v1/recognize/{task_id}` | 查询异步识别结果 |
| GET | `/api/v1/recognize/history` | 获取识别历史 |
| DELETE | `/api/v1/recognize/history/{id}` | 删除识别记录 |

#### 推荐模块

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/recommend/daily` | 每日推荐歌单 |
| GET | `/api/v1/recommend/similar/{song_id}` | 相似歌曲推荐 |
| GET | `/api/v1/recommend/new` | 新歌推荐 |
| POST | `/api/v1/recommend/feedback` | 推荐反馈（曝光/点击/跳过） |

#### 音乐库模块

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/songs/{id}` | 获取歌曲详情 |
| GET | `/api/v1/songs/search` | 搜索歌曲 |
| GET | `/api/v1/artists/{id}` | 获取艺人详情 |
| GET | `/api/v1/albums/{id}` | 获取专辑详情 |
| GET | `/api/v1/playlists` | 获取用户歌单列表 |
| POST | `/api/v1/playlists` | 创建歌单 |
| POST | `/api/v1/playlists/{id}/songs` | 向歌单添加歌曲 |
| GET | `/api/v1/collections` | 获取收藏列表 |
| POST | `/api/v1/collections` | 添加收藏 |
| DELETE | `/api/v1/collections/{song_id}` | 取消收藏 |

#### 用户模块

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/users/me` | 获取当前用户信息 |
| PUT | `/api/v1/users/me` | 更新用户信息 |
| GET | `/api/v1/users/me/preferences` | 获取偏好设置 |
| PUT | `/api/v1/users/me/preferences` | 更新偏好设置 |

### 5.3 关键接口详细设计

#### 提交录音识别

```
POST /api/v1/recognize/record
Content-Type: multipart/form-data
Authorization: Bearer <token>

Parameters:
  audio:    (required, binary) 音频文件，支持 wav/mp3/aac/flac，最大 15MB
  duration: (optional, float)  录音时长（秒）
  lat:      (optional, float)  纬度
  lng:      (optional, float)  经度

Response 200:
{
  "task_id": "rec_abc123",
  "status": "processing",
  "estimated_time": 2.5
}

Response 202 (异步处理中):
{
  "task_id": "rec_abc123",
  "status": "processing",
  "poll_url": "/api/v1/recognize/rec_abc123"
}
```

#### 识别结果查询

```
GET /api/v1/recognize/{task_id}
Authorization: Bearer <token>

Response 200 (识别成功):
{
  "task_id": "rec_abc123",
  "status": "completed",
  "result": {
    "song": {
      "id": "song_001",
      "title": "晴天",
      "artists": [{"id": "art_001", "name": "周杰伦"}],
      "album": {"id": "alb_001", "name": "叶惠美", "cover_url": "..."},
      "duration": 269,
      "genre": "流行",
      "release_date": "2003-07-31"
    },
    "confidence": 0.97,
    "match_type": "fingerprint",
    "offset_ms": 45000
  }
}

Response 200 (未识别):
{
  "task_id": "rec_abc123",
  "status": "completed",
  "result": null,
  "message": "未找到匹配歌曲，建议在安静环境中重新录制"
}
```

#### 每日推荐

```
GET /api/v1/recommend/daily?page=1&page_size=20
Authorization: Bearer <token>

Response 200:
{
  "total": 30,
  "items": [
    {
      "song": {
        "id": "song_001",
        "title": "晴天",
        "artists": [{"id": "art_001", "name": "周杰伦"}],
        "album": {"cover_url": "..."},
        "duration": 269
      },
      "reason": "基于你喜欢的《七里香》推荐",
      "reason_type": "item_cf",
      "confidence": 0.85
    }
  ],
  "refreshed_at": "2026-04-29T08:00:00Z"
}
```

---

## 6. 数据库设计

### 6.1 ER 关系概览

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
     │
     │          ┌──────────────┐
     ├─────────<│  follow_     │
     │          │   relations  │
     │          └──────────────┘
     │
     │          ┌──────────────┐
     └─────────<│  listen_     │
                │   history    │
                └──────────────┘
```

### 6.2 核心表结构

#### users — 用户表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 用户 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱 |
| phone | VARCHAR(20) | UNIQUE | 手机号 |
| nickname | VARCHAR(50) | NOT NULL | 昵称 |
| avatar_url | VARCHAR(500) | | 头像 URL |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| status | VARCHAR(20) | DEFAULT 'active' | 状态 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

#### songs — 歌曲表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 歌曲 ID |
| title | VARCHAR(200) | NOT NULL | 歌曲名 |
| artist_id | UUID | FK → artists.id | 主艺人 ID |
| album_id | UUID | FK → albums.id | 专辑 ID |
| duration | INTEGER | | 时长（秒） |
| genre | VARCHAR(50) | | 流派 |
| language | VARCHAR(20) | | 语言 |
| release_date | DATE | | 发行日期 |
| isrc | VARCHAR(15) | UNIQUE | 国际标准录音代码 |
| fingerprint_hash | VARCHAR(64) | INDEX | Chromaprint 指纹哈希 |
| feature_vector | VECTOR(128) | | 深度特征向量（Milvus 同步） |
| audio_file_key | VARCHAR(500) | | MinIO 对象键 |
| cover_url | VARCHAR(500) | | 封面图 URL |
| status | VARCHAR(20) | DEFAULT 'active' | 状态 |
| created_at | TIMESTAMP | DEFAULT NOW() | 入库时间 |

#### recognize_records — 识别记录表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 记录 ID |
| user_id | UUID | FK → users.id | 用户 ID |
| song_id | UUID | FK → songs.id, NULLABLE | 识别出的歌曲（NULL=未识别） |
| confidence | DECIMAL(5,4) | | 置信度（0~1） |
| match_type | VARCHAR(20) | | 匹配方式（fingerprint/vector/hybrid） |
| offset_ms | INTEGER | | 匹配偏移（毫秒） |
| audio_duration | DECIMAL(6,2) | | 提交音频时长（秒） |
| latitude | DECIMAL(9,6) | | 纬度 |
| longitude | DECIMAL(9,6) | | 经度 |
| note | TEXT | | 用户备注 |
| created_at | TIMESTAMP | DEFAULT NOW() | 识别时间 |

#### playlists — 歌单表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 歌单 ID |
| user_id | UUID | FK → users.id | 创建者 |
| name | VARCHAR(100) | NOT NULL | 歌单名 |
| description | TEXT | | 描述 |
| cover_url | VARCHAR(500) | | 封面 |
| is_public | BOOLEAN | DEFAULT true | 是否公开 |
| type | VARCHAR(20) | DEFAULT 'custom' | 类型（custom/smart/system） |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

#### playlist_songs — 歌单-歌曲关联表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | ID |
| playlist_id | UUID | FK → playlists.id | 歌单 ID |
| song_id | UUID | FK → songs.id | 歌曲 ID |
| position | INTEGER | | 排序位置 |
| added_at | TIMESTAMP | DEFAULT NOW() | 添加时间 |

#### collections — 收藏表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | ID |
| user_id | UUID | FK → users.id | 用户 ID |
| target_type | VARCHAR(20) | NOT NULL | 目标类型（song/artist/album） |
| target_id | UUID | NOT NULL | 目标 ID |
| created_at | TIMESTAMP | DEFAULT NOW() | 收藏时间 |

#### listen_history — 播放历史表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | ID |
| user_id | UUID | FK → users.id | 用户 ID |
| song_id | UUID | FK → songs.id | 歌曲 ID |
| play_duration | INTEGER | | 播放时长（秒） |
| song_duration | INTEGER | | 歌曲总时长（秒） |
| source | VARCHAR(30) | | 来源（recognize/recommend/search/playlist） |
| played_at | TIMESTAMP | DEFAULT NOW() | 播放时间 |

#### artists — 艺人表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 艺人 ID |
| name | VARCHAR(100) | NOT NULL | 艺人名 |
| avatar_url | VARCHAR(500) | | 头像 |
| genre | VARCHAR(50) | | 主要流派 |
| country | VARCHAR(50) | | 国家/地区 |
| bio | TEXT | | 简介 |
| created_at | TIMESTAMP | DEFAULT NOW() | 入库时间 |

#### albums — 专辑表

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | UUID | PK | 专辑 ID |
| title | VARCHAR(200) | NOT NULL | 专辑名 |
| artist_id | UUID | FK → artists.id | 主艺人 |
| cover_url | VARCHAR(500) | | 封面 |
| release_date | DATE | | 发行日期 |
| type | VARCHAR(20) | | 类型（album/single/ep） |
| created_at | TIMESTAMP | DEFAULT NOW() | 入库时间 |

### 6.3 索引策略

```sql
-- 识别记录：按用户+时间查询
CREATE INDEX idx_recognize_user_time ON recognize_records(user_id, created_at DESC);

-- 歌曲搜索：标题模糊查询
CREATE INDEX idx_songs_title_trgm ON songs USING gin(title gin_trgm_ops);

-- 收藏：用户+类型联合查询
CREATE INDEX idx_collections_user_type ON collections(user_id, target_type);

-- 播放历史：用户+时间
CREATE INDEX idx_listen_user_time ON listen_history(user_id, played_at DESC);

-- 指纹哈希：精确匹配
CREATE INDEX idx_songs_fingerprint ON songs(fingerprint_hash);
```

### 6.4 Redis 缓存设计

| Key 模式 | TTL | 用途 |
|----------|-----|------|
| `user:session:{user_id}` | 7d | 用户会话信息 |
| `recognize:task:{task_id}` | 1h | 异步识别任务状态 |
| `recommend:daily:{user_id}` | 8h | 每日推荐缓存 |
| `song:detail:{song_id}` | 24h | 歌曲详情缓存 |
| `search:suggest:{prefix}` | 10min | 搜索建议缓存 |
| `rate:limit:{ip}` | 1min | 限流计数器 |
| `fingerprint:lookup:{hash}` | 72h | 指纹查询热点缓存 |

---

## 7. AI 模型设计

### 7.1 音频指纹识别

#### 方案一：Chromaprint 指纹（主方案）

```
输入音频 → 重采样(16kHz) → Chromaprint编码 → 32字节指纹哈希
                                                  ↓
                                        PostgreSQL 精确/模糊匹配
```

- **工具**: `fpcalc` (Chromaprint CLI) 或 `pyacoustid`
- **匹配**: 汉明距离 ≤ 阈值 → 认为匹配
- **优点**: 速度快、成熟稳定、存储小
- **缺点**: 对变调/变速鲁棒性差

#### 方案二：深度特征向量（补充方案）

```
输入音频 → 重采样(22kHz) → 频谱图 → CNN Encoder → 128维向量
                                                        ↓
                                              Milvus ANN 近邻检索
```

- **模型**: 基于 VGGish / PANNs 预训练，微调编码器
- **匹配**: 余弦相似度 Top-K → 阈值过滤
- **优点**: 对噪声、变速、翻唱更鲁棒
- **缺点**: 计算成本高，需要 GPU

#### 融合策略

```
并发执行:
├── Chromaprint 匹配 → 候选集 A（高精度）
├── 向量 ANN 检索 → 候选集 B（高召回）
└── 合并:
    ├── A ∩ B → 置信度 × 1.2
    ├── A - B → 置信度 × 1.0
    └── B - A → 置信度 × 0.8
    → 按调整后置信度排序，取 Top 1
```

### 7.2 推荐模型

#### 冷启动阶段（数据不足）

| 策略 | 实现方式 |
|------|----------|
| 热门推荐 | 全局/分类热门歌曲排行 |
| 基于标签推荐 | 用户注册时选择偏好标签 → 匹配歌曲标签 |
| 基于识别推荐 | 根据识别历史中的歌曲特征推荐相似曲目 |

#### 成熟阶段（数据充足）

| 策略 | 算法 | 描述 |
|------|------|------|
| 协同过滤 | Item-CF | 基于歌曲共现关系推荐 |
| 内容推荐 | 音频特征向量近邻 | 基于歌曲音频特征相似度 |
| 深度推荐 | Wide & Deep | 结合记忆（Wide）与泛化（Deep） |
| 序列推荐 | SASRec | 基于用户播放序列预测下一首 |

#### 推荐服务架构

```
用户请求推荐
    │
    ▼
┌──────────────────────┐
│   推荐网关 (Gateway)  │
│  多路召回 → 融合排序   │
└──────────┬───────────┘
           │
    ┌──────┼──────┐
    ▼      ▼      ▼
 召回层   排序层   重排层
    │      │      │
    │      │    ┌─┴──────────┐
    │      │    │ 去重过滤    │
    │      │    │ 多样性保证   │
    │      │    │ 业务规则     │
    │      │    └────────────┘
    │    ┌─┴──────────┐
    │    │ CTR预估模型  │
    │    │ 精排打分     │
    │    └────────────┘
  ┌─┴──────────────────┐
  │ Item-CF 召回        │
  │ 向量近邻召回         │
  │ 热门召回            │
  │ 新歌召回            │
  └────────────────────┘
```

---

## 8. 前端设计

### 8.1 页面结构

```
App
├── / (首页)
│   ├── 识别按钮（核心入口，居中大按钮）
│   ├── 每日推荐
│   └── 最近识别
├── /recognize
│   ├── 录音界面（波形可视化）
│   ├── 识别结果展示
│   └── 识别历史列表
├── /discover
│   ├── 推荐歌单
│   ├── 新歌速递
│   ├── 排行榜
│   └── 风格探索
├── /library
│   ├── 我的收藏
│   ├── 我的歌单
│   └── 播放历史
├── /search
│   ├── 搜索框
│   ├── 搜索建议
│   └── 搜索结果（歌曲/艺人/专辑 Tab）
├── /profile
│   ├── 个人信息
│   ├── 偏好设置
│   └── 账号安全
└── /song/{id}
    ├── 歌曲详情
    ├── 相似推荐
    └── 评论
```

### 8.2 核心交互流程

#### 识别流程

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 点击识别 │───>│ 录音中... │───>│  分析中  │───>│ 识别结果 │
│  按钮   │    │ 波形动画  │    │  加载动画 │    │ 歌曲信息 │
└─────────┘    └──────────┘    └──────────┘    └──────────┘
     │                               │               │
     │       用户可随时停止            │    异步轮询    │ 收藏/分享
     │                               │    /WebSocket │ /听相似
     ▼                               ▼               ▼
  请求麦克风权限              上传音频到后端        操作按钮
```

### 8.3 前端性能策略

| 策略 | 实现 |
|------|------|
| 路由懒加载 | `React.lazy()` + `Suspense` |
| 列表虚拟化 | `@tanstack/virtual` 处理长列表 |
| 音频流式上传 | 录音过程中分片上传，减少等待 |
| 图片懒加载 | `loading="lazy"` + 渐进式加载 |
| 请求缓存 | TanStack Query `staleTime` 策略 |
| 骨架屏 | 所有列表/卡片页首屏使用骨架屏 |
| Service Worker | 离线缓存静态资源，支持 PWA |

---

## 9. 项目结构

### 9.1 后端目录结构

```
soundspot-server/
├── alembic/                    # 数据库迁移
│   ├── versions/
│   └── env.py
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 入口
│   ├── config.py               # 配置管理
│   ├── dependencies.py         # 依赖注入
│   │
│   ├── auth/                   # 认证模块
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── schemas.py
│   │   └── utils.py
│   │
│   ├── users/                  # 用户模块
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── schemas.py
│   │   └── models.py
│   │
│   ├── recognize/              # 识别模块
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── schemas.py
│   │   ├── models.py
│   │   ├── fingerprint.py      # 指纹提取
│   │   ├── matching.py         # 指纹匹配
│   │   └── tasks.py            # Celery 异步任务
│   │
│   ├── recommend/              # 推荐模块
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── schemas.py
│   │   ├── recall.py           # 召回策略
│   │   ├── ranking.py          # 排序模型
│   │   └── rerank.py           # 重排逻辑
│   │
│   ├── music/                  # 音乐库模块
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── schemas.py
│   │   └── models.py
│   │
│   └── common/                 # 公共模块
│       ├── database.py         # 数据库连接
│       ├── redis.py            # Redis 连接
│       ├── minio.py            # MinIO 客户端
│       ├── milvus.py           # Milvus 客户端
│       ├── exceptions.py       # 自定义异常
│       ├── middleware.py       # 中间件
│       └── logger.py           # 日志配置
│
├── ml/                         # 机器学习模块
│   ├── encoder/                # 音频编码器
│   │   ├── model.py
│   │   ├── train.py
│   │   └── inference.py
│   ├── recommender/            # 推荐模型
│   │   ├── collaborative.py
│   │   ├── content_based.py
│   │   └── deep_model.py
│   └── feature/                # 特征工程
│       ├── audio_features.py
│       └── user_features.py
│
├── tests/                      # 测试
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_recognize.py
│   └── test_recommend.py
│
├── docker/                     # Docker 配置
│   ├── Dockerfile
│   └── Dockerfile.celery
│
├── docker-compose.yml
├── pyproject.toml
├── requirements.txt
└── README.md
```

### 9.2 前端目录结构

```
soundspot-web/
├── public/
│   ├── favicon.ico
│   └── manifest.json           # PWA 配置
├── src/
│   ├── main.tsx                # 入口
│   ├── App.tsx                 # 根组件
│   ├── vite-env.d.ts
│   │
│   ├── api/                    # API 层
│   │   ├── client.ts           # Axios 实例 + 拦截器
│   │   ├── auth.ts
│   │   ├── recognize.ts
│   │   ├── recommend.ts
│   │   ├── music.ts
│   │   └── user.ts
│   │
│   ├── components/             # 通用组件
│   │   ├── ui/                 # Shadcn 组件
│   │   ├── AudioRecorder.tsx
│   │   ├── WaveformVisualizer.tsx
│   │   ├── SongCard.tsx
│   │   ├── ArtistCard.tsx
│   │   ├── PlaylistCard.tsx
│   │   ├── SearchBar.tsx
│   │   └── LoadingSkeleton.tsx
│   │
│   ├── pages/                  # 页面组件
│   │   ├── Home.tsx
│   │   ├── Recognize.tsx
│   │   ├── Discover.tsx
│   │   ├── Library.tsx
│   │   ├── Search.tsx
│   │   ├── Profile.tsx
│   │   └── SongDetail.tsx
│   │
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useAudioRecorder.ts
│   │   ├── useRecognition.ts
│   │   └── useInfiniteScroll.ts
│   │
│   ├── stores/                 # Zustand Store
│   │   ├── authStore.ts
│   │   ├── playerStore.ts
│   │   └── recognizeStore.ts
│   │
│   ├── lib/                    # 工具函数
│   │   ├── audio.ts
│   │   ├── format.ts
│   │   └── constants.ts
│   │
│   └── styles/
│       └── globals.css
│
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

---

## 10. 开发计划

### 10.1 里程碑总览

```
Phase 1: MVP          Phase 2: 核心         Phase 3: 智能化       Phase 4: 社交化
(4 周)                (4 周)                (4 周)                (3 周)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
用户系统 ✓            歌单系统 ✓             推荐引擎 ✓             社交功能 ✓
基础识别 ✓            收藏/历史 ✓            深度模型 ✓             分享功能 ✓
简单搜索 ✓            高级搜索 ✓             A/B 实验 ✓             动态 Feed ✓
                                            冷启动方案 ✓
```

### 10.2 详细排期

#### Phase 1: MVP（第 1-4 周）

| 周 | 任务 | 交付物 |
|----|------|--------|
| W1 | 项目初始化、数据库设计、CI/CD 搭建 | 可运行的空项目框架 |
| W1 | 前端脚手架、路由、UI 基础组件 | 前端开发环境 |
| W2 | 用户注册/登录、JWT 认证 | 认证接口 + 登录页 |
| W2 | 录音组件、音频上传接口 | 录音功能 |
| W3 | Chromaprint 指纹提取与匹配 | 识别核心逻辑 |
| W3 | 识别结果页、历史记录 | 识别功能闭环 |
| W4 | 歌曲搜索、基础歌曲详情页 | 搜索功能 |
| W4 | 前后端联调、Bug 修复 | MVP 可演示版本 |

#### Phase 2: 核心功能（第 5-8 周）

| 周 | 任务 | 交付物 |
|----|------|--------|
| W5 | 歌单 CRUD、歌单详情页 | 歌单功能 |
| W5 | 收藏/取消收藏、收藏列表页 | 收藏功能 |
| W6 | 播放历史记录、最近播放页 | 历史功能 |
| W6 | 搜索建议、搜索结果分类 | 高级搜索 |
| W7 | 向量检索集成、Milvus 部署 | 向量检索能力 |
| W7 | 深度特征提取 Pipeline | 音频特征向量 |
| W8 | 融合识别策略、识别准确率优化 | 增强版识别 |
| W8 | 性能优化、压力测试 | 性能报告 |

#### Phase 3: 智能化（第 9-12 周）

| 周 | 任务 | 交付物 |
|----|------|--------|
| W9 | 推荐引擎基础框架、召回层 | 推荐框架 |
| W9 | 协同过滤算法实现 | Item-CF 推荐 |
| W10 | 内容推荐（向量近邻）、排序模型 | 混合推荐 |
| W10 | 每日推荐、相似推荐 API + 页面 | 推荐功能闭环 |
| W11 | 推荐反馈追踪、A/B 实验框架 | 实验能力 |
| W11 | 冷启动推荐策略 | 新用户推荐 |
| W12 | 推荐效果评估、模型调优 | 推荐评估报告 |
| W12 | 深度推荐模型训练（Wide & Deep） | 深度模型上线 |

#### Phase 4: 社交化（第 13-15 周）

| 周 | 任务 | 交付物 |
|----|------|--------|
| W13 | 分享功能、外部分享链接 | 分享功能 |
| W13 | 关注/粉丝、用户主页 | 社交关系 |
| W14 | 动态 Feed、评论/点赞 | Feed 流 |
| W14 | 热门识别排行、发现页 | 发现功能 |
| W15 | 全功能集成测试、性能调优 | Beta 版本 |
| W15 | 文档完善、部署上线 | 正式上线 |

---

## 11. 部署方案

### 11.1 开发环境 Docker Compose

```yaml
# docker-compose.dev.yml
services:
  backend:
    build: ./soundspot-server
    ports: ["8000:8000"]
    volumes: ["./soundspot-server:/app"]
    environment:
      - DATABASE_URL=postgresql://dev:dev@postgres:5432/soundspot
      - REDIS_URL=redis://redis:6379/0
      - MINIO_ENDPOINT=minio:9000
    depends_on: [postgres, redis, minio]

  celery-worker:
    build: ./soundspot-server
    command: celery -A app.celery worker -l info
    depends_on: [rabbitmq, postgres, redis]

  frontend:
    build: ./soundspot-web
    ports: ["3000:3000"]
    volumes: ["./soundspot-web/src:/app/src"]

  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: soundspot
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  rabbitmq:
    image: rabbitmq:3-management
    ports: ["5672:5672", "15672:15672"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin

  milvus:
    image: milvusdb/milvus:v2.3-latest
    ports: ["19530:19530"]
```

### 11.2 生产环境架构

```
                    ┌─────────────────┐
                    │   CloudFlare    │
                    │  CDN + WAF      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Load Balancer  │
                    │  (Nginx)        │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Backend  │  │ Backend  │  │  Celery   │
        │  Pod ×2  │  │  Pod ×2  │  │  Worker   │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │              │              │
     ┌───────┼──────────────┼──────────────┘
     ▼       ▼              ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ PG 主库  │ │ Redis   │ │ MinIO   │
│ + 只读   │ │ Cluster │ │ Cluster │
│  副本    │ │         │ │         │
└─────────┘ └─────────┘ └─────────┘
```

### 11.3 服务器配置建议（初期）

| 服务 | 配置 | 数量 | 说明 |
|------|------|------|------|
| 应用服务器 | 4C8G | 2 | 后端 API |
| Celery Worker | 4C8G | 1 | 异步任务（含音频处理） |
| GPU Worker | T4 16G | 1 | 向量提取/模型推理 |
| PostgreSQL | 4C16G | 1 | 主库（RDS 托管） |
| Redis | 4C8G | 1 | 缓存（RDS 托管） |
| Milvus | 8C32G | 1 | 向量检索 |
| MinIO | 4C8G + 500G SSD | 1 | 音频文件存储 |
| Nginx | 2C4G | 1 | 负载均衡 |

---

## 12. 测试策略

### 12.1 测试金字塔

```
           ┌─────────────┐
           │   E2E 测试   │   ← 少量，关键流程
           │ (Playwright) │
           ├─────────────┤
           │  集成测试     │   ← 适量，API + DB
           │  (Pytest)    │
           ├─────────────┤
           │  单元测试     │   ← 大量，纯逻辑
           │ (Pytest +    │
           │  Vitest)     │
           └─────────────┘
```

### 12.2 关键测试项

| 类别 | 测试项 | 工具 |
|------|--------|------|
| 单元测试 | 指纹提取逻辑 | pytest |
| 单元测试 | 匹配算法正确性 | pytest |
| 单元测试 | 推荐召回策略 | pytest |
| 单元测试 | 前端组件渲染 | vitest + testing-library |
| 集成测试 | 识别 API 端到端 | pytest + httpx |
| 集成测试 | 推荐 API 端到端 | pytest + httpx |
| 集成测试 | 数据库迁移 | alembic |
| E2E 测试 | 录音→识别→收藏流程 | Playwright |
| E2E 测试 | 搜索→播放→推荐流程 | Playwright |
| 性能测试 | 识别接口 1000 QPS | Locust |
| 性能测试 | 向量检索延迟 < 100ms | 自定义脚本 |
| 准确性测试 | 识别准确率基准测试 | 标注数据集 |

### 12.3 识别准确率测试数据集

| 场景 | 样本数 | 预期准确率 |
|------|--------|-----------|
| 清晰环境 5s 片段 | 1000 | ≥ 98% |
| 清晰环境 3s 片段 | 1000 | ≥ 95% |
| 嘈杂环境 5s 片段 | 500 | ≥ 85% |
| 翻唱版本 | 200 | ≥ 60% |
| 背景音乐（低音量） | 300 | ≥ 70% |

---

## 13. 风险评估与应对

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|----------|
| 音乐版权问题 | 高 | 高 | 初期仅存储指纹/特征，不提供播放；接入正版音乐 API |
| 识别准确率不达标 | 中 | 高 | 多策略融合 + 持续优化模型；设定最低可接受阈值 |
| 推荐冷启动问题 | 高 | 中 | 基于标签 + 热门 + 识别历史的组合策略 |
| 音频数据库规模不足 | 高 | 高 | 接入第三方音乐元数据 API 补充；渐进式扩充 |
| 高并发压力 | 中 | 中 | 识别任务异步化 + 队列削峰 + 水平扩容 |
| 用户隐私合规 | 中 | 高 | 音频处理完即删除原始文件；匿名化推荐数据；遵循 GDPR |

---

## 附录

### A. 环境变量清单

```bash
# 应用
APP_ENV=development|production
APP_SECRET_KEY=<random-secret>
APP_DEBUG=true|false

# 数据库
DATABASE_URL=postgresql://user:pass@host:5432/soundspot
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://host:6379/0

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_AUDIO=audio-files

# Milvus
MILVUS_HOST=localhost
MILVUS_PORT=19530

# RabbitMQ
RABBITMQ_URL=amqp://user:pass@host:5672/

# JWT
JWT_SECRET_KEY=<random-secret>
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# 识别
FINGERPRINT_MATCH_THRESHOLD=5
VECTOR_SEARCH_TOP_K=10
VECTOR_SIMILARITY_THRESHOLD=0.85
MAX_AUDIO_FILE_SIZE_MB=15
```

### B. Git 分支策略

```
main (生产)
  │
  ├── develop (开发主线)
  │     │
  │     ├── feature/auth
  │     ├── feature/recognize
  │     ├── feature/recommend
  │     └── hotfix/fix-xxx
  │
  └── release/v1.0.0
```

- 功能分支从 `develop` 拉出，完成后 PR 合并回 `develop`
- 发布时从 `develop` 拉出 `release` 分支，测试通过后合并到 `main`
- 紧急修复从 `main` 拉出 `hotfix`，修复后同时合并到 `main` 和 `develop`

### C. Commit 规范

```
<type>(<scope>): <subject>

type:
  feat:     新功能
  fix:      Bug 修复
  docs:     文档变更
  style:    代码格式（不影响功能）
  refactor: 重构
  perf:     性能优化
  test:     测试
  chore:    构建/工具变更

示例:
  feat(recognize): 实现 Chromaprint 指纹匹配
  fix(auth): 修复 Token 刷新竞态条件
  docs(api): 补充识别接口文档
```

---

> **文档维护说明**: 本文档随项目开发持续更新。每次架构变更或重要决策后，需同步更新对应章节。

### 变更日志

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-04-29 | v1.0.0 | 初始版本，完整项目开发文档 |
