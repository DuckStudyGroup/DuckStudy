from flask import Flask, jsonify, request, session, send_from_directory
from flask_cors import CORS
import json
import os
import time
import hashlib  # 用于密码加密
from services.github_service import github_service
from dotenv import load_dotenv
import requests
from werkzeug.utils import secure_filename
from routes.user_routes import user_bp

# 加载环境变量
load_dotenv()

# 获取当前文件所在目录的父目录（项目根目录）
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 添加项目根目录到Python路径
import sys
sys.path.append(BASE_DIR)

app = Flask(__name__, static_folder=os.path.join(BASE_DIR, 'frontend'))

# 配置CORS
CORS(app, 
     supports_credentials=True,
     resources={
         r"/*": {
             "origins": "*",
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"]
         }
     })

# 设置密钥
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'default-secret-key')

# 用户数据存储（临时使用内存存储）
USERS = {}

# 数据文件路径
POSTS_FILE = os.path.join(BASE_DIR, 'frontend', 'data', 'posts.json')
COMMENTS_FILE = os.path.join(BASE_DIR, 'frontend', 'data', 'comments.json')
USERS_FILE = os.path.join(BASE_DIR, 'frontend', 'data', 'users.json')
COURSES_FILE = os.path.join(BASE_DIR, 'frontend', 'data', 'courses.json')
# 配置上传文件夹
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'frontend', 'images', 'posts')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 确保上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# 确保数据文件存在
def ensure_file_exists(file_path, default_data=None):
    """确保文件存在，如果不存在则创建"""
    if not os.path.exists(os.path.dirname(file_path)):
        os.makedirs(os.path.dirname(file_path))
    
    if not os.path.exists(file_path):
        with open(file_path, 'w', encoding='utf-8') as f:
            if default_data is None:
                default_data = []
            json.dump(default_data, f, ensure_ascii=False, indent=4)

# 初始化数据文件
ensure_file_exists(POSTS_FILE, [])
ensure_file_exists(COMMENTS_FILE, {})
ensure_file_exists(USERS_FILE, [])
ensure_file_exists(COURSES_FILE, [])
# 读取帖子数据
def read_posts():
    """读取帖子数据"""
    try:
        with open(POSTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"读取帖子数据失败: {str(e)}")
        return {"posts": []}

# 保存帖子数据
def save_posts(data):
    """保存帖子数据"""
    try:
        # 尝试先序列化测试，确保数据可以转为JSON
        json_string = json.dumps(data, ensure_ascii=False, indent=4)
        
        # 先写入到临时文件，成功后再替换
        temp_file = f"{POSTS_FILE}.temp"
        with open(temp_file, 'w', encoding='utf-8') as f:
            f.write(json_string)
        
        # 临时文件写入成功后，替换原文件
        import os
        if os.path.exists(temp_file):
            # 在Windows上，可能需要先删除原文件
            if os.path.exists(POSTS_FILE) and os.name == 'nt':
                try:
                    os.remove(POSTS_FILE)
                except Exception as e:
                    print(f"删除原文件失败: {str(e)}")
                    return False
            
            # 重命名临时文件
            os.rename(temp_file, POSTS_FILE)
            return True
        else:
            print("临时文件写入失败")
            return False
    except Exception as e:
        print(f"保存帖子数据失败: {str(e)}")
        return False

# 读取评论数据
def read_comments():
    """读取评论数据"""
    try:
        with open(COMMENTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"读取评论数据失败: {str(e)}")
        return {"comments": {}}

# 保存评论数据
def save_comments(data):
    """保存评论数据"""
    try:
        with open(COMMENTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        return True
    except Exception as e:
        print(f"保存评论数据失败: {str(e)}")
        return False

# 读取用户数据
def read_users():
    """读取用户数据"""
    try:
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"读取用户数据失败: {str(e)}")
        return {"users": []}

# 保存用户数据
def save_users(data):
    """保存用户数据"""
    try:
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        return True
    except Exception as e:
        print(f"保存用户数据失败: {str(e)}")
        return False

# 加密密码
def hash_password(password):
    # 使用SHA-256进行简单加密
    return hashlib.sha256(password.encode()).hexdigest()

# 添加根路由
@app.route('/')
def index():
    return send_from_directory(os.path.join(BASE_DIR, 'frontend'), 'index.html')

# 模拟数据
MOCK_REVIEWS = [
    {
        'title': 'Python编程入门',
        'rating': 4.5,
        'content': '课程内容非常系统，从基础语法到实际应用都有详细讲解...',
        'author': '张三',
        'date': '2024-03-15'
    },
    {
        'title': 'UI设计基础',
        'rating': 4.0,
        'content': '课程内容很实用，特别是设计原则和工具使用的部分...',
        'author': '李四',
        'date': '2024-03-10'
    }
]

