# 🦆 DuckStudy - 综合学习社区平台

<div align="center">

一个功能完整的学生学习社区平台，提供论坛交流、学习资源导航、GitHub 项目展示等核心功能。

[项目特性](#-核心功能) • [API 文档](#-api-文档)

</div>

---

## 📋 项目简介

**DuckStudy** 是一个全栈学习社区平台，为学生和开发者提供知识分享、技术讨论、学习资源导航和开源项目探索的一站式社区环境。

**核心定位**：学生学习社区 + 学习资源导航 + GitHub 热门项目展示

---

## ✨ 核心功能

### 1. 📝 论坛发帖系统
- **富文本发帖**：集成 Quill 编辑器，支持格式化、列表、代码块等
- **多媒体支持**：支持上传多张帖子封面图片（JPG/PNG）
- **分类管理**：学习心得、学习方法、资源推荐等多个分类
- **互动功能**：点赞、收藏、浏览统计
- **编辑删除**：作者可编辑或删除自己的帖子

### 2. 💬 评论与回复系统
- **嵌套评论**：支持对评论进行多层回复
- **评论互动**：点赞、排序（按时间升/降序）
- **权限管理**：仅作者可删除自己的评论和回复
- **用户信息**：显示评论者头像和用户名

### 3. 👤 用户管理系统
- **账户认证**：注册、登录、登出
- **用户资料**：个人昵称、个人简介、头像上传
- **用户主页**：展示用户发表的帖子、收藏列表、浏览历史
- **权限体系**：管理员和普通用户角色区分

### 4. ⭐ GitHub 热门项目展示
- **实时数据爬取**：BeautifulSoup4 实时爬取 GitHub Trending 数据
- **灵活筛选**：按时间范围（今日/周/月/年/全部）、编程语言筛选
- **项目详情**：展示 Stars、Forks、语言、贡献者等信息
- **GitHub API 集成**：获取仓库详情、开发语言统计、贡献者列表

### 5. 🔗 学习资源导航
- **网站导航**：汇聚学习网站、技术文档、工具库等
- **分类导航**：学习平台、开发工具、文档资源等多个分类
- **快速访问**：卡片式展示，一键跳转

### 6. 📚 课程评价系统
- **星级评分**：支持 1-5 星级评分
- **评价内容**：撰写详细的课程评价文字
- **评价标签**：多个评价维度标签（内容充实、讲解清晰、作业适量等）
- **匿名评价**：支持匿名评价选项
- **评价统计**：展示总体评分、各星级占比、评价分布可视化
- **评价互动**：评价点赞和回复功能
- **数据持久化**：本地存储评价数据，支持离线查看

### 7. 🛒 二手交易市场
- **物品发布**：学生发布待售二手物品
- **物品展示**：分类展示、搜索筛选
- **价格管理**：灵活的价格设置和议价功能
- **物品详情**：包含图片、描述、联系方式等信息
- **交易管理**：标记已售、删除物品等操作

### 8. 📚 其他功能
- **浏览历史**：记录用户浏览过的帖子，支持删除
- **热门推荐**：首页展示热门帖子和热门项目

---

## 🛠️ 技术栈

### 前端技术
| 技术 | 版本 | 用途 |
|------|------|------|
| **HTML5** | - | 页面结构 |
| **CSS3** | - | 样式设计 |
| **JavaScript** | ES6+ | 交互逻辑 |
| **Bootstrap** | 5 | UI 组件库 |
| **Quill** | - | 富文本编辑器 |
| **Fetch API** | - | 网络请求 |

### 后端技术
| 技术 | 版本 | 用途 |
|------|------|------|
| **Python** | 3.8+ | 编程语言 |
| **Flask** | 3.0.2 | Web 框架 |
| **Flask-CORS** | 4.0.0 | 跨域资源共享 |
| **BeautifulSoup4** | 4.12.2 | 网页爬取解析 |
| **Requests** | 2.31.0 | HTTP 请求库 |

### 数据存储
- **JSON 文件存储**：用户数据、帖子内容、评论数据
- **本地文件系统**：用户头像、帖子配图存储

### 部署方案
- **容器化**：Docker + Docker Compose
- **Web 服务器**：Nginx
- **应用服务器**：Gunicorn

---

## 📁 项目结构

```
DuckStudy/
├── frontend/                      # 前端代码
│   ├── index.html                # 首页
│   ├── pages/                    # 功能页面
│   │   ├── posts.html           # 论坛主页
│   │   ├── post-detail.html     # 帖子详情页
│   │   ├── create-post.html     # 发帖页面
│   │   ├── courses.html         # 课程评价页
│   │   ├── market.html          # 二手市场页
│   │   ├── projects.html        # GitHub 项目页
│   │   ├── platforms.html       # 学习导航页
│   │   ├── profile.html         # 用户资料页
│   │   ├── favorites.html       # 收藏夹页面
│   │   ├── history.html         # 浏览历史页
│   │   ├── login.html           # 登录页
│   │   └── register.html        # 注册页
│   ├── js/                       # JavaScript 脚本 (672 lines API + 2000+ lines UI)
│   │   ├── api.js               # 统一 API 接口封装
│   │   ├── main.js              # 首页逻辑
│   │   ├── posts.js             # 论坛功能模块
│   │   ├── post-detail.js       # 帖子详情交互
│   │   ├── create-post.js       # 发帖功能
│   │   ├── projects.js          # GitHub 项目页面
│   │   ├── profile.js           # 用户资料管理
│   │   ├── courses.js           # 课程评价功能
│   │   └── nav-utils.js         # 导航栏工具函数
│   ├── css/                      # 样式文件
│   │   ├── common.css           # 全局样式
│   │   ├── main.css             # 主样式
│   │   ├── home.css             # 首页样式
│   │   ├── posts.css            # 论坛样式
│   │   ├── course-detail.css    # 课程详情样式
│   │   └── [各页面专属样式]
│   ├── data/                     # 数据文件 (JSON 格式)
│   │   ├── users.json           # 用户账户数据
│   │   ├── posts.json           # 论坛帖子数据
│   │   ├── comments.json        # 评论和回复数据
│   │   ├── courses.json         # 课程评价数据
│   │   └── [其他数据文件]
│   ├── images/                   # 图片资源
│   │   ├── avatars/             # 用户头像
│   │   ├── posts/               # 帖子配图
│   │   └── [其他图片]
│   └── lib/                      # 第三方库
│       ├── bootstrap/            # Bootstrap 5
│       ├── bootstrap-icons/      # Bootstrap 图标库
│       └── quill/                # Quill 编辑器
│
├── backend/                      # 后端代码 (~3000+ lines)
│   ├── app.py                   # Flask 应用主文件 (1291 lines, 31 个 API 路由)
│   ├── requirements.txt          # Python 依赖
│   ├── config/
│   │   └── config.py            # 配置管理 (GitHub API、速率限制等)
│   ├── routes/
│   │   ├── user_routes.py       # 用户相关路由 (头像上传)
│   │   └── upload_routes.py     # 通用文件上传路由
│   ├── services/
│   │   └── github_service.py    # GitHub API 服务 (971 lines)
│   │       ├── 获取用户仓库
│   │       ├── 获取 Trending 项目
│   │       ├── 获取仓库详情和语言统计
│   │       └── 速率限制检查
│   ├── utils/
│   │   └── cache.py             # 缓存实现 (避免重复 API 调用)
│   └── .env                     # 环境变量配置 (GitHub Token 等)
│
├── scripts/                      # 脚本文件
│   ├── backup.sh                # 数据备份脚本
│   └── health_check.sh          # 健康检查脚本
│
├── tests/                        # 测试代码
│   ├── backend/                 # 后端单元测试
│   │   ├── test_user_auth.py   # 用户认证测试
│   │   ├── test_post.py        # 帖子功能测试
│   │   └── test_comment.py     # 评论功能测试
│   └── frontend/                # 前端单元测试 (Jest)
│       ├── api/                 # API 测试
│       └── components/          # 组件测试
│
├── docker-compose.yml           # Docker 容器编排
├── Dockerfile                   # Docker 镜像配置
├── nginx.conf                   # Nginx 配置
├── gunicorn.conf.py             # Gunicorn 配置
├── babel.config.js              # Babel 配置 (转译 JavaScript)
├── jest.config.js               # Jest 测试配置
├── package.json                 # 前端依赖配置
└── README.md                    # 项目文档
```

---

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Node.js 14+（可选，前端无依赖）

### 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/DuckStudyGroup/DuckStudy.git
cd DuckStudy
```

#### 2. 安装 Python 依赖
```bash
cd backend
pip install -r requirements.txt
```

#### 3. 配置环境变量
```bash
# 创建 .env 文件
touch .env

# 编辑 .env 文件，添加以下配置（可选）
GITHUB_TOKEN=your_github_token_here
FLASK_SECRET_KEY=your_secret_key
```

> 💡 **提示**：如果没有 GitHub Token，API 调用会受到限制（60 requests/hour）。获取 Token：[GitHub Settings](https://github.com/settings/tokens)

#### 4. 启动应用

**方式一：本地开发**
```bash
python app.py
# 访问 http://localhost:5000
```

**方式二：使用 Docker（推荐）**
```bash
docker-compose up -d
# 访问 http://localhost:5000
```

---

## 📡 API 文档

### 用户管理 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/user/status` | 获取当前用户登录状态 |
| POST | `/api/user/login` | 用户登录 |
| POST | `/api/user/register` | 用户注册 |
| POST | `/api/user/logout` | 用户登出 |
| POST | `/api/user/update` | 更新用户信息 |
| GET | `/api/user/profile/<username>` | 获取用户资料 |
| POST | `/api/upload-avatar` | 上传用户头像 |

### 帖子管理 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/posts` | 获取所有帖子 |
| POST | `/api/posts` | 创建新帖子 |
| GET | `/api/posts/<id>` | 获取帖子详情 |
| PUT | `/api/posts/<id>` | 编辑帖子 |
| DELETE | `/api/posts/<id>` | 删除帖子 |
| GET | `/api/posts/hot` | 获取热门帖子 |

### 评论管理 API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/comments/<post_id>` | 获取帖子评论 |
| POST | `/api/comments/<post_id>` | 发表评论 |
| PUT | `/api/comments/<post_id>/<comment_id>` | 更新评论（含回复） |
| DELETE | `/api/comments/<post_id>/<comment_id>` | 删除评论 |
| DELETE | `/api/comments/<post_id>/<comment_id>/replies/<reply_id>` | 删除回复 |

### GitHub API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/github/trending` | 获取 GitHub Trending 项目 |
| GET | `/api/github/repo/<owner>/<repo>` | 获取仓库详情 |
| GET | `/api/github/user/<username>/repos` | 获取用户仓库列表 |
| GET | `/api/github/rate-limit` | 获取 API 速率限制信息 |

### 文件上传 API

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/upload-image` | 上传图片（帖子配图） |
| POST | `/api/upload-avatar` | 上传用户头像 |

---

## 🧪 测试

### 前端测试
```bash
npm test              # 运行前端单元测试
npm run test:coverage # 生成覆盖率报告
```

### 后端测试
```bash
pytest tests/backend/  # 运行后端单元测试
```

---

## 📊 项目统计

- **后端代码**：~3000+ 行 Python
- **前端代码**：~2000+ 行 JavaScript
- **API 端点**：31 个
- **前端页面**：16 个 HTML 页面
- **数据模型**：用户、帖子、评论、课程评价

---

## 🎯 核心亮点

✅ **完整的全栈实现** - 从前端 UI 到后端 API 的完整功能链路  
✅ **丰富的交互功能** - 点赞、收藏、评论、回复等社交功能  
✅ **GitHub 集成** - 实时爬取热门项目，展示开源生态  
✅ **用户认证体系** - 注册、登录、权限控制  
✅ **富文本支持** - Quill 编辑器支持格式化文本和代码块  
✅ **多媒体支持** - 上传头像和帖子配图  
✅ **容器化部署** - Docker + Nginx + Gunicorn 生产部署方案  
✅ **代码质量** - 包含单元测试、错误处理、代码注释

---

## 📝 数据模型

### 用户 (User)
```javascript
{
  "id": number,
  "username": string,
  "password": string,
  "email": string,
  "avatar": string,
  "nickname": string,
  "bio": string,
  "role": "user" | "admin",
  "registerDate": string
}
```

### 帖子 (Post)
```javascript
{
  "id": number,
  "title": string,
  "content": string,
  "author": string,
  "authorAvatar": string,
  "category": "study" | "experience" | "resource",
  "tags": string[],
  "coverImages": string[],
  "likes": number,
  "favorites": number,
  "views": number,
  "likedBy": string[],
  "favoritedBy": string[],
  "date": string
}
```

### 评论 (Comment)
```javascript
{
  "id": number,
  "author": string,
  "authorAvatar": string,
  "content": string,
  "likes": number,
  "likedBy": string[],
  "timestamp": number,
  "replies": [{
    "id": number,
    "author": string,
    "content": string,
    "likes": number,
    "timestamp": number
  }]
}
```

---

## 🔐 安全特性

- 用户权限校验：删除评论和回复时检查所有权
- 文件类型限制：仅允许上传指定的图片格式（JPG/PNG/GIF/WebP）
- CORS 配置：安全的跨域资源共享设置
- 会话管理：Flask Session 实现用户登录状态管理

---

## 🚧 未来改进方向

- [ ] 数据库集成（SQLite/PostgreSQL 替代 JSON 存储）
- [ ] 用户密码加密存储（bcrypt/argon2）
- [ ] 实时通知系统
- [ ] 全文搜索功能
- [ ] 用户关注和粉丝系统
- [ ] 点赞/评论消息通知
- [ ] 评论审核系统
- [ ] 用户封禁管理

---

## 📄 许可证

MIT License

---

## 👨‍💻 开发者

**DuckStudy Group**

欢迎 Star ⭐ 和 Fork 🍴
