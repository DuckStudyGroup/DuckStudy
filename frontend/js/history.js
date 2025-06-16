import { userAPI, contentAPI } from './api.js';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 更新用户状态
        await updateUserStatus();
        // 初始化帖子数据
        await initPostsData();
        // 加载历史记录
        await loadHistory();
        // 添加清空历史事件
        addClearHistoryEvent();
    } catch (error) {
        console.error('加载数据失败:', error);
    }
});

// 初始化帖子数据
async function initPostsData() {
    try {
        const response = await contentAPI.getPosts();
        window.mockPosts = response.posts || [];
    } catch (error) {
        console.error('加载帖子数据失败:', error);
        window.mockPosts = [];
    }
}

// 更新用户状态
async function updateUserStatus() {
    try {
        const response = await userAPI.getStatus();
        const userSection = document.getElementById('userSection');
        
        if (!userSection) {
            console.error('未找到用户区域元素');
            return;
        }
        
        if (response.isLoggedIn) {
            userSection.innerHTML = `
                <div class="user-profile">
                    <div class="avatar-container">
                        <img src="${response.avatar}" alt="用户头像" class="avatar">
                        <div class="dropdown-menu">
                            <a href="profile.html" class="dropdown-item">
                                <i class="bi bi-person"></i> 个人中心
                            </a>
                            <a href="favorites.html" class="dropdown-item">
                                <i class="bi bi-heart"></i> 我的收藏
                            </a>
                            <a href="history.html" class="dropdown-item">
                                <i class="bi bi-clock-history"></i> 浏览历史
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="#" class="dropdown-item" id="logoutBtn">
                                <i class="bi bi-box-arrow-right"></i> 退出登录
                            </a>
                        </div>
                    </div>
                    <span class="username">${response.username}</span>
                </div>
            `;

            // 添加退出登录事件监听
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        await userAPI.logout();
                        window.location.href = '../index.html';
                    } catch (error) {
                        console.error('退出登录失败:', error);
                        alert('退出登录失败，请重试');
                    }
                });
            }
        } else {
            userSection.innerHTML = `
                <a href="login.html" class="btn btn-outline-primary me-2">登录</a>
                <a href="register.html" class="btn btn-primary">注册</a>
            `;
        }
    } catch (error) {
        console.error('获取用户状态失败:', error);
        window.location.href = 'login.html';
    }
}

// 加载历史记录
async function loadHistory() {
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    const totalCount = document.getElementById('totalCount');

    try {
        // 从localStorage获取浏览历史
        const history = JSON.parse(localStorage.getItem('viewHistory') || '[]');
        
        // 按时间倒序排序
        history.sort((a, b) => b.timestamp - a.timestamp);
        
        // 更新总数
        totalCount.textContent = history.length;

        if (history.length === 0) {
            historyList.style.display = 'none';
            emptyState.style.display = 'flex';
            // 更新空状态显示
            emptyState.innerHTML = `
                <div class="empty-state-content">
                    <i class="bi bi-clock-history empty-icon"></i>
                    <h3>暂无浏览记录</h3>
                    <p>去论坛发现更多精彩内容</p>
                    <a href="posts.html" class="btn">
                        <i class="bi bi-arrow-right"></i>浏览论坛
                    </a>
                </div>
            `;
            return;
        }

        // 显示历史记录
        historyList.style.display = 'block';
        emptyState.style.display = 'none';
        
        // 生成历史记录HTML
        const historyHTML = history.map(item => {
            // 从全局帖子列表中查找帖子
            const post = window.mockPosts.find(p => p.id === parseInt(item.id));
            if (!post) {
                console.warn(`未找到帖子数据: ${item.id}`);
                return null;
            }

            return `
                <div class="history-item" data-id="${item.id}">
                    <div class="item-content">
                        <div class="item-info">
                            <h3 class="item-title">
                                <a href="post-detail.html?id=${item.id}">${post.title}</a>
                            </h3>
                            <div class="item-meta">
                                <span class="view-time">
                                    <i class="bi bi-clock"></i>
                                    ${formatDate(item.timestamp)}
                                </span>
                            </div>
                        </div>
                        <div class="item-actions">
                            <a href="post-detail.html?id=${item.id}" class="btn btn-outline-primary btn-sm">
                                <i class="bi bi-eye"></i> 查看
                            </a>
                            <button class="btn btn-outline-danger btn-sm" onclick="removeFromHistory('${item.id}')">
                                <i class="bi bi-trash"></i> 删除
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).filter(Boolean).join(''); // 过滤掉未找到帖子的记录

        historyList.innerHTML = historyHTML;
    } catch (error) {
        console.error('加载历史记录失败:', error);
        historyList.style.display = 'none';
        emptyState.style.display = 'flex';
        // 更新错误状态显示
        emptyState.innerHTML = `
            <div class="empty-state-content">
                <i class="bi bi-exclamation-circle empty-icon text-danger"></i>
                <h3>加载失败</h3>
                <p>请刷新页面重试</p>
                <button onclick="window.location.reload()" class="btn">
                    <i class="bi bi-arrow-clockwise"></i>刷新
                </button>
            </div>
        `;
    }
}

// 添加清空历史事件
function addClearHistoryEvent() {
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('确定要清空所有浏览历史吗？')) {
            localStorage.removeItem('viewHistory');
            loadHistory();
        }
    });
}

// 从历史记录中删除
window.removeFromHistory = function(postId) {
    if (confirm('确定要删除这条浏览记录吗？')) {
        const history = JSON.parse(localStorage.getItem('viewHistory') || '[]');
        // 确保 postId 是数字类型
        const postIdNum = Number(postId);
        const newHistory = history.filter(item => Number(item.id) !== postIdNum);
        localStorage.setItem('viewHistory', JSON.stringify(newHistory));
        loadHistory();
    }
};

// 格式化日期
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // 小于1分钟
    if (diff < 60000) {
        return '刚刚';
    }
    // 小于1小时
    if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`;
    }
    // 小于24小时
    if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`;
    }
    // 小于30天
    if (diff < 2592000000) {
        return `${Math.floor(diff / 86400000)}天前`;
    }
    // 大于30天
    return date.toLocaleDateString();
} 