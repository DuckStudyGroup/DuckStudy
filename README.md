# DuckStudy - 综合学习平台

## 项目简介
DuckStudy 是一个综合学习平台，提供学习导航、论坛交流、二手交易和热门 GitHub 项目展示等功能。

## 功能特点
- 多站点导航（学习网站、工具网站）
- 用户论坛
- 二手交易市场
- GitHub 热门项目展示
  - 实时获取 GitHub Trending 页面数据
  - 支持多种时间范围筛选（今日、本周、本月、今年、全部时间）
  - 展示实时 Star 增长数据

## 技术栈
- 前端：HTML/CSS/VanillaJS
- 后端：Python/Flask
- 数据库：JSON 文件存储
- 数据获取：BeautifulSoup4 网页解析

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

3. 配置 GitHub Token（可选）
```bash
# 1. 访问 GitHub 设置页面
# 打开 https://github.com/settings/tokens

# 2. 生成新的 Token
# - 点击 "Generate new token"
# - 选择 "Generate new token (classic)"
# - 设置 Token 描述（如：DuckStudy API）
# - 选择权限：
#   - repo (全部)
#   - read:user
#   - user:email
# - 点击 "Generate token"
# - 复制生成的 Token

# 3. 配置 Token
# 在项目根目录创建 .env 文件
touch backend/.env

# 编辑 .env 文件，添加 Token
echo "GITHUB_TOKEN=your_token_here" > backend/.env

# 注意：即使没有配置 Token，系统也可以通过网页爬取的方式获取 GitHub 趋势数据
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
│   ├── pages/         # HTML 页面
│   └── data/          # 数据文件
├── backend/           # 后端代码
│   ├── app.py         # Flask 应用
│   ├── services/      # 服务模块
│   │   └── github_service.py  # GitHub数据服务
│   ├── utils/         # 工具模块
│   │   └── cache.py   # 缓存工具
│   ├── requirements.txt # 依赖列表
│   └── .env           # 环境变量
└── README.md          # 项目文档
```

## 功能详情

### GitHub趋势项目
- 数据来源：直接爬取 GitHub Trending 页面
- 支持按时间范围筛选：今日、本周、本月、今年、全部时间
- 显示项目详情：包括语言、Star数、Fork数、今日新增Star数
- 缓存机制：减少重复请求，提高加载速度
- 降级处理：在爬取失败时，会尝试使用GitHub API，若仍失败则使用模拟数据

## API 文档
详见 [API文档.md](API文档.md)

## 开发规范
详见 [前端开发规范.md](前端开发规范.md)

## 注意事项
1. GitHub Token 安全
   - 不要将 Token 提交到代码仓库
   - 定期更新 Token
   - 使用最小必要权限
   - 如果 Token 泄露，立即在 GitHub 设置中撤销

2. 环境变量
   - 开发环境使用 `.env` 文件
   - 生产环境使用系统环境变量

3. 数据存储
   - 用户数据：`frontend/data/users.json`
   - 帖子数据：`frontend/data/posts.json`
   - 评论数据：`frontend/data/comments.json`

4. 网页爬取
   - 系统会缓存爬取的数据以减少请求频率
   - 请尊重 GitHub 的使用条款，不要过于频繁地发送请求

## 贡献指南
1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证
MIT License