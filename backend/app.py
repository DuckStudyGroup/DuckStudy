from flask import Flask, jsonify, request, session, send_from_directory
from flask_cors import CORS
import json
import os
import time
import hashlib  # 用于密码加密
from services.github_service import github_service
from dotenv import load_dotenv
import requests

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
        with open(POSTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        return True
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

# 添加静态文件路由
@app.route('/<path:path>')
def serve_static(path):
    # 处理所有静态文件请求
    return send_from_directory(os.path.join(BASE_DIR, 'frontend'), path)

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
            return jsonify({
                'isLoggedIn': True,
                'username': username,
                'avatar': user.get('avatar', ''),
                'role': user.get('role', 'user')
            })
    
    return jsonify({
        'isLoggedIn': False
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
    
    # 调试信息
    print(f"尝试登录的用户: {username}")
    print(f"用户数据: {user}")
    print(f"输入的密码: {password}")
    print(f"加密后的密码: {hash_password(password)}")
    print(f"存储的密码: {user['password'] if user else 'None'}")
    
    if user and user['password'] == password:  # 暂时不使用密码加密
        session['username'] = username
        return jsonify({
            'success': True, 
            'message': '登录成功',
            'user': {
                'username': user['username'],
                'avatar': user.get('avatar', ''),
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
    return jsonify(read_posts())

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
    data = read_posts()
    for post in data['posts']:
        if post['id'] == post_id:
            return jsonify(post)
    return jsonify({"message": "帖子不存在"}), 404

# API路由：更新帖子
@app.route('/api/posts/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    """更新帖子"""
    try:
        updated_post = request.json
        data = read_posts()
        
        for i, post in enumerate(data['posts']):
            if post['id'] == post_id:
                # 更新帖子数据
                data['posts'][i] = updated_post
                
                # 保存数据
                if save_posts(data):
                    return jsonify({"success": True, "message": "帖子更新成功", "post": updated_post})
                else:
                    return jsonify({"success": False, "message": "帖子保存失败"}), 500
        
        return jsonify({"message": "帖子不存在"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": f"更新帖子失败: {str(e)}"}), 500

# API路由：获取评论
@app.route('/api/comments/<post_id>', methods=['GET'])
def get_comments(post_id):
    """获取指定帖子的评论"""
    data = read_comments()
    return jsonify({"comments": data['comments'].get(post_id, [])})

# API路由：获取所有评论
@app.route('/api/comments', methods=['GET'])
def get_all_comments():
    """获取所有评论数据"""
    data = read_comments()
    return jsonify({"comments": data['comments']})

# API路由：添加评论
@app.route('/api/comments/<post_id>', methods=['POST'])
def add_comment(post_id):
    """添加评论"""
    try:
        new_comment = request.json
        data = read_comments()
        
        # 确保评论有ID
        if 'id' not in new_comment:
            new_comment['id'] = int(time.time() * 1000)  # 使用时间戳作为ID
        
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
            'year': 'year',
            'month': 'month',
            'week': 'week'
        }
        
        api_time_range = time_map.get(time_range, 'all')
        
        repos = github_service.get_trending_repos(api_time_range, language, page)
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

if __name__ == '__main__':
    app.run(debug=True, port=5000) 