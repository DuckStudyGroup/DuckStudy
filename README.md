# DuckStudy 学习平台

DuckStudy是一个基于前后端分离架构的学习平台，提供课程评价、二手市场、论坛等功能。

## 项目结构

```
DuckStudy/
├── frontend/                # 前端项目目录
│   ├── css/                # 样式文件
│   ├── js/                 # JavaScript文件
│   ├── pages/              # 页面文件
│   └── index.html          # 首页
├── app.py                  # 后端Flask应用
└── requirements.txt        # Python依赖
```

## 技术栈

- 前端：HTML5 + CSS3 + JavaScript（原生）
- 后端：Python + Flask
- 数据库：待定

## 功能模块

1. 用户系统
   - 登录
   - 注册
   - 个人中心

2. 课程评价
   - 课程列表
   - 评价详情
   - 评分系统

3. 二手市场
   - 商品列表
   - 商品详情
   - 发布商品

4. 论坛
   - 帖子列表
   - 发帖功能
   - 评论系统

5. 最近观看
   - 观看历史
   - 收藏列表

6. 热门项目
   - 项目展示
   - 项目详情

7. 学习平台导航
   - 平台列表
   - 分类导航

## 安装和运行

1. 安装Python依赖：
```bash
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
- 后端使用Flask框架，提供RESTful API
- 前后端通过API进行数据交互
- 使用Bootstrap 5进行页面布局和样式设计

## 注意事项

- 目前项目处于开发阶段，部分功能尚未实现
- 后端API使用模拟数据，后续需要连接真实数据库
- 前端页面需要现代浏览器支持（支持ES6模块化） 