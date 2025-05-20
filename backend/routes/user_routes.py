import os
import json
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

user_bp = Blueprint('user', __name__)

# 获取项目根目录
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 修改上传文件夹路径为绝对路径
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'frontend', 'images', 'avatars')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@user_bp.route('/api/upload-avatar', methods=['POST'])
def upload_avatar():
    if 'avatar' not in request.files:
        return jsonify({'error': '没有文件上传'}), 400
        
    file = request.files['avatar']
    username = request.form.get('username')
    
    if not username:
        return jsonify({'error': '用户名不能为空'}), 400
        
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
        
    if file and allowed_file(file.filename):
        try:
            # 生成安全的文件名
            filename = secure_filename(f"{username}_{file.filename}")
            
            # 确保上传目录存在
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            
            # 保存文件
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            
            # 更新用户数据中的头像URL
            users_file = os.path.join(BASE_DIR, 'frontend', 'data', 'users.json')
            with open(users_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            # 更新用户头像
            for user in data['users']:
                if user['username'] == username:
                    user['avatar'] = f'/images/avatars/{filename}'
                    break
                    
            # 保存更新后的用户数据
            with open(users_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            return jsonify({
                'success': True,
                'message': '头像上传成功',
                'avatarUrl': f'/images/avatars/{filename}'
            })
            
        except Exception as e:
            print(f"头像上传错误: {str(e)}")  # 添加错误日志
            return jsonify({'error': f'头像上传失败: {str(e)}'}), 500
            
    return jsonify({'error': '不支持的文件类型'}), 400 