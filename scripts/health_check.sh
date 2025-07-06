#!/bin/bash

# DuckStudy 健康检查脚本
# 使用方法: ./scripts/health_check.sh

set -e

# 配置变量
SERVICE_URL="http://localhost:8000"
HEALTH_ENDPOINT="/api/health"
LOG_FILE="/var/log/duckstudy/health_check.log"
ALERT_EMAIL="admin@example.com"
RETRY_COUNT=3
RETRY_DELAY=5

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARN] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> "$LOG_FILE"
}

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

# 健康检查函数
check_service_health() {
    local url="$SERVICE_URL$HEALTH_ENDPOINT"
    local response_code
    local response_time
    
    log_info "开始健康检查: $url"
    
    # 检查服务响应
    response_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$url")
    response_time=$(curl -s -o /dev/null -w "%{time_total}" --connect-timeout 10 --max-time 30 "$url")
    
    if [ "$response_code" -eq 200 ]; then
        log_info "服务健康检查通过 - HTTP状态码: $response_code, 响应时间: ${response_time}s"
        return 0
    else
        log_error "服务健康检查失败 - HTTP状态码: $response_code"
        return 1
    fi
}

# 检查系统资源
check_system_resources() {
    log_info "检查系统资源..."
    
    # 检查磁盘使用率
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        log_warn "磁盘使用率过高: ${disk_usage}%"
    else
        log_info "磁盘使用率正常: ${disk_usage}%"
    fi
    
    # 检查内存使用率
    memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$memory_usage" -gt 90 ]; then
        log_warn "内存使用率过高: ${memory_usage}%"
    else
        log_info "内存使用率正常: ${memory_usage}%"
    fi
    
    # 检查CPU负载
    cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    log_info "CPU负载: $cpu_load"
}

# 检查进程状态
check_process_status() {
    log_info "检查进程状态..."
    
    # 检查Gunicorn进程
    if pgrep -f "gunicorn.*duckstudy" > /dev/null; then
        log_info "Gunicorn进程运行正常"
    else
        log_error "Gunicorn进程未运行"
        return 1
    fi
    
    # 检查Nginx进程
    if pgrep nginx > /dev/null; then
        log_info "Nginx进程运行正常"
    else
        log_error "Nginx进程未运行"
        return 1
    fi
}

# 重启服务
restart_service() {
    log_warn "尝试重启服务..."
    
    # 重启DuckStudy服务
    if command -v systemctl > /dev/null; then
        systemctl restart duckstudy
        log_info "已重启DuckStudy服务"
    else
        log_warn "无法使用systemctl重启服务"
    fi
    
    # 等待服务启动
    sleep 10
    
    # 再次检查健康状态
    if check_service_health; then
        log_info "服务重启成功"
        return 0
    else
        log_error "服务重启失败"
        return 1
    fi
}

# 发送告警
send_alert() {
    local message="$1"
    log_error "发送告警: $message"
    
    # 这里可以集成邮件、短信或其他告警方式
    # 示例：发送邮件
    # echo "$message" | mail -s "DuckStudy服务告警" "$ALERT_EMAIL"
    
    # 示例：发送到Slack
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"$message\"}" \
    #     https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
}

# 主函数
main() {
    log_info "=== DuckStudy 健康检查开始 ==="
    
    # 检查系统资源
    check_system_resources
    
    # 检查进程状态
    if ! check_process_status; then
        log_error "进程状态检查失败"
        send_alert "DuckStudy进程状态异常"
        exit 1
    fi
    
    # 健康检查重试机制
    local retry=0
    while [ $retry -lt $RETRY_COUNT ]; do
        if check_service_health; then
            log_info "=== 健康检查完成 - 服务正常 ==="
            exit 0
        else
            retry=$((retry + 1))
            if [ $retry -lt $RETRY_COUNT ]; then
                log_warn "健康检查失败，${RETRY_DELAY}秒后重试 ($retry/$RETRY_COUNT)"
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    # 所有重试都失败，尝试重启服务
    log_error "健康检查失败，尝试重启服务"
    if restart_service; then
        log_info "服务重启成功，健康检查通过"
        send_alert "DuckStudy服务已自动重启并恢复正常"
    else
        log_error "服务重启失败"
        send_alert "DuckStudy服务异常，自动重启失败，需要人工干预"
        exit 1
    fi
}

# 执行主函数
main "$@" 