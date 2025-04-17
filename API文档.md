# DuckStudy API 文档

## 基础信息
- 基础URL: `http://localhost:5000`
- 所有请求和响应都使用JSON格式
- 支持跨域请求(CORS)

## 用户相关接口

### 1. 获取用户登录状态
- **URL**: `/api/user/status`
- **Method**: `GET`
- **描述**: 获取当前用户的登录状态
- **响应**:
```json
{
    "isLoggedIn": true,
    "username": "用户名"
}
```

### 2. 用户登录
- **URL**: `/api/user/login`
- **Method**: `POST`
- **描述**: 用户登录
- **请求体**:
```json
{
    "username": "用户名",
    "password": "密码"
}
```
- **响应**:
```json
{
    "success": true,
    "username": "用户名"
}
// 或
{
    "success": false,
    "message": "用户名或密码错误"
}
```

### 3. 用户注册
- **URL**: `/api/user/register`
- **Method**: `POST`
- **描述**: 新用户注册
- **请求体**:
```json
{
    "username": "用户名",
    "password": "密码"
}
```
- **响应**:
```json
{
    "success": true,
    "message": "注册成功"
}
// 或
{
    "success": false,
    "message": "用户名已存在"
}
```

### 4. 用户登出
- **URL**: `/api/user/logout`
- **Method**: `POST`
- **描述**: 用户登出
- **响应**:
```json
{
    "success": true
}
```

## 内容相关接口

### 1. 获取课程评价
- **URL**: `/api/reviews`
- **Method**: `GET`
- **描述**: 获取所有课程评价
- **响应**:
```json
[
    {
        "title": "课程标题",
        "rating": 4.5,
        "content": "评价内容",
        "author": "作者",
        "date": "2024-03-15"
    }
]
```

### 2. 获取二手市场商品
- **URL**: `/api/market`
- **Method**: `GET`
- **描述**: 获取二手市场商品列表
- **响应**:
```json
[
    {
        "title": "商品标题",
        "price": 2999,
        "description": "商品描述",
        "image": "图片URL"
    }
]
```

### 3. 获取热门帖子
- **URL**: `/api/posts/hot`
- **Method**: `GET`
- **描述**: 获取热门帖子列表
- **响应**:
```json
[
    {
        "title": "帖子标题",
        "author": "作者",
        "date": "2024-03-15",
        "views": 256
    }
]
```

### 4. 获取最近浏览
- **URL**: `/api/history`
- **Method**: `GET`
- **描述**: 获取用户最近浏览记录
- **响应**:
```json
[
    {
        "title": "课程标题",
        "date": "2024-03-15",
        "image": "图片URL"
    }
]
```

### 5. 获取热门项目
- **URL**: `/api/projects/hot`
- **Method**: `GET`
- **描述**: 获取热门项目列表
- **响应**:
```json
[
    {
        "title": "项目标题",
        "description": "项目描述",
        "stars": 128,
        "forks": 45
    }
]
```

## GitHub相关接口

### 1. 获取GitHub趋势项目
- **URL**: `/api/github/trending`
- **Method**: `GET`
- **描述**: 获取GitHub热门项目
- **参数**:
  - `timeRange`: 时间范围（可选值：all, year, month, week）
  - `language`: 编程语言（可选）
- **响应**:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "项目名称",
            "owner": {
                "login": "用户名"
            },
            "html_url": "GitHub仓库URL",
            "description": "项目描述",
            "stargazers_count": 23308,
            "forks_count": 4088,
            "language": "Python"
        }
    ]
}
```

### 2. 获取GitHub仓库详情
- **URL**: `/api/github/repo/{owner}/{repo}`
- **Method**: `GET`
- **描述**: 获取指定GitHub仓库的详细信息
- **响应**:
```json
{
    "success": true,
    "data": {
        "info": {
            "name": "仓库名称",
            "description": "仓库描述",
            "created_at": "创建时间",
            "updated_at": "更新时间",
            "stargazers_count": 23308,
            "forks_count": 4088,
            "watchers_count": 180
        },
        "languages": {
            "JavaScript": 100000,
            "HTML": 50000,
            "CSS": 30000
        },
        "contributors": [
            {
                "login": "贡献者用户名",
                "avatar_url": "头像URL",
                "contributions": 100
            }
        ]
    }
}
```

### 3. 获取用户GitHub仓库
- **URL**: `/api/github/user/{username}/repos`
- **Method**: `GET`
- **描述**: 获取指定GitHub用户的仓库列表
- **响应**:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "仓库名称",
            "html_url": "GitHub仓库URL",
            "description": "仓库描述",
            "stargazers_count": 100,
            "forks_count": 20,
            "language": "JavaScript"
        }
    ]
}
```

### 4. 检查GitHub API速率限制
- **URL**: `/api/github/rate-limit`
- **Method**: `GET`
- **描述**: 检查GitHub API的使用限制情况
- **响应**:
```json
{
    "success": true,
    "data": {
        "resources": {
            "core": {
                "limit": 5000,
                "used": 100,
                "remaining": 4900,
                "reset": 1682678400
            },
            "search": {
                "limit": 30,
                "used": 5,
                "remaining": 25,
                "reset": 1682678400
            }
        },
        "rate": {
            "limit": 5000,
            "used": 100,
            "remaining": 4900,
            "reset": 1682678400
        }
    }
}
```

## 错误处理
所有接口在发生错误时都会返回统一的错误格式：
```json
{
    "success": false,
    "message": "错误信息"
}
```

## 注意事项
1. 所有接口都需要在请求头中包含 `Content-Type: application/json`
2. 用户相关接口需要处理会话状态
3. 部分接口可能需要用户登录才能访问
4. 所有时间格式统一使用 "YYYY-MM-DD" 格式
5. GitHub相关接口会受到GitHub API速率限制，建议配置个人访问令牌 