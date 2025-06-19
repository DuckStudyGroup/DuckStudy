"""
测试配置文件，提供共享的测试fixture
"""
import os
import sys
import json
import pytest
import tempfile
import shutil
import time
import builtins
from unittest.mock import mock_open, patch

# 添加项目根目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
backend_dir = os.path.join(project_root, 'backend')
sys.path.insert(0, project_root)
sys.path.insert(0, backend_dir)

# 导入Flask应用
try:
    from backend.app import app
except ImportError as e:
    print(f"无法导入Flask应用: {e}")
    app = None

@pytest.fixture
def app_client():
    """提供Flask测试客户端"""
    if app is None:
        pytest.skip("无法导入Flask应用")
        
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_app_with_test_data():
    """创建临时数据文件并配置应用使用它们"""
    if app is None:
        pytest.skip("无法导入Flask应用")
    
    # 保存原始配置
    original_users_file = app.config.get('USERS_FILE')
    original_posts_file = app.config.get('POSTS_FILE')
    original_comments_file = app.config.get('COMMENTS_FILE', '')
    
    print(f"原始用户数据文件路径: {original_users_file}")
    
    # 创建临时目录
    temp_dir = tempfile.mkdtemp()
    print(f"创建的临时目录: {temp_dir}")
    
    # 创建测试用的用户数据文件
    temp_users_file = os.path.join(temp_dir, 'test_users.json')
    users_data = {
        "users": [
            {
                "id": 1,
                "username": "testuser",
                "password": "testpassword",
                "email": "test@example.com",
                "avatar": "https://placehold.jp/100x100.png",
                "nickname": "测试用户",
                "bio": "这是一个测试账号",
                "registerDate": time.strftime('%Y-%m-%d'),
                "role": "user"
            },
            {
                "id": 2,
                "username": "admin",
                "password": "adminpassword",
                "email": "admin@example.com",
                "avatar": "https://placehold.jp/100x100.png",
                "nickname": "管理员",
                "bio": "网站管理员",
                "registerDate": time.strftime('%Y-%m-%d'),
                "role": "admin"
            }
        ]
    }
    
    with open(temp_users_file, 'w', encoding='utf-8') as f:
        json.dump(users_data, f, ensure_ascii=False, indent=2)
    print(f"创建的临时用户数据文件: {temp_users_file}")
    
    # 创建测试用的帖子数据文件
    temp_posts_file = os.path.join(temp_dir, 'test_posts.json')
    with open(temp_posts_file, 'w', encoding='utf-8') as f:
        json.dump({
            "posts": [
                {
                    "id": 1,
                    "title": "测试帖子1",
                    "content": "这是一个测试帖子的内容",
                    "author": "testuser",
                    "date": time.strftime('%Y-%m-%d'),
                    "views": 10,
                    "likes": 5,
                    "favorites": 0,
                    "likedBy": [],
                    "favoritedBy": [],
                    "category": "study"
                }
            ]
        }, f, ensure_ascii=False, indent=2)
    
    # 创建测试用的评论数据文件
    temp_comments_file = os.path.join(temp_dir, 'test_comments.json')
    with open(temp_comments_file, 'w', encoding='utf-8') as f:
        json.dump({
            "comments": {}
        }, f, ensure_ascii=False, indent=2)
    
    # 重定向应用配置
    app.config['USERS_FILE'] = temp_users_file
    app.config['POSTS_FILE'] = temp_posts_file
    app.config['COMMENTS_FILE'] = temp_comments_file
    
    # 创建覆盖open函数的patch
    original_open = open
    
    def patched_open(file, mode='r', *args, **kwargs):
        """重定向文件打开操作到测试文件"""
        if file == original_users_file and 'r' in mode:
            print(f"拦截打开用户文件: {file} -> {temp_users_file}")
            return original_open(temp_users_file, mode, *args, **kwargs)
        if file == original_posts_file and 'r' in mode:
            return original_open(temp_posts_file, mode, *args, **kwargs)
        if file == original_comments_file and 'r' in mode:
            return original_open(temp_comments_file, mode, *args, **kwargs)
        return original_open(file, mode, *args, **kwargs)
    
    # 应用patch
    patcher = patch('builtins.open', patched_open)
    patcher.start()
    
    # 打印修改后的配置
    print(f"修改后的用户数据文件路径: {app.config['USERS_FILE']}")
    print(f"验证文件存在: {os.path.exists(app.config['USERS_FILE'])}")
    
    yield app
    
    # 恢复设置
    patcher.stop()
    app.config['USERS_FILE'] = original_users_file
    app.config['POSTS_FILE'] = original_posts_file
    app.config['COMMENTS_FILE'] = original_comments_file
    
    # 清理临时目录
    shutil.rmtree(temp_dir) 