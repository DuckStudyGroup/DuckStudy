#!/bin/bash

# DuckStudy 数据备份脚本
# 使用方法: ./scripts/backup.sh

set -e

# 配置变量
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/duckstudy"
PROJECT_DIR="/home/duckstudy/DuckStudy"
RETENTION_DAYS=30

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查项目目录是否存在
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "项目目录不存在: $PROJECT_DIR"
    exit 1
fi

# 创建备份目录
log_info "创建备份目录: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# 备份数据文件
log_info "开始备份数据文件..."
tar -czf "$BACKUP_DIR/data_$DATE.tar.gz" \
    -C "$PROJECT_DIR" \
    frontend/data/ \
    frontend/images/

# 检查备份是否成功
if [ $? -eq 0 ]; then
    log_info "数据备份成功: data_$DATE.tar.gz"
else
    log_error "数据备份失败"
    exit 1
fi

# 备份配置文件
log_info "开始备份配置文件..."
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
    -C "$PROJECT_DIR" \
    backend/.env \
    backend/config/ \
    gunicorn.conf.py \
    nginx.conf \
    docker-compose.yml

if [ $? -eq 0 ]; then
    log_info "配置文件备份成功: config_$DATE.tar.gz"
else
    log_warn "配置文件备份失败"
fi

# 备份日志文件
if [ -d "$PROJECT_DIR/logs" ]; then
    log_info "开始备份日志文件..."
    tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" \
        -C "$PROJECT_DIR" \
        logs/
    
    if [ $? -eq 0 ]; then
        log_info "日志文件备份成功: logs_$DATE.tar.gz"
    else
        log_warn "日志文件备份失败"
    fi
fi

# 创建备份清单
log_info "创建备份清单..."
cat > "$BACKUP_DIR/backup_$DATE.txt" << EOF
备份时间: $(date)
备份内容:
- 数据文件: data_$DATE.tar.gz
- 配置文件: config_$DATE.tar.gz
- 日志文件: logs_$DATE.tar.gz

备份大小:
$(du -h "$BACKUP_DIR"/*_$DATE.* 2>/dev/null || echo "无法获取文件大小")

备份位置: $BACKUP_DIR
EOF

# 清理旧备份
log_info "清理 $RETENTION_DAYS 天前的旧备份..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "backup_*.txt" -mtime +$RETENTION_DAYS -delete

# 显示备份统计
log_info "备份完成！"
log_info "当前备份文件:"
ls -lh "$BACKUP_DIR"/*_$DATE.* 2>/dev/null || echo "无备份文件"

log_info "备份目录总大小:"
du -sh "$BACKUP_DIR" 2>/dev/null || echo "无法获取目录大小"

log_info "备份脚本执行完成" 