MOCK_MARKET_ITEMS = [
    {
        'title': '二手笔记本电脑',
        'price': 2999,
        'description': '9成新，配置良好，适合学习编程',
        'image': 'https://placehold.jp/200x200.png'
    },
    {
        'title': '编程书籍',
        'price': 50,
        'description': '《Python编程：从入门到实践》',
        'image': 'https://placehold.jp/200x200.png'
    }
]

MOCK_HOT_POSTS = [
    {
        'title': 'Python学习经验分享',
        'author': '张三',
        'date': '2024-03-15',
        'views': 256
    },
    {
        'title': 'React Hooks技术讨论',
        'author': '李四',
        'date': '2024-03-14',
        'views': 189
    }
]

MOCK_RECENT_VIEWS = [
    {
        'title': 'Python基础教程',
        'date': '2024-03-15',
        'image': 'https://placehold.jp/150x150.png'
    },
    {
        'title': 'Web开发入门',
        'date': '2024-03-14',
        'image': 'https://placehold.jp/150x150.png'
    }
]

MOCK_HOT_PROJECTS = [
    {
        'title': '在线学习平台',
        'description': '基于Vue.js和Django的在线学习平台',
        'stars': 128,
        'forks': 45
    },
    {
        'title': '个人博客系统',
        'description': '使用React和Node.js开发的个人博客系统',
        'stars': 96,
        'forks': 32
    }
]

# 获取当前用户信息
def get_current_user():
    """获取当前登录用户的信息"""
    username = session.get('username')
    if not username:
        return None
    
    # 从JSON文件获取用户数据
    users_data = read_users()
    user = next((u for u in users_data['users'] if u['username'] == username), None)
    
    return user

# 用户相关路由
@app.route('/api/user/status', methods=['GET'])
def get_user_status():
    """获取用户登录状态"""
    username = session.get('username')
    if username:
        # 获取用户信息
        data = read_users()
        user = next((u for u in data['users'] if u['username'] == username), None)
        if user:
            # 确保头像路径正确
            avatar = user.get('avatar', 'https://placehold.jp/100x100.png')
            if not avatar.startswith(('http://', 'https://')):
                avatar = avatar if avatar.startswith('/') else '/' + avatar
                
            return jsonify({
                'isLoggedIn': True,
                'username': username,
                'avatar': avatar,
                'role': user.get('role', 'user')
            })
    
    return jsonify({
        'isLoggedIn': False,
        'avatar': 'https://placehold.jp/100x100.png'
    })

@app.route('/api/user/login', methods=['POST'])
def login():
    """用户登录"""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'message': '用户名和密码不能为空'})
    
    # 从JSON文件获取用户数据
    users_data = read_users()
    user = next((u for u in users_data['users'] if u['username'] == username), None)
    
    if user and user['password'] == password:  # 暂时不使用密码加密
        session['username'] = username
        
        # 确保头像路径正确
        avatar = user.get('avatar', 'https://placehold.jp/100x100.png')
        if not avatar.startswith(('http://', 'https://')):
            avatar = avatar if avatar.startswith('/') else '/' + avatar
            
        return jsonify({
            'success': True, 
            'message': '登录成功',
            'user': {
                'username': user['username'],
                'avatar': avatar,
                'role': user.get('role', 'user')
            }
        })
    
    return jsonify({'success': False, 'message': '用户名或密码错误'})

@app.route('/api/user/register', methods=['POST'])
def register():
    """用户注册"""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    email = data.get('email', '')
    
    if not username or not password:
        return jsonify({'success': False, 'message': '用户名和密码不能为空'})
    
    # 从JSON文件获取用户数据
    users_data = read_users()
    
    # 检查用户名是否已存在
    if any(u['username'] == username for u in users_data['users']):
        return jsonify({'success': False, 'message': '用户名已存在'})
    
    # 检查邮箱是否已存在
    if email and any(u.get('email') == email for u in users_data['users']):
        return jsonify({'success': False, 'message': '邮箱已被注册'})
    
    # 生成用户ID
    user_id = max([u.get('id', 0) for u in users_data['users']], default=0) + 1
    
    # 创建新用户（不使用密码加密）
    new_user = {
        'id': user_id,
        'username': username,
        'password': password,  # 直接存储原始密码
        'email': email,
        'avatar': 'https://placehold.jp/40x40.png',
        'role': 'user',
        'registerDate': time.strftime('%Y-%m-%d')
    }
    
    # 添加新用户并保存
    users_data['users'].append(new_user)
    if save_users(users_data):
        return jsonify({'success': True, 'message': '注册成功'})
    else:
        return jsonify({'success': False, 'message': '注册失败，请稍后重试'})

