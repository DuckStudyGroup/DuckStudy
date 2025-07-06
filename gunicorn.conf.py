# Gunicorn 配置文件
import os
import multiprocessing

# 绑定地址和端口
bind = "127.0.0.1:8000"

# 工作进程数
workers = multiprocessing.cpu_count() * 2 + 1

# 工作进程类型
worker_class = "sync"

# 每个工作进程的最大并发连接数
worker_connections = 1000

# 请求超时时间（秒）
timeout = 30

# Keep-alive 连接超时时间
keepalive = 2

# 每个工作进程处理的最大请求数
max_requests = 1000

# 最大请求数的抖动值
max_requests_jitter = 100

# 预加载应用
preload_app = True

# 日志配置
accesslog = "logs/gunicorn_access.log"
errorlog = "logs/gunicorn_error.log"
loglevel = "info"

# 进程名称
proc_name = "duckstudy"

# 用户和组（在生产环境中设置）
# user = "duckstudy"
# group = "duckstudy"

# 临时目录
tmp_upload_dir = "/tmp"

# 安全配置
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190 