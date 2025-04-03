# DuckStudy 学习平台

DuckStudy是一个基于前后端分离架构的学习平台，提供课程评价、二手市场、论坛等功能。

## 项目结构

```
DuckStudy/
├── frontend/                # 前端项目目录
│   ├── css/                # 样式文件
│   │   ├── common.css      # 公共样式
│   │   ├── posts.css       # 论坛页面样式
│   │   ├── post-detail.css # 帖子详情页样式
│   │   └── create-post.css # 发帖页面样式
│   ├── js/                 # JavaScript文件
│   │   ├── api.js         # API接口封装
│   │   ├── posts.js       # 论坛页面逻辑
│   │   ├── post-detail.js # 帖子详情页逻辑
│   │   └── create-post.js # 发帖页面逻辑
│   ├── pages/             # 页面文件
│   │   ├── posts.html     # 论坛页面
│   │   ├── post-detail.html # 帖子详情页
│   │   └── create-post.html # 发帖页面
│   ├── images/            # 图片资源
│   └── index.html         # 首页
├── backend/               # 后端项目目录
│   ├── app.py            # Flask应用主文件
│   └── requirements.txt   # Python依赖
└── README.md             # 项目说明文档
```

## 技术栈

- 前端：HTML5 + CSS3 + JavaScript（原生）
  - Bootstrap 5 用于页面布局和样式
  - Bootstrap Icons 用于图标显示
  - ES6 模块化开发
- 后端：Python + Flask
  - RESTful API 设计
  - 模拟数据存储（待实现数据库）

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

3. 界面特性
   - 响应式设计
   - 现代化UI
   - 用户友好的交互

## 待实现功能

1. 课程评价系统
2. 二手市场
3. 最近观看
4. 热门项目
5. 学习平台导航
6. 数据库集成

## 安装和运行

1. 安装Python依赖：
```bash
cd backend
pip install -r requirements.txt
```

2. 运行后端服务：
```bash
python app.py
```

3. 访问前端页面：
直接在浏览器中打开 `frontend/index.html` 文件

## 开发说明

- 前端采用原生JavaScript开发，使用ES6模块化
- 使用Bootstrap 5进行页面布局和样式设计
- 使用Bootstrap Icons提供图标支持
- 前后端通过API进行数据交互
- 目前使用模拟数据，后续将集成数据库

## 注意事项

- 项目处于开发阶段，部分功能尚未实现
- 需要现代浏览器支持（支持ES6模块化）
- 建议使用Chrome、Firefox、Edge等现代浏览器访问
- 后端API目前使用模拟数据，后续需要连接真实数据库 