@app.route('/api/user/logout', methods=['POST'])
def logout():
    """用户登出"""
    session.pop('username', None)
    return jsonify({'success': True, 'message': '退出成功'})

@app.route('/api/user/update', methods=['POST'])
def update_user():
    """更新用户信息"""
    try:
        # 检查用户是否登录
        username = session.get('username')
        if not username:
            return jsonify({'success': False, 'message': '请先登录'}), 401

        # 获取更新数据
        update_data = request.json
        if not update_data:
            return jsonify({'success': False, 'message': '没有提供更新数据'}), 400

        # 读取用户数据
        users_data = read_users()
        
        # 查找并更新用户
        user_found = False
        for user in users_data['users']:
            if user['username'] == username:
                # 只更新允许的字段
                allowed_fields = ['email', 'avatar', 'nickname', 'bio']
                for field in allowed_fields:
                    if field in update_data:
                        user[field] = update_data[field]
                user_found = True
                break

        if not user_found:
            return jsonify({'success': False, 'message': '用户不存在'}), 404

        # 保存更新后的数据
        if save_users(users_data):
            return jsonify({
                'success': True,
                'message': '用户信息更新成功',
                'user': {
                    'username': username,
                    'avatar': user.get('avatar', 'https://placehold.jp/100x100.png'),
                    'email': user.get('email', ''),
                    'nickname': user.get('nickname', username),
                    'bio': user.get('bio', '')
                }
            })
        else:
            return jsonify({'success': False, 'message': '保存用户数据失败'}), 500

    except Exception as e:
        print(f"更新用户信息失败: {str(e)}")
        return jsonify({'success': False, 'message': f'更新失败: {str(e)}'}), 500

@app.route('/api/user/profile/<username>', methods=['GET'])
def get_user_profile(username):
    """获取用户资料"""
    try:
        # 读取用户数据
        users_data = read_users()
        user = next((u for u in users_data['users'] if u['username'] == username), None)

        if not user:
            return jsonify({'success': False, 'message': '用户不存在'}), 404

        # 确保头像路径正确
        avatar = user.get('avatar', 'https://placehold.jp/100x100.png')
        if not avatar.startswith(('http://', 'https://')):
            avatar = avatar if avatar.startswith('/') else '/' + avatar

        # 获取注册日期字段（兼容不同的字段名）
        register_date = user.get('registerDate', user.get('registrationDate', ''))

        # 返回用户公开信息
        return jsonify({
            'success': True,
            'user': {
                'username': username,
                'avatar': avatar,
                'nickname': user.get('nickname', username),
                'bio': user.get('bio', ''),
                'email': user.get('email', ''),
                'registerDate': register_date,
                'role': user.get('role', 'user')
            }
        })

    except Exception as e:
        print(f"获取用户资料失败: {str(e)}")
        return jsonify({'success': False, 'message': f'获取用户资料失败: {str(e)}'}), 500

# 内容相关路由
@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    return jsonify(MOCK_REVIEWS)

@app.route('/api/market', methods=['GET'])
def get_market_items():
    return jsonify(MOCK_MARKET_ITEMS)

@app.route('/api/posts/hot', methods=['GET'])
def get_hot_posts():
    return jsonify(MOCK_HOT_POSTS)

@app.route('/api/history', methods=['GET'])
def get_recent_views():
    return jsonify(MOCK_RECENT_VIEWS)

@app.route('/api/projects/hot', methods=['GET'])
def get_hot_projects():
    return jsonify(MOCK_HOT_PROJECTS)

# API路由：获取所有帖子
@app.route('/api/posts', methods=['GET'])
def get_posts():
    """获取所有帖子"""
    try:
        data = read_posts()
        users_data = read_users()
        
        # 添加作者头像信息到帖子
        for post in data['posts']:
            user = next((u for u in users_data['users'] if u['username'] == post['author']), None)
            if user:
                avatar = user.get('avatar', 'https://placehold.jp/100x100.png')
                post['authorAvatar'] = avatar
            else:
                post['authorAvatar'] = 'https://placehold.jp/100x100.png'
        
        return jsonify(data)
    except Exception as e:
        print(f"获取帖子失败: {str(e)}")
        return jsonify({"success": False, "message": f"获取帖子失败: {str(e)}"}), 500

