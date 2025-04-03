import { userAPI, contentAPI } from './api.js';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 更新用户状态
        await updateUserStatus();
        
        // 添加导航切换事件
        addNavEvents();
        
        // 加载收藏内容
        await loadFavorites('all');
        
        // 添加清空收藏事件
        addClearFavoritesEvent();
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

// 加载收藏内容
async function loadFavorites(type) {
    try {
        const favoritesContainer = document.getElementById('favoritesContainer');
        if (!favoritesContainer) {
            console.error('未找到收藏容器元素');
            return;
        }
        
        // 显示加载状态
        favoritesContainer.innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
            </div>
        `;
        
        // 这里应该调用后端API获取收藏内容
        // 目前使用模拟数据
        const mockFavorites = {
            all: [
                {
                    type: 'course',
                    id: 1,
                    title: 'Python基础教程',
                    description: '从零开始学习Python编程',
                    image: '../images/course1.jpg',
                    instructor: '张老师',
                    rating: 4.8
                },
                {
                    type: 'post',
                    id: 2,
                    title: '如何提高学习效率',
                    description: '分享一些实用的学习方法',
                    author: '李同学',
                    date: '2024-01-15',
                    views: 1234
                },
                {
                    type: 'market',
                    id: 3,
                    title: '二手教材',
                    description: '数据结构与算法分析',
                    price: 50,
                    seller: '王同学',
                    date: '2024-01-10'
                }
            ]
        };
        
        const favorites = mockFavorites[type] || [];
        
        if (favorites.length === 0) {
            favoritesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-heart"></i>
                    <p>暂无收藏内容</p>
                </div>
            `;
            return;
        }
        
        // 渲染收藏内容
        favoritesContainer.innerHTML = favorites.map(item => {
            switch (item.type) {
                case 'course':
                    return `
                        <div class="favorite-item course-item">
                            <div class="item-image">
                                <img src="${item.image}" alt="${item.title}">
                            </div>
                            <div class="item-content">
                                <h3 class="item-title">${item.title}</h3>
                                <p class="item-description">${item.description}</p>
                                <div class="item-meta">
                                    <span class="instructor">
                                        <i class="bi bi-person"></i> ${item.instructor}
                                    </span>
                                    <span class="rating">
                                        <i class="bi bi-star-fill"></i> ${item.rating}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
                case 'post':
                    return `
                        <div class="favorite-item post-item">
                            <div class="item-content">
                                <h3 class="item-title">${item.title}</h3>
                                <p class="item-description">${item.description}</p>
                                <div class="item-meta">
                                    <span class="author">
                                        <i class="bi bi-person"></i> ${item.author}
                                    </span>
                                    <span class="date">
                                        <i class="bi bi-calendar"></i> ${item.date}
                                    </span>
                                    <span class="views">
                                        <i class="bi bi-eye"></i> ${item.views}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
                case 'market':
                    return `
                        <div class="favorite-item market-item">
                            <div class="item-content">
                                <h3 class="item-title">${item.title}</h3>
                                <p class="item-description">${item.description}</p>
                                <div class="item-meta">
                                    <span class="price">
                                        <i class="bi bi-currency-yen"></i> ${item.price}
                                    </span>
                                    <span class="seller">
                                        <i class="bi bi-person"></i> ${item.seller}
                                    </span>
                                    <span class="date">
                                        <i class="bi bi-calendar"></i> ${item.date}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
                default:
                    return '';
            }
        }).join('');
        
    } catch (error) {
        console.error('加载收藏内容失败:', error);
        favoritesContainer.innerHTML = `
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
            
            // 加载对应类型的收藏内容
            const type = item.getAttribute('data-type');
            await loadFavorites(type);
        });
    });
}

// 添加清空收藏事件
function addClearFavoritesEvent() {
    const clearBtn = document.getElementById('clearFavoritesBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (!confirm('确定要清空所有收藏吗？此操作不可恢复。')) {
                return;
            }
            
            try {
                // 这里应该调用后端API清空收藏
                console.log('清空收藏');
                alert('清空成功！');
                
                // 重新加载收藏内容
                await loadFavorites('all');
            } catch (error) {
                console.error('清空收藏失败:', error);
                alert('清空失败，请重试');
            }
        });
    }
} 