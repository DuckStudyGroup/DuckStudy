"""
用户认证功能测试模块
测试内容：用户注册、登录、登出和用户信息获取功能

根据app.py中的实际实现编写测试：
1. 用户注册：POST /api/user/register
2. 用户登录：POST /api/user/login
3. 用户登出：POST /api/user/logout
4. 获取用户状态：GET /api/user/status
5. 获取用户资料：GET /api/user/profile/<username>
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

# 存储测试中创建的用户名，用于测试后清理
test_users_created = []

# 获取用户数据文件路径
def get_users_file_path():
    """获取用户数据文件的实际路径"""
    return os.path.join(project_root, 'frontend', 'data', 'users.json')

# 清理测试数据
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
    
    # 测试完成后清理所有创建的测试用户
    print(f"准备清理测试用户数据，共 {len(test_users_created)} 个用户")
    for username in test_users_created:
        clean_test_user(username)
    test_users_created.clear()

def test_user_registration(client):
    """测试用户注册功能"""
    # 生成唯一用户名以避免与现有用户冲突
    unique_suffix = int(time.time())
    test_username = f"test_user_{unique_suffix}"
    test_email = f"test_user_{unique_suffix}@example.com"
    
    # 添加到待清理列表
    test_users_created.append(test_username)
    
    # 注册新用户
    response = client.post('/api/user/register', json={
        'username': test_username,
        'password': 'newpassword',
        'email': test_email
    })
    
    # 检查响应
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True, f"注册失败，响应: {data}"
    assert 'message' in data
    assert '注册成功' in data['message']
    
    # 直接使用实际的用户数据文件路径，而不是配置文件中的路径
    users_file_path = get_users_file_path()
    
    # 打印调试信息
    print(f"实际用户文件路径: {users_file_path}")
    print(f"文件是否存在: {os.path.exists(users_file_path)}")
    
    # 验证用户已添加到数据文件
    with open(users_file_path, 'r', encoding='utf-8') as f:
        users_data = json.load(f)
        users = users_data['users']
        user_exists = any(user['username'] == test_username for user in users)
        if not user_exists:
            print(f"在用户列表中未找到 {test_username}，用户列表包含以下用户名:")
            for user in users[-5:]:  # 打印最后5个用户
                print(f"- {user.get('username')}")
        assert user_exists, f"在用户列表中未找到 {test_username}"
    
    # 测试重复注册
    response = client.post('/api/user/register', json={
        'username': test_username,
        'password': 'anotherpassword',
        'email': 'another@example.com'
    })
    
    # 检查响应 - 应该失败
    assert response.status_code == 200  # 接口返回200但success=False
    data = json.loads(response.data)
    assert data['success'] is False
    assert '用户名已存在' in data['message']
    
    # 测试邮箱已存在的情况
    different_username = f"different_user_{unique_suffix}"
    test_users_created.append(different_username)  # 添加到待清理列表
    
    response = client.post('/api/user/register', json={
        'username': different_username,
        'password': 'password123',
        'email': test_email  # 使用上面已注册的邮箱
    })
    
    # 检查响应 - 应该失败
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is False
    assert '邮箱已被注册' in data['message']
    
    # 测试缺少参数的情况
    response = client.post('/api/user/register', json={
        'username': '',  # 空用户名
        'password': 'password123'
    })
    
    # 检查响应 - 应该失败
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is False
    assert '用户名和密码不能为空' in data['message']

def test_user_login(client):
    """测试用户登录功能"""
    # 生成唯一用户名和邮箱
    unique_suffix = int(time.time())
    test_username = f"login_user_{unique_suffix}"
    test_email = f"login_user_{unique_suffix}@example.com"
    test_password = "testpassword123"
    
    # 添加到待清理列表
    test_users_created.append(test_username)
    
    # 创建测试用户
    response = client.post('/api/user/register', json={
        'username': test_username,
        'password': test_password,
        'email': test_email
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True, f"创建测试用户失败: {data}"
    
    # 使用新创建的用户登录
    response = client.post('/api/user/login', json={
        'username': test_username,
        'password': test_password
    })
    
    # 检查登录是否成功
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True, f"登录失败，响应: {data}"
    assert 'user' in data
    assert data['user']['username'] == test_username
    assert 'avatar' in data['user']
    assert 'role' in data['user']
    
    # 测试密码错误
    response = client.post('/api/user/login', json={
        'username': test_username,
        'password': 'wrongpassword'
    })
    
    # 检查登录失败
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is False
    assert '用户名或密码错误' in data['message']
    
    # 测试用户不存在
    nonexistent_user = f"nonexistent_{unique_suffix}"
    response = client.post('/api/user/login', json={
        'username': nonexistent_user,
        'password': 'anypassword'
    })
    
    # 检查登录失败
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is False
    assert '用户名或密码错误' in data['message']
    
    # 测试缺少参数
    response = client.post('/api/user/login', json={
        'username': '',
        'password': 'anypassword'
    })
    
    # 检查登录失败
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is False
    assert '用户名和密码不能为空' in data['message']

def test_user_logout(client):
    """测试用户登出功能"""
    # 创建用户并登录
    unique_suffix = int(time.time())
    test_username = f"logout_user_{unique_suffix}"
    test_password = "testpassword123"
    
    # 添加到待清理列表
    test_users_created.append(test_username)
    
    # 注册用户
    client.post('/api/user/register', json={
        'username': test_username,
        'password': test_password,
        'email': f"logout_user_{unique_suffix}@example.com"
    })
    
    # 登录
    client.post('/api/user/login', json={
        'username': test_username,
        'password': test_password
    })
    
    # 然后登出
    response = client.post('/api/user/logout')
    
    # 检查登出成功
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert '退出成功' in data['message']
    
    # 验证session中的username已被清除
    with client.session_transaction() as sess:
        assert 'username' not in sess

def test_user_status(client):
    """测试获取用户状态"""
    # 创建用户
    unique_suffix = int(time.time())
    test_username = f"status_user_{unique_suffix}"
    test_password = "testpassword123"
    
    # 添加到待清理列表
    test_users_created.append(test_username)
    
    # 注册用户
    client.post('/api/user/register', json={
        'username': test_username,
        'password': test_password,
        'email': f"status_user_{unique_suffix}@example.com"
    })
    
    # 未登录状态
    response = client.get('/api/user/status')
    data = json.loads(response.data)
    assert data['isLoggedIn'] is False
    assert 'avatar' in data  # 即使未登录也应返回默认头像
    
    # 登录
    client.post('/api/user/login', json={
        'username': test_username,
        'password': test_password
    })
    
    # 检查登录状态
    response = client.get('/api/user/status')
    data = json.loads(response.data)
    assert data['isLoggedIn'] is True, f"获取用户状态失败，响应: {data}"
    assert data['username'] == test_username
    assert 'avatar' in data
    assert 'role' in data

def test_get_user_profile(client):
    """测试获取用户资料"""
    # 创建测试用户
    unique_suffix = int(time.time())
    test_username = f"profile_user_{unique_suffix}"
    test_password = "testpassword123"
    test_email = f"profile_user_{unique_suffix}@example.com"
    
    # 添加到待清理列表
    test_users_created.append(test_username)
    
    # 注册用户
    response = client.post('/api/user/register', json={
        'username': test_username,
        'password': test_password,
        'email': test_email
    })
    assert response.status_code == 200
    assert json.loads(response.data)['success'] is True
    
    # 获取用户资料
    response = client.get(f'/api/user/profile/{test_username}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'user' in data
    assert data['user']['username'] == test_username
    assert data['user']['email'] == test_email
    
    # 获取不存在的用户资料
    response = client.get(f'/api/user/profile/nonexistent_user_{unique_suffix}')
    assert response.status_code == 404  # 应返回404状态码
    data = json.loads(response.data)
    assert data['success'] is False
    assert '用户不存在' in data['message']

if __name__ == '__main__':
    pytest.main(['-v', __file__]) 