# API路由：创建新帖子
@app.route('/api/posts', methods=['POST'])
def create_post():
    """创建新帖子"""
    try:
        new_post = request.json
        data = read_posts()
        
        # 确保新帖子有ID
        if 'id' not in new_post:
            new_post['id'] = int(time.time() * 1000)  # 使用时间戳作为ID
        
        # 确保基本字段存在
        if 'likes' not in new_post:
            new_post['likes'] = 0
        
        if 'views' not in new_post:
            new_post['views'] = 0
            
        if 'favorites' not in new_post:
            new_post['favorites'] = 0
            
        # 确保点赞和收藏数组存在
        if 'likedBy' not in new_post:
            new_post['likedBy'] = []
            
        if 'favoritedBy' not in new_post:
            new_post['favoritedBy'] = []
        
        # 添加新帖子
        data['posts'].append(new_post)
        
        # 保存数据
        if save_posts(data):
            return jsonify({"success": True, "message": "帖子创建成功", "post": new_post}), 201
        else:
            return jsonify({"success": False, "message": "帖子保存失败"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"创建帖子失败: {str(e)}"}), 500

# API路由：获取特定帖子
@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    """获取特定帖子"""
    try:
        data = read_posts()
        users_data = read_users()
        
        for post in data['posts']:
            if post['id'] == post_id:
                # 添加作者头像信息
                user = next((u for u in users_data['users'] if u['username'] == post['author']), None)
                if user:
                    avatar = user.get('avatar', 'https://placehold.jp/100x100.png')
                    post['authorAvatar'] = avatar
                else:
                    post['authorAvatar'] = 'https://placehold.jp/100x100.png'
                
                return jsonify(post)
        
        return jsonify({"success": False, "message": "帖子不存在"}), 404
    except Exception as e:
        print(f"获取帖子详情失败: {str(e)}")
        return jsonify({"success": False, "message": f"获取帖子详情失败: {str(e)}"}), 500

