import { userAPI, contentAPI } from './api.js';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 更新用户状态
        await updateUserStatus();
        
        // 添加导航切换事件
        addNavEvents();
        
        // 加载历史记录
        await loadHistory('all');
        
        // 添加清空历史事件
        addClearHistoryEvent();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
});

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
                        <div class="avatar">
                            <i class="bi bi-person-circle"></i>
                        </div>
                        <div class="dropdown-menu">
                            <a href="profile.html" class="dropdown-item">
                                <i class="bi bi-person"></i> 个人中心
                            </a>
                            <a href="favorites.html" class="dropdown-item">
                                <i class="bi bi-heart"></i> 我的收藏
                            </a>
                            <a href="history.html" class="dropdown-item">
                                <i class="bi bi-clock-history"></i> 历史观看
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
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('获取用户状态失败:', error);
        window.location.href = 'login.html';
    }
}

// 加载历史记录
async function loadHistory(type) {
    try {
        const historyList = document.getElementById('historyList');
        const emptyState = document.getElementById('emptyState');
        const totalCount = document.getElementById('totalCount');
        
        if (!historyList) {
            console.error('未找到历史记录列表元素');
            return;
        }
        
        // 显示加载状态
        historyList.innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
            </div>
        `;
        
        // 这里应该调用后端API获取历史记录
        // 目前使用模拟数据
        const mockHistory = {
            all: [
                {
                    type: 'course',
                    id: 1,
                    title: 'Python基础教程',
                    description: '从零开始学习Python编程',
                    image: '../images/course1.jpg',
                    instructor: '张老师',
                    duration: '2小时30分',
                    progress: 75,
                    lastWatchTime: '2024-03-15 14:30'
                },
                {
                    type: 'post',
                    id: 2,
                    title: '如何提高学习效率',
                    description: '分享一些实用的学习方法',
                    image: '../images/post1.jpg',
                    author: '李同学',
                    readTime: '10分钟',
                    lastReadTime: '2024-03-15 13:15'
                },
                {
                    type: 'video',
                    id: 3,
                    title: 'Web开发入门',
                    description: 'HTML、CSS和JavaScript基础教程',
                    image: '../images/video1.jpg',
                    duration: '1小时45分',
                    progress: 60,
                    lastWatchTime: '2024-03-14 16:20'
                }
            ]
        };
        
        const history = mockHistory[type] || [];
        
        // 更新总数
        if (totalCount) {
            totalCount.textContent = history.length;
        }
        
        if (history.length === 0) {
            historyList.style.display = 'none';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }
        
        // 显示历史记录列表
        historyList.style.display = 'block';
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // 渲染历史记录
        historyList.innerHTML = history.map(item => {
            switch (item.type) {
                case 'course':
                    return `
                        <div class="history-item course-item">
                            <img src="${item.image}" alt="${item.title}">
                            <div class="history-info">
                                <h3>${item.title}</h3>
                                <p>${item.description}</p>
                                <div class="history-meta">
                                    <span>
                                        <i class="bi bi-person"></i> ${item.instructor}
                                    </span>
                                    <span>
                                        <i class="bi bi-clock"></i> ${item.duration}
                                    </span>
                                    <span>
                                        <i class="bi bi-check-circle"></i> 进度 ${item.progress}%
                                    </span>
                                    <span>
                                        <i class="bi bi-calendar"></i> ${item.lastWatchTime}
                                    </span>
                                </div>
                            </div>
                            <div class="history-actions">
                                <button class="btn btn-link" title="继续学习">
                                    <i class="bi bi-play-circle"></i>
                                </button>
                                <button class="btn btn-link" title="删除记录">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                case 'post':
                    return `
                        <div class="history-item post-item">
                            <img src="${item.image}" alt="${item.title}">
                            <div class="history-info">
                                <h3>${item.title}</h3>
                                <p>${item.description}</p>
                                <div class="history-meta">
                                    <span>
                                        <i class="bi bi-person"></i> ${item.author}
                                    </span>
                                    <span>
                                        <i class="bi bi-clock"></i> ${item.readTime}
                                    </span>
                                    <span>
                                        <i class="bi bi-calendar"></i> ${item.lastReadTime}
                                    </span>
                                </div>
                            </div>
                            <div class="history-actions">
                                <button class="btn btn-link" title="继续阅读">
                                    <i class="bi bi-book"></i>
                                </button>
                                <button class="btn btn-link" title="删除记录">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                case 'video':
                    return `
                        <div class="history-item video-item">
                            <img src="${item.image}" alt="${item.title}">
                            <div class="history-info">
                                <h3>${item.title}</h3>
                                <p>${item.description}</p>
                                <div class="history-meta">
                                    <span>
                                        <i class="bi bi-clock"></i> ${item.duration}
                                    </span>
                                    <span>
                                        <i class="bi bi-check-circle"></i> 进度 ${item.progress}%
                                    </span>
                                    <span>
                                        <i class="bi bi-calendar"></i> ${item.lastWatchTime}
                                    </span>
                                </div>
                            </div>
                            <div class="history-actions">
                                <button class="btn btn-link" title="继续观看">
                                    <i class="bi bi-play-circle"></i>
                                </button>
                                <button class="btn btn-link" title="删除记录">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                default:
                    return '';
            }
        }).join('');
        
        // 添加删除记录事件
        addDeleteHistoryEvents();
        
    } catch (error) {
        console.error('加载历史记录失败:', error);
        historyList.innerHTML = `
            <div class="error-state">
                <i class="bi bi-exclamation-circle"></i>
                <p>加载失败，请重试</p>
            </div>
        `;
    }
}

// 添加导航切换事件
function addNavEvents() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // 移除所有活动状态
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // 添加当前活动状态
            item.classList.add('active');
            
            // 加载对应类型的历史记录
            const type = item.getAttribute('data-type');
            await loadHistory(type);
        });
    });
}

// 添加清空历史事件
function addClearHistoryEvent() {
    const clearBtn = document.getElementById('clearHistoryBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (!confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
                return;
            }
            
            try {
                // 这里应该调用后端API清空历史记录
                console.log('清空历史记录');
                alert('清空成功！');
                
                // 重新加载历史记录
                await loadHistory('all');
            } catch (error) {
                console.error('清空历史记录失败:', error);
                alert('清空失败，请重试');
            }
        });
    }
}

// 添加删除记录事件
function addDeleteHistoryEvents() {
    const deleteButtons = document.querySelectorAll('.history-actions .bi-trash');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const historyItem = e.target.closest('.history-item');
            const itemId = historyItem.dataset.id;
            
            if (!confirm('确定要删除这条历史记录吗？')) {
                return;
            }
            
            try {
                // 这里应该调用后端API删除历史记录
                console.log('删除历史记录:', itemId);
                historyItem.remove();
                
                // 检查是否还有历史记录
                const remainingItems = document.querySelectorAll('.history-item');
                if (remainingItems.length === 0) {
                    const emptyState = document.getElementById('emptyState');
                    if (emptyState) {
                        emptyState.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('删除历史记录失败:', error);
                alert('删除失败，请重试');
            }
        });
    });
} 