# DuckStudy - 综合学习平台

## 项目简介
DuckStudy 是一个综合学习平台，提供学习导航、论坛交流、二手交易和热门 GitHub 项目展示等功能。平台采用现代化的设计，提供流畅的用户体验。

## 功能特点
- 多站点导航（学习网站、工具网站）
- 用户论坛
  - 支持富文本编辑
  - 图片上传（最多3张封面图）
  - 评论和回复功能
  - 点赞和收藏功能
- 课程评价系统
  - 星级评分（1-5星）
  - 评价标签（内容充实、讲解清晰、作业适量等）
  - 匿名评价选项
  - 评价统计和可视化
  - 评价点赞和回复功能
- 二手交易市场
- GitHub 热门项目展示
  - 实时获取 GitHub Trending 页面数据
  - 支持多种时间范围筛选（今日、本周、本月、今年、全部时间）
  - 展示实时 Star 增长数据

## 技术栈
- 前端：
  - HTML5/CSS3
  - Vanilla JavaScript (ES6+)
  - Bootstrap 5
  - Quill 富文本编辑器
- 后端：
  - Python 3.8+
  - Flask
  - BeautifulSoup4
- 数据存储：
  - JSON 文件存储
  - 图片文件存储

## 快速开始

### 环境要求
- Python 3.8+
- Node.js 14+
- Git

### 安装步骤
1. 克隆项目
```bash
git clone https://github.com/yourusername/DuckStudy.git
cd DuckStudy
```

2. 安装 Python 依赖
```bash
pip install -r backend/requirements.txt
```

3. 配置环境变量
```bash
# 在项目根目录创建 .env 文件
touch backend/.env

# 编辑 .env 文件，添加必要的配置
echo "GITHUB_TOKEN=your_token_here" > backend/.env
```

4. 启动服务
```bash
# 启动后端服务
python backend/app.py

# 在浏览器中访问
http://localhost:5000
```

## 项目结构
```
DuckStudy/
├── frontend/           # 前端代码
│   ├── css/           # 样式文件
│   ├── js/            # JavaScript 文件
│   ├── pages/         # 主要页面
│   ├── html/          # 其他页面（登录、注册等）
│   ├── images/        # 图片资源
│   │   ├── posts/     # 帖子图片
│   │   └── courses/   # 课程图片
│   ├── data/          # 数据文件（JSON）
│   ├── lib/           # 第三方库
│   └── index.html     # 网站首页
├── backend/           # 后端代码
│   ├── app.py         # Flask 应用主文件
│   ├── routes/        # 路由模块
│   ├── services/      # 服务模块
│   ├── utils/         # 工具模块
│   ├── config/        # 配置文件
│   ├── requirements.txt # Python 依赖
│   ├── .env           # 环境变量
│   └── __init__.py    # 包初始化文件
└── README.md          # 项目文档
```

## 功能详情

### 论坛功能
- 帖子发布
  - 支持富文本编辑
  - 最多上传3张封面图片
  - 支持标签分类
- 帖子展示
  - 响应式布局
  - 图片轮播展示
  - 点赞和收藏功能
- 评论系统
  - 支持多级评论
  - 评论图片上传
  - 评论点赞功能

### 课程评价系统
- 评价功能
  - 星级评分（1-5星）
  - 评价内容（最少10个字符）
  - 评价标签选择
  - 匿名评价选项
- 评价展示
  - 总体评分统计
  - 各星级占比可视化
  - 评价列表展示
  - 评价时间排序
- 评价互动
  - 评价点赞功能
  - 评价回复功能
  - 评价举报功能
- 数据存储
  - 本地存储评价数据
  - 支持离线查看
  - 数据持久化

### GitHub趋势项目
- 数据来源：直接爬取 GitHub Trending 页面
- 支持按时间范围筛选：今日、本周、本月、今年、全部时间
- 显示项目详情：包括语言、Star数、Fork数、今日新增Star数
- 缓存机制：减少重复请求，提高加载速度

## API 文档
详见 [API文档.md](API文档.md)

## 开发规范
详见 [前端开发规范.md](前端开发规范.md)

## 注意事项
1. 图片上传
   - 支持格式：JPG、PNG、GIF、WEBP
   - 单张图片大小限制：2MB
   - 帖子封面图最多3张
   - 评论图片最多1张

2. 数据存储
   - 用户数据：`frontend/data/users.json`
   - 帖子数据：`frontend/data/posts.json`
   - 评论数据：`frontend/data/comments.json`
   - 图片存储：`frontend/images/posts/`

3. 安全考虑
   - 图片上传前进行格式和大小验证
   - 用户输入进行 XSS 防护
   - 敏感操作需要登录验证

## 贡献指南
1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证
MIT License