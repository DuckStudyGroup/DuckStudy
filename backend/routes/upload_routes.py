import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

# 创建蓝图
upload_bp = Blueprint('upload', __name__, url_prefix='/api/upload')

# 配置上传路径
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_CONTENT_LENGTH = 2 * 1024 * 1024  # 2MB

# 确保上传目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 检查文件扩展名是否允许
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/image', methods=['POST'])
def upload_image():
    """
    上传图片接口
    ---
    返回:
      - 成功: {"success": true, "imageId": "...", "imageUrl": "...", "message": "上传成功"}
      - 失败: {"success": false, "message": "错误信息"}
    """
    try:
        # 检查是否有文件上传
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'message': '没有选择文件'
            }), 400
            
        file = request.files['image']
        
        # 检查是否选择了文件
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': '未选择文件'
            }), 400
            
        # 检查文件类型
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'message': f'不支持的文件类型，仅支持 {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
            
        # 生成安全的文件名
        filename = secure_filename(file.filename)
        # 添加UUID前缀，避免文件名冲突
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        
        # 保存文件
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        # 生成可访问的URL
        image_url = f"/static/uploads/{unique_filename}"
        
        # 返回成功响应
        return jsonify({
            'success': True,
            'imageId': unique_filename.split('.')[0],
            'imageUrl': image_url,
            'message': '图片上传成功'
        }), 200
        
    except Exception as e:
        # 记录错误日志
        print(f"图片上传失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'服务器错误: {str(e)}'
        }), 500 