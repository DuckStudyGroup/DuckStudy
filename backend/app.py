from flask import Flask, jsonify, request, session, send_from_directory
from flask_cors import CORS
import json
import os

# 获取当前文件所在目录的父目录（项目根目录）
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__, static_folder=os.path.join(BASE_DIR, 'frontend'))

# 配置CORS
CORS(app, 
     supports_credentials=True,
     resources={
         r"/*": {
             "origins": ["http://localhost:5000", "http://127.0.0.1:5000"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"]
         }
     })

# 设置密钥
app.secret_key = 'your-secret-key'

# 用户数据存储（临时使用内存存储）
USERS = {}

# 添加根路由
@app.route('/')
def index():
    return send_from_directory(os.path.join(BASE_DIR, 'frontend'), 'index.html')

# 添加静态文件路由
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(os.path.join(BASE_DIR, 'frontend'), path)

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
        'image': 'https://via.placeholder.com/200'
    },
    {
        'title': '编程书籍',
        'price': 50,
        'description': '《Python编程：从入门到实践》',
        'image': 'https://via.placeholder.com/200'
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
        'image': 'https://via.placeholder.com/150'
    },
    {
        'title': 'Web开发入门',
        'date': '2024-03-14',
        'image': 'https://via.placeholder.com/150'
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
    username = session.get('username')
    return jsonify({
        'isLoggedIn': username is not None,
        'username': username
    })

@app.route('/api/user/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username in USERS and USERS[username] == password:
        session['username'] = username
        return jsonify({'success': True, 'username': username})
    return jsonify({'success': False, 'message': '用户名或密码错误'})

@app.route('/api/user/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'message': '用户名和密码不能为空'})
    
    if username in USERS:
        return jsonify({'success': False, 'message': '用户名已存在'})
    
    USERS[username] = password
    return jsonify({'success': True, 'message': '注册成功'})

@app.route('/api/user/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({'success': True})

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

if __name__ == '__main__':
    app.run(debug=True) 