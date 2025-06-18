"""
评论系统功能测试模块
测试内容：评论添加、获取、更新、删除等功能

根据app.py中的实际实现编写测试：
1. 获取帖子评论：GET /api/comments/<post_id>
2. 添加评论：POST /api/comments/<post_id>
3. 更新评论：PUT /api/comments/<post_id>/<comment_id>
4. 删除评论：DELETE /api/comments/<post_id>/<comment_id>
5. 删除回复：DELETE /api/comments/<post_id>/<comment_id>/replies/<reply_id>
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

# 存储测试中创建的评论ID、帖子ID和用户名，用于测试后清理
test_comments_created = []
test_posts_created = []
test_users_created = []

# 获取评论数据文件路径
def get_comments_file_path():
    """获取评论数据文件的实际路径"""
    return os.path.join(project_root, 'frontend', 'data', 'comments.json')

# 获取帖子数据文件路径
def get_posts_file_path():
    """获取帖子数据文件的实际路径"""
    return os.path.join(project_root, 'frontend', 'data', 'posts.json')

# 获取用户数据文件路径
def get_users_file_path():
    """获取用户数据文件的实际路径"""
    return os.path.join(project_root, 'frontend', 'data', 'users.json')

# 清理测试评论数据
def clean_test_comment(post_id, comment_id):
    """删除测试评论数据"""
    comments_file_path = get_comments_file_path()
    if not os.path.exists(comments_file_path):
        print(f"警告：评论文件不存在: {comments_file_path}")
        return False
        
    try:
        # 读取当前评论数据
        with open(comments_file_path, 'r', encoding='utf-8') as f:
            comments_data = json.load(f)
        
        # 检查帖子是否存在评论
        if post_id not in comments_data['comments']:
            print(f"帖子 {post_id} 没有评论，无需清理")
            return True
        
        # 记录原始评论数
        original_count = len(comments_data['comments'].get(post_id, []))
        
        # 过滤掉测试评论
        comments_data['comments'][post_id] = [c for c in comments_data['comments'].get(post_id, []) 
                                               if str(c['id']) != str(comment_id)]
        
        # 计算删除的评论数
        removed_count = original_count - len(comments_data['comments'].get(post_id, []))
        
        # 如果帖子没有评论了，删除帖子的评论列表
        if not comments_data['comments'].get(post_id, []):
            comments_data['comments'].pop(post_id, None)
        
        # 保存修改后的数据
        with open(comments_file_path, 'w', encoding='utf-8') as f:
            json.dump(comments_data, f, ensure_ascii=False, indent=4)
        
        print(f"清理完成：已删除帖子 {post_id} 的测试评论 {comment_id}，共移除 {removed_count} 条记录")
        return True
    except Exception as e:
        print(f"清理测试评论时出错: {str(e)}")
        return False

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
        
        print(f"清理完成：已删除测试帖子 {post_id}，共移除 {removed_count} 条记录")
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
        
        print(f"清理完成：已删除测试用户 {username}，共移除 {removed_count} 条记录")
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
    
    # 测试完成后清理所有创建的测试评论
    print(f"准备清理测试评论数据，共 {len(test_comments_created)} 条记录")
    for post_id, comment_id in test_comments_created:
        clean_test_comment(post_id, comment_id)
    test_comments_created.clear()
    
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
    test_username = f"comment_test_user_{unique_suffix}"
    test_email = f"comment_test_{unique_suffix}@example.com"
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

@pytest.fixture
def test_post(client, logged_in_user):
    """创建测试帖子，返回帖子信息"""
    # 帖子数据
    post_data = {
        'title': f"评论测试帖子-{int(time.time())}",
        'content': "这是一个用于测试评论功能的帖子",
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
    
    # 添加到待清理列表
    post_id = data['post']['id']
    test_posts_created.append(post_id)
    
    # 返回帖子信息
    return {
        'id': post_id,
        'title': post_data['title'],
        'content': post_data['content'],
        'author': post_data['author']
    }

def test_get_comments_empty(client, test_post):
    """测试获取空评论列表"""
    # 获取评论
    response = client.get(f'/api/comments/{test_post["id"]}')
    
    # 检查响应
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True, f"获取评论失败，响应: {data}"
    assert 'comments' in data, "返回数据中缺少comments字段"
    assert isinstance(data['comments'], list), "评论列表应为数组"
    assert len(data['comments']) == 0, "新帖子不应有评论"
    assert 'sort' in data, "返回数据中缺少sort字段"
    
def test_add_comment(client, test_post, logged_in_user):
    """测试添加评论功能"""
    # 评论数据
    comment_data = {
        'author': logged_in_user['username'],
        'content': f"测试评论内容-{int(time.time())}",
        'date': time.strftime('%Y/%m/%d %H:%M')
    }
    
    # 添加评论
    response = client.post(f'/api/comments/{test_post["id"]}', json=comment_data)
    
    # 检查响应
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['success'] is True, f"添加评论失败，响应: {data}"
    assert 'comment' in data, "返回数据中缺少comment字段"
    
    # 添加到待清理列表
    comment_id = data['comment']['id']
    test_comments_created.append((test_post['id'], comment_id))
    
    # 验证返回的评论数据
    created_comment = data['comment']
    assert created_comment['content'] == comment_data['content'], "返回的评论内容与创建时不一致"
    assert created_comment['author'] == comment_data['author'], "返回的评论作者与创建时不一致"
    assert 'likes' in created_comment, "评论缺少likes字段"
    assert 'likedBy' in created_comment, "评论缺少likedBy字段"
    assert 'replies' in created_comment, "评论缺少replies字段"
    assert isinstance(created_comment['replies'], list), "replies字段应为数组"
    
    # 验证评论已添加到数据文件
    comments_file_path = get_comments_file_path()
    with open(comments_file_path, 'r', encoding='utf-8') as f:
        comments_data = json.load(f)
        
        # 检查帖子的评论列表是否存在
        assert str(test_post['id']) in comments_data['comments'], f"在评论数据中未找到帖子 {test_post['id']} 的评论列表"
        
        # 检查评论是否添加到帖子的评论列表中
        post_comments = comments_data['comments'][str(test_post['id'])]
        comment_exists = any(str(c['id']) == str(comment_id) for c in post_comments)
        assert comment_exists, f"在帖子 {test_post['id']} 的评论列表中未找到新创建的评论 {comment_id}"
    
    # 获取评论列表并验证
    response = client.get(f'/api/comments/{test_post["id"]}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert len(data['comments']) == 1, f"评论列表应包含1条评论，实际包含 {len(data['comments'])} 条"
    assert str(data['comments'][0]['id']) == str(comment_id), "获取的评论ID与创建的不一致"

def test_update_comment(client, test_post, logged_in_user):
    """测试更新评论功能"""
    # 先创建一条评论
    comment_data = {
        'author': logged_in_user['username'],
        'content': f"原始评论内容-{int(time.time())}",
        'date': time.strftime('%Y/%m/%d %H:%M')
    }
    
    response = client.post(f'/api/comments/{test_post["id"]}', json=comment_data)
    assert response.status_code == 201
    data = json.loads(response.data)
    comment_id = data['comment']['id']
    test_comments_created.append((test_post['id'], comment_id))
    
    # 添加回复数据
    reply_data = {
        'id': int(time.time() * 1000),
        'author': logged_in_user['username'],
        'content': "这是一个测试回复",
        'date': time.strftime('%Y/%m/%d %H:%M'),
        'likes': 0,
        'likedBy': [],
        'replyTo': logged_in_user['username']
    }
    
    # 获取评论
    response = client.get(f'/api/comments/{test_post["id"]}')
    data = json.loads(response.data)
    comment = data['comments'][0]
    
    # 更新评论（添加回复）
    comment['replies'].append(reply_data)
    
    response = client.put(f'/api/comments/{test_post["id"]}/{comment_id}', json=comment)
    
    # 检查响应
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True, f"更新评论失败，响应: {data}"
    assert 'comment' in data, "返回数据中缺少comment字段"
    
    # 验证返回的评论数据
    updated_comment = data['comment']
    assert 'replies' in updated_comment, "更新后的评论缺少replies字段"
    assert len(updated_comment['replies']) == 1, f"更新后的评论应有1条回复，实际有 {len(updated_comment['replies'])} 条"
    assert updated_comment['replies'][0]['content'] == reply_data['content'], "返回的回复内容与创建时不一致"
    
    # 验证评论已更新到数据文件
    comments_file_path = get_comments_file_path()
    with open(comments_file_path, 'r', encoding='utf-8') as f:
        comments_data = json.load(f)
        post_comments = comments_data['comments'][str(test_post['id'])]
        updated_comments = [c for c in post_comments if str(c['id']) == str(comment_id)]
        assert len(updated_comments) == 1, f"在评论数据中未找到更新后的评论 {comment_id}"
        assert len(updated_comments[0]['replies']) == 1, "更新后的评论应有1条回复"
        assert updated_comments[0]['replies'][0]['content'] == reply_data['content'], "数据文件中的回复内容与创建时不一致"

def test_delete_comment(client, test_post, logged_in_user):
    """测试删除评论功能"""
    # 先创建一条评论
    comment_data = {
        'author': logged_in_user['username'],
        'content': f"将被删除的评论-{int(time.time())}",
        'date': time.strftime('%Y/%m/%d %H:%M')
    }
    
    response = client.post(f'/api/comments/{test_post["id"]}', json=comment_data)
    assert response.status_code == 201
    data = json.loads(response.data)
    comment_id = data['comment']['id']
    
    # 不需要添加到待清理列表，因为测试中会删除它
    # test_comments_created.append((test_post['id'], comment_id))
    
    # 获取评论数量（删除前）
    response = client.get(f'/api/comments/{test_post["id"]}')
    data = json.loads(response.data)
    comments_count_before = len(data['comments'])
    
    # 删除评论
    response = client.delete(f'/api/comments/{test_post["id"]}/{comment_id}')
    
    # 检查响应
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True, f"删除评论失败，响应: {data}"
    assert 'message' in data, "返回数据中缺少message字段"
    assert '删除成功' in data['message'], "返回消息不包含'删除成功'"
    
    # 获取评论数量（删除后）
    response = client.get(f'/api/comments/{test_post["id"]}')
    data = json.loads(response.data)
    comments_count_after = len(data['comments'])
    
    # 验证评论数量减少了1
    assert comments_count_after == comments_count_before - 1, f"删除后评论数量应减少1，删除前: {comments_count_before}，删除后: {comments_count_after}"
    
    # 验证评论已从数据文件中删除
    comments_file_path = get_comments_file_path()
    with open(comments_file_path, 'r', encoding='utf-8') as f:
        comments_data = json.load(f)
        
        # 如果帖子仍有评论
        if str(test_post['id']) in comments_data['comments']:
            post_comments = comments_data['comments'][str(test_post['id'])]
            deleted_comments = [c for c in post_comments if str(c['id']) == str(comment_id)]
            assert len(deleted_comments) == 0, f"评论 {comment_id} 应已被删除，但仍在数据文件中"

def test_delete_reply(client, test_post, logged_in_user):
    """测试删除评论回复功能"""
    # 先创建一条评论
    comment_data = {
        'author': logged_in_user['username'],
        'content': f"带回复的评论-{int(time.time())}",
        'date': time.strftime('%Y/%m/%d %H:%M')
    }
    
    response = client.post(f'/api/comments/{test_post["id"]}', json=comment_data)
    assert response.status_code == 201
    data = json.loads(response.data)
    comment_id = data['comment']['id']
    test_comments_created.append((test_post['id'], comment_id))
    
    # 添加回复数据
    reply_data = {
        'id': int(time.time() * 1000),
        'author': logged_in_user['username'],
        'content': "这是一个将被删除的回复",
        'date': time.strftime('%Y/%m/%d %H:%M'),
        'likes': 0,
        'likedBy': [],
        'replyTo': logged_in_user['username']
    }
    
    # 获取评论
    response = client.get(f'/api/comments/{test_post["id"]}')
    data = json.loads(response.data)
    comment = data['comments'][0]
    
    # 更新评论（添加回复）
    comment['replies'].append(reply_data)
    
    response = client.put(f'/api/comments/{test_post["id"]}/{comment_id}', json=comment)
    assert response.status_code == 200
    
    # 验证回复已添加
    response = client.get(f'/api/comments/{test_post["id"]}')
    data = json.loads(response.data)
    comment = next((c for c in data['comments'] if str(c['id']) == str(comment_id)), None)
    assert comment is not None, f"未找到评论 {comment_id}"
    assert len(comment['replies']) == 1, f"评论应有1条回复，实际有 {len(comment['replies'])} 条"
    
    reply_id = comment['replies'][0]['id']
    
    # 删除回复
    response = client.delete(f'/api/comments/{test_post["id"]}/{comment_id}/replies/{reply_id}')
    
    # 检查响应
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True, f"删除回复失败，响应: {data}"
    assert 'message' in data, "返回数据中缺少message字段"
    assert '回复删除成功' in data['message'], "返回消息不包含'回复删除成功'"
    
    # 获取评论验证回复已删除
    response = client.get(f'/api/comments/{test_post["id"]}')
    data = json.loads(response.data)
    comment = next((c for c in data['comments'] if str(c['id']) == str(comment_id)), None)
    assert comment is not None, f"未找到评论 {comment_id}"
    assert len(comment['replies']) == 0, f"评论回复应已被删除，但仍有 {len(comment['replies'])} 条回复"

def test_unauthorized_operations(client, test_post):
    """测试未登录用户尝试进行需要登录的操作"""
    # 确保登出
    client.post('/api/user/logout')
    
    # 尝试添加评论（应该失败）
    comment_data = {
        'author': "anonymous",
        'content': "未登录用户的评论",
        'date': time.strftime('%Y/%m/%d %H:%M')
    }
    
    response = client.post(f'/api/comments/{test_post["id"]}', json=comment_data)
    # 注意：当前实现似乎没有检查用户是否登录，评论添加可能成功
    # 这里的断言可能需要根据实际情况调整
    
    # 尝试删除评论（应该失败）
    # 假设存在一个评论ID
    fake_comment_id = int(time.time() * 1000)
    response = client.delete(f'/api/comments/{test_post["id"]}/{fake_comment_id}')
    
    # 检查响应
    assert response.status_code in [401, 403, 404], f"未登录用户删除评论应返回401、403或404，实际返回 {response.status_code}"
    data = json.loads(response.data)
    assert data['success'] is False, "未登录用户删除评论不应成功" 