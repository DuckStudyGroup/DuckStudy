import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# GitHub API 配置
GITHUB_API_URL = "https://api.github.com"
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')

# API 限制配置
API_RATE_LIMIT = {
    'unauthenticated': 60,  # 未认证用户每小时请求限制
    'authenticated': 5000   # 认证用户每小时请求限制
}

# 缓存配置
CACHE_CONFIG = {
    'maxsize': 100,  # 缓存最大条目数
    'ttl': 3600      # 缓存过期时间（秒）
} 