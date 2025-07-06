FROM python:3.9-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 安装 Gunicorn
RUN pip install gunicorn

# 复制应用代码
COPY . .

# 创建非root用户
RUN useradd -m -u 1000 duckstudy && \
    chown -R duckstudy:duckstudy /app
USER duckstudy

# 创建日志目录
RUN mkdir -p logs

EXPOSE 8000

CMD ["gunicorn", "-c", "gunicorn.conf.py", "backend.app:app"] 