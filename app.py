from flask import Flask, render_template
from flask_cors import CORS
from backend.routes.user_routes import user_bp
from backend.routes.content_routes import content_bp
from backend.routes.upload_routes import upload_bp

app = Flask(__name__)
CORS(app)  # 允许跨域请求
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 限制上传大小为5MB

# 注册蓝图
app.register_blueprint(user_bp)
app.register_blueprint(content_bp)
app.register_blueprint(upload_bp)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True) 