# API路由：更新帖子
@app.route('/api/posts/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    """更新帖子"""
    try:
        updated_post = request.json
        data = read_posts()
        
        # 记录更新的内容（调试用）
        print(f"正在更新帖子ID: {post_id}")
        print(f"更新内容: {updated_post}")
        
        # 安全检查：确保更新数据中不包含可能导致JSON序列化错误的内容
        if 'coverImages' in updated_post and updated_post['coverImages'] is not None:
            if not isinstance(updated_post['coverImages'], list):
                # 如果coverImages不是列表，删除它
                del updated_post['coverImages']
                print("警告: coverImages字段不是列表，已删除")
            else:
                # 过滤掉不合法的URLs
                valid_images = []
                for url in updated_post['coverImages']:
                    if isinstance(url, str) and len(url) < 10000 and not any(c in url for c in ['\\', '<', '>']):
                        valid_images.append(url)
                    else:
                        print(f"警告: 过滤掉无效的URL: {url[:50]}...")
                
                if valid_images:
                    updated_post['coverImages'] = valid_images
                else:
                    del updated_post['coverImages']
                    print("警告: 所有coverImages都无效，已删除该字段")
        
        # 处理点赞和收藏数组
        if 'likedBy' in updated_post and not isinstance(updated_post['likedBy'], list):
            updated_post['likedBy'] = []
            print("警告: likedBy字段不是列表，已重置为空列表")
            
        if 'favoritedBy' in updated_post and not isinstance(updated_post['favoritedBy'], list):
            updated_post['favoritedBy'] = []
            print("警告: favoritedBy字段不是列表，已重置为空列表")
        
        found = False
        for i, post in enumerate(data['posts']):
            if post['id'] == post_id:
                found = True
                
                # 局部更新帖子数据，而不是完全替换
                for key, value in updated_post.items():
                    data['posts'][i][key] = value
                
                # 保存前进行JSON序列化测试
                try:
                    json.dumps(data, ensure_ascii=False)
                except Exception as json_error:
                    print(f"警告: JSON序列化失败: {str(json_error)}")
                    return jsonify({"success": False, "message": f"更新帖子失败: 数据格式错误 - {str(json_error)}"}), 400
                
                # 保存数据
                if save_posts(data):
                    print(f"帖子更新成功: {updated_post}")
                    return jsonify({"success": True, "message": "帖子更新成功", "post": data['posts'][i]})
                else:
                    print("帖子保存失败")
                    return jsonify({"success": False, "message": "帖子保存失败"}), 500
        
        if not found:
            print(f"帖子不存在: {post_id}")
            return jsonify({"message": "帖子不存在"}), 404
    except Exception as e:
        print(f"更新帖子异常: {str(e)}")
        return jsonify({"success": False, "message": f"更新帖子失败: {str(e)}"}), 500

# API路由：获取评论
@app.route('/api/comments/<post_id>', methods=['GET'])
def get_comments(post_id):
    """获取指定帖子的评论，支持按时间排序"""
    try:
        # 获取排序参数，默认为倒序（最新的在前）
        sort_order = request.args.get('sort', 'desc')
        
        data = read_comments()
        users_data = read_users()
        comments = data['comments'].get(post_id, [])
        
        # 确保评论有时间戳字段，同时保留回复数据
        for comment in comments:
            if 'timestamp' not in comment:
                # 如果没有时间戳，使用id作为时间戳（因为id是基于时间戳生成的）
                comment['timestamp'] = comment.get('id', 0)
            # 确保回复数组存在
            if 'replies' not in comment:
                comment['replies'] = []
            # 确保每个回复也有时间戳
            for reply in comment['replies']:
                if 'timestamp' not in reply:
                    reply['timestamp'] = reply.get('id', 0)
            
            # 添加评论者头像
            user = next((u for u in users_data['users'] if u['username'] == comment['author']), None)
            if user:
                avatar = user.get('avatar', 'https://placehold.jp/100x100.png')
                comment['authorAvatar'] = avatar
            else:
                comment['authorAvatar'] = 'https://placehold.jp/100x100.png'
            
            # 添加回复者头像
            for reply in comment['replies']:
                reply_user = next((u for u in users_data['users'] if u['username'] == reply['author']), None)
                if reply_user:
                    reply_avatar = reply_user.get('avatar', 'https://placehold.jp/100x100.png')
                    reply['authorAvatar'] = reply_avatar
                else:
                    reply['authorAvatar'] = 'https://placehold.jp/100x100.png'
        
        # 根据排序参数对评论进行排序（只排序主评论，不排序回复）
        if sort_order.lower() == 'asc':
            # 正序：最早的在前
            comments.sort(key=lambda x: x.get('timestamp', 0))
        else:
            # 倒序：最新的在前
            comments.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
        
        return jsonify({
            "success": True,
            "comments": comments,
            "sort": sort_order
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"获取评论失败: {str(e)}"
        }), 500

# API路由：获取所有评论
@app.route('/api/comments', methods=['GET'])
def get_all_comments():
    """获取所有评论数据"""
    data = read_comments()
    return jsonify({"comments": data['comments']})

# API路由：更新评论
@app.route('/api/comments/<post_id>/<comment_id>', methods=['PUT'])
def update_comment(post_id, comment_id):
    """更新评论（包括添加回复）"""
    try:
        updated_comment = request.json
        data = read_comments()
        
        # 确保帖子存在
        if post_id not in data['comments']:
            return jsonify({"success": False, "message": "帖子不存在"}), 404
        
        # 查找要更新的评论
        comment_index = None
        for i, comment in enumerate(data['comments'][post_id]):
            if str(comment['id']) == str(comment_id):
                comment_index = i
                break
        
        if comment_index is None:
            return jsonify({"success": False, "message": "评论不存在"}), 404
        
        # 确保基本结构完整
        if 'replies' not in updated_comment:
            updated_comment['replies'] = []
            
        if 'likedBy' not in updated_comment:
            updated_comment['likedBy'] = []
            
        # 确保每个回复都有基本结构
        for reply in updated_comment['replies']:
            if 'timestamp' not in reply:
                reply['timestamp'] = reply.get('id', 0)
            if 'likedBy' not in reply:
                reply['likedBy'] = []
            if 'likes' not in reply:
                reply['likes'] = 0
        
        # 更新评论
        data['comments'][post_id][comment_index] = updated_comment
        
        # 保存数据
        if save_comments(data):
            return jsonify({
                "success": True,
                "message": "评论更新成功",
                "comment": updated_comment
            })
        else:
            return jsonify({"success": False, "message": "评论保存失败"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"更新评论失败: {str(e)}"}), 500

# API路由：删除评论
@app.route('/api/comments/<post_id>/<comment_id>', methods=['DELETE'])
def delete_comment(post_id, comment_id):
    """删除评论"""
    try:
        # 检查用户是否登录
        username = session.get('username')
        if not username:
            return jsonify({"success": False, "message": "请先登录"}), 401

        data = read_comments()
        
        # 确保帖子存在
        if post_id not in data['comments']:
            return jsonify({"success": False, "message": "帖子不存在"}), 404
        
        # 查找要删除的评论
        comment_index = None
        for i, comment in enumerate(data['comments'][post_id]):
            if str(comment['id']) == str(comment_id):
                # 检查是否是评论作者
                if comment['author'] != username:
                    return jsonify({"success": False, "message": "只能删除自己的评论"}), 403
                comment_index = i
                break
        
        if comment_index is None:
            return jsonify({"success": False, "message": "评论不存在"}), 404
        
        # 删除评论
        del data['comments'][post_id][comment_index]
        
        # 如果帖子没有评论了，删除帖子的评论列表
        if not data['comments'][post_id]:
            del data['comments'][post_id]
        
        # 保存数据
        if save_comments(data):
            return jsonify({"success": True, "message": "评论删除成功"})
        else:
            return jsonify({"success": False, "message": "评论保存失败"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"删除评论失败: {str(e)}"}), 500

@app.route('/api/comments/<post_id>', methods=['POST'])
def add_comment(post_id):
    """添加评论"""
    try:
        new_comment = request.json
        data = read_comments()
        
        # 确保评论有ID
        if 'id' not in new_comment:
            new_comment['id'] = int(time.time() * 1000)  # 使用时间戳作为ID
        
        # 确保评论有基本结构
        if 'likes' not in new_comment:
            new_comment['likes'] = 0
            
        if 'likedBy' not in new_comment:
            new_comment['likedBy'] = []
            
        if 'replies' not in new_comment:
            new_comment['replies'] = []
        
        # 确保帖子的评论列表存在
        if post_id not in data['comments']:
            data['comments'][post_id] = []
        
        # 添加新评论
        data['comments'][post_id].insert(0, new_comment)  # 添加到列表开头
        
        # 保存数据
        if save_comments(data):
            return jsonify({"success": True, "message": "评论添加成功", "comment": new_comment}), 201
        else:
            return jsonify({"success": False, "message": "评论保存失败"}), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"添加评论失败: {str(e)}"}), 500

