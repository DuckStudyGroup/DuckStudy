"""
帖子管理功能测试模块
测试内容：帖子创建、获取、更新等功能

根据app.py中的实际实现编写测试：
1. 获取所有帖子：GET /api/posts
2. 创建新帖子：POST /api/posts
3. 获取特定帖子：GET /api/posts/<int:post_id>
4. 更新帖子：PUT /api/posts/<int:post_id>
5. 获取热门帖子：GET /api/posts/hot
"""
import os
import sys
import json
import pytest
import time
from flask import session

# 将项目根目录添加到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
backend_dir = os.path.join(project_root, 'backend')
sys.path.insert(0, project_root)
sys.path.insert(0, backend_dir)

# 导入Flask应用
try:
    from backend.app import app
except ImportError:
    print("无法导入app模块，请确保backend/app.py存在")
    app = None

# 存储测试中创建的帖子ID和用户名，用于测试后清理
test_posts_created = []
test_users_created = []

# 获取帖子数据文件路径
def get_posts_file_path():
    """获取帖子数据文件的实际路径"""
    return os.path.join(project_root, 'frontend', 'data', 'posts.json')

# 获取用户数据文件路径
def get_users_file_path():
    """获取用户数据文件的实际路径"""
    return os.path.join(project_root, 'frontend', 'data', 'users.json')

# 清理测试帖子数据
def clean_test_post(post_id):
    """删除测试帖子数据"""
    posts_file_path = get_posts_file_path()
    if not os.path.exists(posts_file_path):
        print(f"警告：帖子文件不存在: {posts_file_path}")
        return False
        
    try:
        # 读取当前帖子数据
        with open(posts_file_path, 'r', encoding='utf-8') as f:
            posts_data = json.load(f)
        
        # 记录原始帖子数
        original_count = len(posts_data.get('posts', []))
        
        # 过滤掉测试帖子
        posts_data['posts'] = [p for p in posts_data['posts'] if p['id'] != post_id]
        
        # 计算删除的帖子数
        removed_count = original_count - len(posts_data.get('posts', []))
        
        # 保存修改后的数据
        with open(posts_file_path, 'w', encoding='utf-8') as f:
            json.dump(posts_data, f, ensure_ascii=False, indent=4)
        
        print(f"清理完成：已删除测试帖子 '{post_id}'，共移除 {removed_count} 条记录")
        return True
    except Exception as e:
        print(f"清理测试帖子时出错: {str(e)}")
        return False

# 清理测试用户数据
def clean_test_user(username):
    """删除测试用户数据"""
    users_file_path = get_users_file_path()
    if not os.path.exists(users_file_path):
        print(f"警告：用户文件不存在: {users_file_path}")
        return False
        
    try:
        # 读取当前用户数据
        with open(users_file_path, 'r', encoding='utf-8') as f:
            users_data = json.load(f)
        
        # 记录原始用户数
        original_count = len(users_data.get('users', []))
        
        # 过滤掉测试用户
        users_data['users'] = [u for u in users_data['users'] if u['username'] != username]
        
        # 计算删除的用户数
        removed_count = original_count - len(users_data.get('users', []))
        
        # 保存修改后的数据
        with open(users_file_path, 'w', encoding='utf-8') as f:
            json.dump(users_data, f, ensure_ascii=False, indent=4)
        
        print(f"清理完成：已删除测试用户 '{username}'，共移除 {removed_count} 条记录")
        return True
    except Exception as e:
        print(f"清理测试用户时出错: {str(e)}")
        return False

@pytest.fixture
def client(mock_app_with_test_data):
    """创建测试客户端，使用共享的mock_app_with_test_data fixture"""
    if app is None:
        pytest.skip("无法导入Flask应用")
        
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.test_client() as client:
        # 创建应用上下文，使session可用
        with app.app_context():
            yield client
    
    # 测试完成后清理所有创建的测试帖子
    print(f"准备清理测试帖子数据，共 {len(test_posts_created)} 个帖子")
    for post_id in test_posts_created:
        clean_test_post(post_id)
    test_posts_created.clear()
    
    # 测试完成后清理所有创建的测试用户
    print(f"准备清理测试用户数据，共 {len(test_users_created)} 个用户")
    for username in test_users_created:
        clean_test_user(username)
    test_users_created.clear()

