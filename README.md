# DuckStudy 学习平台

DuckStudy是一个基于前后端分离架构的学习平台，提供课程评价、二手市场、论坛、GitHub项目展示等功能。

## 项目结构

```
DuckStudy/
├── frontend/                # 前端项目目录
│   ├── css/                # 样式文件
│   │   ├── common.css      # 公共样式
│   │   ├── posts.css       # 论坛页面样式
│   │   ├── post-detail.css # 帖子详情页样式
│   │   ├── create-post.css # 发帖页面样式
│   │   └── projects.css    # 项目页面样式
│   ├── js/                 # JavaScript文件
│   │   ├── api.js          # API接口封装
│   │   ├── posts.js        # 论坛页面逻辑
│   │   ├── post-detail.js  # 帖子详情页逻辑
│   │   ├── create-post.js  # 发帖页面逻辑
│   │   └── projects.js     # 项目页面逻辑
│   ├── pages/              # 页面文件
│   │   ├── posts.html      # 论坛页面
│   │   ├── post-detail.html # 帖子详情页
│   │   ├── create-post.html # 发帖页面
│   │   ├── login.html      # 登录页面
│   │   ├── register.html   # 注册页面
│   │   └── projects.html   # 项目展示页面
│   ├── data/               # 数据文件
│   │   ├── posts.json      # 帖子数据
│   │   ├── comments.json   # 评论数据
│   │   └── users.json      # 用户数据
│   ├── images/             # 图片资源
│   └── index.html          # 首页
├── backend/                # 后端项目目录
│   ├── app.py              # Flask应用主文件
│   ├── services/           # 服务层
│   │   ├── __init__.py     # 包初始化文件
│   │   └── github_service.py # GitHub服务
│   ├── utils/              # 工具类
│   │   ├── __init__.py     # 包初始化文件
│   │   └── cache.py        # 缓存工具
│   ├── config/             # 配置文件
│   │   └── config.py       # 配置信息
│   ├── __init__.py         # 后端包初始化
│   ├── .env                # 环境变量
│   └── requirements.txt    # Python依赖
└── README.md               # 项目说明文档
```

## 技术栈

- 前端：HTML5 + CSS3 + JavaScript（原生）
  - Bootstrap 5 用于页面布局和样式
  - Bootstrap Icons 用于图标显示
  - ES6 模块化开发
- 后端：Python + Flask
  - RESTful API 设计
  - 模拟数据存储（待实现数据库）
  - GitHub API 集成

## 已实现功能

1. 用户系统
   - 登录/注册界面
   - 用户状态管理
   - 个人中心入口

2. 论坛功能
   - 帖子列表展示
   - 帖子分类（学习交流、技术讨论、经验分享、问题求助、资源分享）
   - 发帖功能
   - 帖子详情页
   - 评论系统
   - 点赞功能
   - 标签系统

3. 项目展示功能
   - GitHub热门项目展示
   - 按时间范围筛选（全部时间、今年、本月、本周）
   - 项目详情查看（基本信息、统计信息、使用语言、贡献者）
   - 支持网格视图和列表视图切换
   - 链接到GitHub仓库

4. 界面特性
   - 响应式设计
   - 现代化UI
   - 用户友好的交互

## 待实现功能

1. 课程评价系统
2. 二手市场
3. 最近观看
4. 学习平台导航
5. 数据库集成

## 安装和运行

1. 安装Python依赖：
```bash
cd backend
pip install -r requirements.txt
```

2. 设置环境变量：
在`backend/.env`文件中配置以下内容：
```
GITHUB_TOKEN=your_github_token_here
FLASK_SECRET_KEY=your_secret_key_here
```

3. 运行后端服务：
```bash
python backend/app.py
```

4. 访问前端页面：
在浏览器中访问 `http://localhost:5000`

## 开发说明

- 前端采用原生JavaScript开发，使用ES6模块化
- 使用Bootstrap 5进行页面布局和样式设计
- 使用Bootstrap Icons提供图标支持
- 前后端通过API进行数据交互
- 目前使用模拟数据，后续将集成数据库
- GitHub项目展示功能支持离线模式（当API不可用时使用模拟数据）

## 注意事项

- 项目处于开发阶段，部分功能尚未实现
- 需要现代浏览器支持（支持ES6模块化）
- 建议使用Chrome、Firefox、Edge等现代浏览器访问
- 后端API目前使用模拟数据，后续需要连接真实数据库
- GitHub API有请求限制，建议配置个人访问令牌 