@app.route('/api/github/user/<username>/repos', methods=['GET'])
def get_user_repos(username):
    """获取用户的GitHub仓库列表"""
    try:
        repos = github_service.get_user_repos(username)
        return jsonify({
            'success': True,
            'data': repos
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/github/trending', methods=['GET'])
def get_trending_repos():
    """获取GitHub热门仓库"""
    try:
        time_range = request.args.get('timeRange', 'all')
        language = request.args.get('language', None)
        page = int(request.args.get('page', 1))
        
        # 将前端传来的timeRange转换为API的格式
        time_map = {
            'all': 'all',
            'yearly': 'yearly',
            'monthly': 'monthly',
            'weekly': 'weekly',
            'daily': 'daily'
        }
        
        api_time_range = time_map.get(time_range, 'all')
        
        repos = github_service.get_trending_repos(language, api_time_range, 10)
        return jsonify({
            'success': True,
            'data': repos
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/github/repo/<owner>/<repo>', methods=['GET'])
def get_repo_info(owner, repo):
    """获取仓库详细信息"""
    try:
        repo_info = github_service.get_repo_info(owner, repo)
        languages = github_service.get_repo_languages(owner, repo)
        contributors = github_service.get_repo_contributors(owner, repo)
        
        return jsonify({
            'success': True,
            'data': {
                'info': repo_info,
                'languages': languages,
                'contributors': contributors
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/github/rate-limit', methods=['GET'])
def check_rate_limit():
    """检查GitHub API速率限制"""
    try:
        rate_limit = github_service.check_rate_limit()
        return jsonify({
            'success': True,
            'data': rate_limit
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/github/common', methods=['GET'])
def get_common_projects():
    try:
        # 获取查询参数
        tech = request.args.get('tech', 'all')
        project_type = request.args.get('type', 'all')
        
        # 使用GitHub服务获取常用项目
        if github_service:
            try:
                # 调用GitHub服务
                projects = github_service.get_common_projects(tech, project_type)
                return jsonify({
                    'success': True,
                    'data': projects
                })
            except Exception as e:
                print(f"GitHub API调用错误: {str(e)}")
                # 如果API调用失败，返回模拟数据
        
        # 返回模拟数据
        mock_data = generate_mock_common_projects(tech, project_type)
        return jsonify({
            'success': True,
            'data': mock_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"获取常用项目失败: {str(e)}"
        })

def generate_mock_common_projects(tech, project_type):
    """生成模拟的常用项目数据"""
    # 模拟数据库中的项目
    all_projects = [
        # Python - Web
        {
            "id": 1, "name": "flask", "owner": {"login": "pallets"},
            "html_url": "https://github.com/pallets/flask",
            "description": "轻量级的Python Web框架",
            "stargazers_count": 60000, "forks_count": 15000, "language": "Python", 
            "type": "web"
        },
        {
            "id": 2, "name": "django", "owner": {"login": "django"},
            "html_url": "https://github.com/django/django",
            "description": "高级Python Web框架",
            "stargazers_count": 65000, "forks_count": 28000, "language": "Python",
            "type": "web"
        },
        # JavaScript - Web
        {
            "id": 3, "name": "react", "owner": {"login": "facebook"},
            "html_url": "https://github.com/facebook/react",
            "description": "用于构建用户界面的JavaScript库",
            "stargazers_count": 200000, "forks_count": 40000, "language": "JavaScript",
            "type": "web"
        },
        {
            "id": 4, "name": "vue", "owner": {"login": "vuejs"},
            "html_url": "https://github.com/vuejs/vue",
            "description": "渐进式JavaScript框架",
            "stargazers_count": 200000, "forks_count": 32000, "language": "JavaScript",
            "type": "web"
        },
        # Java - Mobile
        {
            "id": 5, "name": "android", "owner": {"login": "android"},
            "html_url": "https://github.com/android/android-ktx",
            "description": "Android开发工具集",
            "stargazers_count": 10000, "forks_count": 2000, "language": "Java",
            "type": "mobile"
        },
        # C++ - Desktop
        {
            "id": 6, "name": "electron", "owner": {"login": "electron"},
            "html_url": "https://github.com/electron/electron",
            "description": "使用JavaScript构建跨平台桌面应用",
            "stargazers_count": 100000, "forks_count": 17000, "language": "C++",
            "type": "desktop"
        },
        # C++ - Game
        {
            "id": 7, "name": "godot", "owner": {"login": "godotengine"},
            "html_url": "https://github.com/godotengine/godot",
            "description": "开源游戏引擎",
            "stargazers_count": 50000, "forks_count": 10000, "language": "C++",
            "type": "game"
        }
    ]
    
    # 根据筛选条件过滤项目
    filtered_projects = all_projects
    
    if tech != 'all':
        filtered_projects = [p for p in filtered_projects if p["language"].lower() == tech.lower()]
        
    if project_type != 'all':
        filtered_projects = [p for p in filtered_projects if p["type"].lower() == project_type.lower()]
    
    return filtered_projects

# API路由：上传图片
@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    try:
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'message': '没有选择文件'
            }), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': '没有选择文件'
            }), 400
            
        # 获取目录参数，默认为posts
        directory = request.form.get('directory', 'posts')
        
        # 构建完整的上传目录
        upload_directory = os.path.join(BASE_DIR, 'frontend', 'images', directory)
        
        # 确保目录存在
        os.makedirs(upload_directory, exist_ok=True)
        
        # 获取文件名
        filename = request.form.get('filename', secure_filename(file.filename))
        
        # 防止文件名冲突
        unique_filename = f"{int(time.time())}_{filename}"
        
        # 保存文件
        file_path = os.path.join(upload_directory, unique_filename)
        file.save(file_path)
        
        # 返回可访问的URL（使用相对路径）
        return jsonify({
            'success': True,
            'imageId': unique_filename.split('.')[0],
            'imageUrl': f"/images/{directory}/{unique_filename}",
            'message': '图片上传成功'
        })
    except Exception as e:
        print(f"上传图片失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'上传失败: {str(e)}'
        }), 500

# 添加静态文件路由（放在最后作为catch-all路由）
@app.route('/<path:path>')
def serve_static(path):
    # 处理所有静态文件请求
    if path.startswith('images/'):
        # 对于图片请求，从frontend目录提供
        return send_from_directory(os.path.join(BASE_DIR, 'frontend'), path)
    return send_from_directory(os.path.join(BASE_DIR, 'frontend'), path)

# 注册蓝图
app.register_blueprint(user_bp)

# API路由：删除回复
@app.route('/api/comments/<post_id>/<comment_id>/replies/<reply_id>', methods=['DELETE'])
def delete_reply(post_id, comment_id, reply_id):
    """删除评论下的回复"""
    try:
        # 检查用户是否登录
        username = session.get('username')
        if not username:
            return jsonify({"success": False, "message": "请先登录"}), 401

        data = read_comments()
        
        # 确保帖子存在
        if post_id not in data['comments']:
            return jsonify({"success": False, "message": "帖子不存在"}), 404
        
        # 查找评论
        comment_index = None
        for i, comment in enumerate(data['comments'][post_id]):
            if str(comment['id']) == str(comment_id):
                comment_index = i
                break
        
        if comment_index is None:
            return jsonify({"success": False, "message": "评论不存在"}), 404

        comment = data['comments'][post_id][comment_index]
        
        # 确保回复数组存在
        if 'replies' not in comment:
            comment['replies'] = []
            return jsonify({"success": False, "message": "回复不存在"}), 404
        
        # 查找要删除的回复
        reply_index = None
        for i, reply in enumerate(comment['replies']):
            if str(reply['id']) == str(reply_id):
                # 检查是否是回复作者
                if reply['author'] != username:
                    return jsonify({"success": False, "message": "只能删除自己的回复"}), 403
                reply_index = i
                break
        
        if reply_index is None:
            return jsonify({"success": False, "message": "回复不存在"}), 404
        
        # 删除回复
        del comment['replies'][reply_index]
        
        # 保存数据
        if not save_comments(data):
            return jsonify({"success": False, "message": "保存数据失败"}), 500
            
        # 返回成功响应，确保包含 success 字段
        return jsonify({
            "success": True, 
            "message": "回复删除成功",
            "data": {
                "postId": post_id,
                "commentId": comment_id,
                "replyId": reply_id
            }
        })
            
    except Exception as e:
        print(f"删除回复失败: {str(e)}")
        return jsonify({
            "success": False, 
            "message": f"删除回复失败: {str(e)}"
        }), 500

# 读取课程数据
def read_courses():
    try:
        with open(COURSES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"读取课程数据失败: {str(e)}")
        return []

# 保存课程数据
def save_courses(data):
    try:
        json_string = json.dumps(data, ensure_ascii=False, indent=4)
        temp_file = f"{COURSES_FILE}.temp"
        with open(temp_file, 'w', encoding='utf-8') as f:
            f.write(json_string)
        if os.path.exists(temp_file):
            if os.path.exists(COURSES_FILE) and os.name == 'nt':
                try:
                    os.remove(COURSES_FILE)
                except Exception as e:
                    print(f"删除原课程文件失败: {str(e)}")
            os.replace(temp_file, COURSES_FILE)
        return True
    except Exception as e:
        print(f"保存课程数据失败: {str(e)}")
        return False

# 添加课程接口
@app.route('/api/courses', methods=['POST'])
def add_course():
    try:
        course = request.get_json()
        if not course:
            return jsonify({'success': False, 'message': '缺少课程数据'}), 400
        # 读取现有课程
        courses = read_courses()
        # 自动生成ID
        course['id'] = int(time.time() * 1000)
        # 默认字段补全
        course.setdefault('rating', 0)
        course.setdefault('reviewCount', 0)
        courses.append(course)
        if save_courses(courses):
            return jsonify({'success': True, 'message': '课程添加成功', 'course': course})
        else:
            return jsonify({'success': False, 'message': '保存课程失败'}), 500
    except Exception as e:
        print(f"添加课程失败: {str(e)}")
        return jsonify({'success': False, 'message': f'添加课程失败: {str(e)}'}), 500

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    """删除指定的帖子，只有帖子作者才能删除"""
    try:
        # 检查用户是否已登录
        current_user = get_current_user()
        if not current_user:
            return jsonify({"success": False, "message": "请先登录"}), 401
        
        # 加载帖子数据
        posts_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'data', 'posts.json')
        with open(posts_file_path, 'r', encoding='utf-8') as f:
            posts_data = json.load(f)
        
        # 查找要删除的帖子
        post_index = None
        for i, post in enumerate(posts_data['posts']):
            if post['id'] == post_id:
                post_index = i
                break
        
        # 如果帖子不存在
        if post_index is None:
            return jsonify({"success": False, "message": "帖子不存在"}), 404
        
        # 检查当前用户是否是帖子作者
        post = posts_data['posts'][post_index]
        if post['author'] != current_user['username'] and current_user['role'] != 'admin':
            return jsonify({"success": False, "message": "您没有权限删除此帖子"}), 403
        
        # 删除帖子
        deleted_post = posts_data['posts'].pop(post_index)
        
        # 保存更新后的帖子数据
        with open(posts_file_path, 'w', encoding='utf-8') as f:
            json.dump(posts_data, f, ensure_ascii=False, indent=4)
        
        # 删除该帖子的所有评论
        try:
            comments_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'data', 'comments.json')
            if os.path.exists(comments_file_path):
                with open(comments_file_path, 'r', encoding='utf-8') as f:
                    comments_data = json.load(f)
                
                # 删除该帖子的评论
                if str(post_id) in comments_data:
                    del comments_data[str(post_id)]
                    
                    # 保存更新后的评论数据
                    with open(comments_file_path, 'w', encoding='utf-8') as f:
                        json.dump(comments_data, f, ensure_ascii=False, indent=4)
        except Exception as e:
            # 即使删除评论失败，也继续返回成功（帖子已删除）
            print(f"删除帖子评论时出错: {str(e)}")
        
        return jsonify({
            "success": True,
            "message": "帖子已成功删除",
            "deletedPost": deleted_post
        })
    
    except Exception as e:
        print(f"删除帖子时出错: {str(e)}")
        return jsonify({"success": False, "message": f"删除帖子失败: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 