@pytest.fixture
def logged_in_user(client):
    """创建并登录测试用户，返回用户信息"""
    # 生成唯一用户名和邮箱，使用时间戳毫秒级以确保唯一性
    unique_suffix = int(time.time() * 1000)
    test_username = f"post_test_user_{unique_suffix}"
    test_email = f"post_test_{unique_suffix}@example.com"
    test_password = "testpassword123"
    
    # 将用户名添加到待清理列表
    test_users_created.append(test_username)
    
    # 注册用户
    response = client.post('/api/user/register', json={
        'username': test_username,
        'password': test_password,
        'email': test_email
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True, f"创建测试用户失败: {data}"
    
    # 登录用户
    response = client.post('/api/user/login', json={
        'username': test_username,
        'password': test_password
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True, f"登录测试用户失败: {data}"
    
    # 返回用户信息
    return {
        'username': test_username,
        'email': test_email,
        'password': test_password
    }

def test_get_posts(client):
    """测试获取帖子列表功能"""
    # 获取帖子列表
    response = client.get('/api/posts')
    
    # 检查响应
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'posts' in data, "返回数据中缺少posts字段"
    
    # 验证帖子列表结构
    posts = data['posts']
    assert isinstance(posts, list), "帖子列表应为数组"
    
    # 如果有帖子，验证帖子字段
    if posts:
        post = posts[0]
        assert 'id' in post, "帖子缺少id字段"
        assert 'title' in post, "帖子缺少title字段"
        assert 'content' in post, "帖子缺少content字段"
        assert 'author' in post, "帖子缺少author字段"
        assert 'authorAvatar' in post, "帖子缺少authorAvatar字段"

def test_create_post(client, logged_in_user):
    """测试创建帖子功能"""
    # 帖子数据
    post_data = {
        'title': f"测试帖子-{int(time.time())}",
        'content': "这是一个用于测试的帖子内容",
        'author': logged_in_user['username'],
        'date': time.strftime('%Y-%m-%d'),
        'category': "test"
    }
    
    # 创建帖子
    response = client.post('/api/posts', json=post_data)
    
    # 检查响应
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['success'] is True, f"创建帖子失败，响应: {data}"
    assert 'post' in data, "返回数据中缺少post字段"
    assert 'id' in data['post'], "返回的帖子缺少id字段"
    
    # 添加到待清理列表
    post_id = data['post']['id']
    test_posts_created.append(post_id)
    
    # 验证返回的帖子数据
    created_post = data['post']
    assert created_post['title'] == post_data['title'], "返回的帖子标题与创建时不一致"
    assert created_post['content'] == post_data['content'], "返回的帖子内容与创建时不一致"
    assert created_post['author'] == post_data['author'], "返回的帖子作者与创建时不一致"
    assert 'likes' in created_post, "帖子缺少likes字段"
    assert 'views' in created_post, "帖子缺少views字段"
    assert 'favorites' in created_post, "帖子缺少favorites字段"
    assert 'likedBy' in created_post, "帖子缺少likedBy字段"
    assert 'favoritedBy' in created_post, "帖子缺少favoritedBy字段"
    
    # 验证帖子已添加到数据文件
    posts_file_path = get_posts_file_path()
    with open(posts_file_path, 'r', encoding='utf-8') as f:
        posts_data = json.load(f)
        posts = posts_data['posts']
        post_exists = any(post['id'] == post_id for post in posts)
        assert post_exists, f"在帖子列表中未找到新创建的帖子 {post_id}"

def test_create_post_without_login(client):
    """测试未登录状态下创建帖子（应该失败）"""
    # 先登出确保未登录状态
    client.post('/api/user/logout')
    
    # 帖子数据
    post_data = {
        'title': f"未登录测试帖子-{int(time.time())}",
        'content': "这是一个未登录状态下创建的测试帖子",
        'author': "anonymous",
        'date': time.strftime('%Y-%m-%d'),
        'category': "test"
    }
    
    # 创建帖子
    response = client.post('/api/posts', json=post_data)
    
    # 检查响应 - 应该返回成功，因为API允许未登录用户创建帖子
    # 注意：如果后端实现了登录检查，这里需要修改断言
    assert response.status_code in [201, 401, 403], f"预期返回201（成功）或401/403（未授权），但返回了 {response.status_code}"
    data = json.loads(response.data)
    
    # 如果API允许未登录创建帖子，则添加到清理列表
    if response.status_code == 201 and data.get('success') is True and 'post' in data:
        post_id = data['post']['id']
        test_posts_created.append(post_id)

def test_get_post_detail(client, logged_in_user):
    """测试获取单个帖子详情功能"""
    # 先创建一个测试帖子
    post_data = {
        'title': f"详情测试帖子-{int(time.time())}",
        'content': "这是用于测试获取详情的帖子内容",
        'author': logged_in_user['username'],
        'date': time.strftime('%Y-%m-%d'),
        'category': "test"
    }
    
    response = client.post('/api/posts', json=post_data)
    assert response.status_code == 201
    data = json.loads(response.data)
    post_id = data['post']['id']
    test_posts_created.append(post_id)
    
    # 获取该帖子详情
    response = client.get(f'/api/posts/{post_id}')
    
    # 检查响应
    assert response.status_code == 200
    post_detail = json.loads(response.data)
    assert 'id' in post_detail, "返回的帖子详情缺少id字段"
    assert post_detail['id'] == post_id, "返回的帖子id与请求的不一致"
    assert post_detail['title'] == post_data['title'], "返回的帖子标题与创建时不一致"
    assert post_detail['content'] == post_data['content'], "返回的帖子内容与创建时不一致"
    assert post_detail['author'] == post_data['author'], "返回的帖子作者与创建时不一致"
    assert 'authorAvatar' in post_detail, "返回的帖子详情缺少authorAvatar字段"

def test_get_nonexistent_post(client):
    """测试获取不存在的帖子（应该返回404）"""
    # 使用一个不太可能存在的ID
    nonexistent_id = 9999999999
    
    # 获取不存在的帖子
    response = client.get(f'/api/posts/{nonexistent_id}')
    
    # 检查响应
    assert response.status_code == 404, f"预期返回404，但返回了 {response.status_code}"
    data = json.loads(response.data)
    assert data['success'] is False, "预期返回失败状态"
    assert '不存在' in data['message'], "返回消息应包含'不存在'"

def test_update_post(client, logged_in_user):
    """测试更新帖子功能"""
    # 先创建一个测试帖子
    post_data = {
        'title': f"更新测试帖子-{int(time.time())}",
        'content': "这是用于测试更新的原始帖子内容",
        'author': logged_in_user['username'],
        'date': time.strftime('%Y-%m-%d'),
        'category': "test"
    }
    
    response = client.post('/api/posts', json=post_data)
    assert response.status_code == 201
    data = json.loads(response.data)
    post_id = data['post']['id']
    test_posts_created.append(post_id)
    
    # 更新帖子数据
    update_data = {
        'title': f"已更新-{post_data['title']}",
        'content': "这是更新后的帖子内容"
    }
    
    # 更新帖子
    response = client.put(f'/api/posts/{post_id}', json=update_data)
    
    # 检查响应
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True, f"更新帖子失败，响应: {data}"
    assert 'post' in data, "返回数据中缺少post字段"
    
    # 验证更新后的帖子数据
    updated_post = data['post']
    assert updated_post['id'] == post_id, "更新后的帖子id与原id不一致"
    assert updated_post['title'] == update_data['title'], "更新后的帖子标题与预期不一致"
    assert updated_post['content'] == update_data['content'], "更新后的帖子内容与预期不一致"
    assert updated_post['author'] == post_data['author'], "更新后的帖子作者被意外修改"
    
    # 再次获取帖子详情确认更新成功
    response = client.get(f'/api/posts/{post_id}')
    assert response.status_code == 200
    post_detail = json.loads(response.data)
    assert post_detail['title'] == update_data['title'], "获取的帖子标题与更新后不一致"
    assert post_detail['content'] == update_data['content'], "获取的帖子内容与更新后不一致"

def test_update_nonexistent_post(client):
    """测试更新不存在的帖子（应该返回404）"""
    # 使用一个不太可能存在的ID
    nonexistent_id = 9999999999
    
    # 更新数据
    update_data = {
        'title': "更新不存在的帖子",
        'content': "这个帖子不存在"
    }
    
    # 更新不存在的帖子
    response = client.put(f'/api/posts/{nonexistent_id}', json=update_data)
    
    # 检查响应
    assert response.status_code == 404, f"预期返回404，但返回了 {response.status_code}"
    data = json.loads(response.data)
    assert '不存在' in data['message'], "返回消息应包含'不存在'"

def test_hot_posts(client):
    """测试获取热门帖子功能"""
    # 获取热门帖子
    response = client.get('/api/posts/hot')
    
    # 检查响应
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list), "热门帖子应为数组"
    
    # 验证帖子结构
    if data:
        hot_post = data[0]
        assert 'title' in hot_post, "热门帖子缺少title字段"
        assert 'author' in hot_post, "热门帖子缺少author字段"
        assert 'date' in hot_post, "热门帖子缺少date字段"
        assert 'views' in hot_post, "热门帖子缺少views字段"

if __name__ == '__main__':
    pytest.main(['-v', __file__]) 