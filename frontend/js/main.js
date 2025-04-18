import { userAPI, contentAPI } from './api.js';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 首先更新用户状态
        await updateUserStatus();
        
        // 然后加载其他内容
        await Promise.all([
            loadReviews(),
            loadMarketItems(),
            loadHotPosts(),
            loadRecentViews()
        ]);
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
});

// 更新用户状态
async function updateUserStatus() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const userSection = document.getElementById('userSection');
    
    if (!userSection) {
        console.error('未找到用户区域元素');
        return;
    }
    
    if (userData) {
        userSection.innerHTML = `
            <div class="user-profile">
                <div class="avatar-container">
                    <div class="avatar">
                        <i class="bi bi-person-circle"></i>
                    </div>
                    <div class="dropdown-menu">
                        <a href="pages/profile.html" class="dropdown-item">
                            <i class="bi bi-person"></i> 个人中心
                        </a>
                        <a href="pages/favorites.html" class="dropdown-item">
                            <i class="bi bi-heart"></i> 我的收藏
                        </a>
                        <a href="pages/history.html" class="dropdown-item">
                            <i class="bi bi-clock-history"></i> 历史观看
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item" id="logoutBtn">
                            <i class="bi bi-box-arrow-right"></i> 退出登录
                        </a>
                    </div>
                </div>
                <span class="username">${userData.username}</span>
            </div>
        `;
        
        // 添加退出登录事件
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('userData');
                window.location.reload();
            });
        }
        
        // 添加头像下拉菜单事件
        const avatarContainer = document.querySelector('.avatar-container');
        if (avatarContainer) {
            avatarContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdownMenu = avatarContainer.querySelector('.dropdown-menu');
                if (dropdownMenu) {
                    dropdownMenu.classList.toggle('show');
                }
            });
            
            // 点击其他地方关闭下拉菜单
            document.addEventListener('click', () => {
                const dropdownMenu = avatarContainer.querySelector('.dropdown-menu');
                if (dropdownMenu && dropdownMenu.classList.contains('show')) {
                    dropdownMenu.classList.remove('show');
                }
            });
        }
    } else {
        userSection.innerHTML = `
            <a href="pages/login.html" class="btn btn-outline-primary me-2">登录</a>
            <a href="pages/register.html" class="btn btn-primary">注册</a>
        `;
    }
}

// 加载课程评价
async function loadReviews() {
    try {
        const reviewsGrid = document.getElementById('reviewsGrid');
        const reviews = await contentAPI.getReviews();
        
        if (!reviews || reviews.length === 0) {
            reviewsGrid.innerHTML = '<div class="text-center">暂无课程评价</div>';
            return;
        }
        
        reviewsGrid.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <h3>${review.title}</h3>
                    <div class="rating">
                        ${'★'.repeat(Math.floor(review.rating))}${'☆'.repeat(5-Math.floor(review.rating))}
                    </div>
                </div>
                <div class="review-text">${review.content}</div>
                <div class="review-footer">
                    <span>${review.author}</span>
                    <span>${review.date}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载课程评价失败:', error);
        throw error;
    }
}

// 加载二手市场商品
async function loadMarketItems() {
    try {
        const marketGrid = document.getElementById('marketGrid');
        const response = await contentAPI.getMarketItems();
        
        // 确保response.items存在且是数组
        const items = response && response.items && Array.isArray(response.items) ? response.items : [];
        
        if (items.length === 0) {
            marketGrid.innerHTML = '<div class="text-center">暂无商品</div>';
            return;
        }
        
        marketGrid.innerHTML = items.map(item => `
            <div class="market-card" data-id="${item.id}">
                <img src="${item.images && item.images[0] ? item.images[0] : '../images/default-product.jpg'}" alt="${item.title}">
                <div class="market-info">
                    <h3>${item.title}</h3>
                    <div class="price">¥${item.price}</div>
                    <div class="description">${item.description}</div>
                </div>
            </div>
        `).join('');
        
        // 添加点击事件，跳转到商品详情页
        const marketCards = document.querySelectorAll('.market-card');
        marketCards.forEach(card => {
            card.addEventListener('click', () => {
                const itemId = card.dataset.id;
                window.location.href = `pages/market-detail.html?id=${itemId}`;
            });
        });
    } catch (error) {
        console.error('加载二手市场商品失败:', error);
        throw error;
    }
}

// 加载热门帖子
async function loadHotPosts() {
    try {
        const postsList = document.getElementById('postsList');
        const posts = await contentAPI.getHotPosts();
        
        if (!posts || posts.length === 0) {
            postsList.innerHTML = '<div class="text-center">暂无热门帖子</div>';
            return;
        }
        
        // 获取所有分类信息，用于展示帖子分类
        const getCategoryInfo = (category) => {
            const categoryMap = {
                'study': { name: '学习交流', icon: 'bi-book' },
                'tech': { name: '技术讨论', icon: 'bi-code-square' },
                'experience': { name: '经验分享', icon: 'bi-share' },
                'help': { name: '问题求助', icon: 'bi-question-circle' },
                'resource': { name: '资源分享', icon: 'bi-link' }
            };
            return categoryMap[category] || { name: category, icon: 'bi-tag' };
        };
        
        postsList.innerHTML = posts.map(post => {
            const categoryInfo = getCategoryInfo(post.category);
            
            // 格式化帖子内容预览（最多显示50个字符）
            const contentPreview = post.content.length > 50 
                ? post.content.substring(0, 50) + '...' 
                : post.content;
                
            return `
                <a href="pages/post-detail.html?id=${post.id}" class="post-item">
                    <div class="post-item-content">
                        <h3 class="post-title">${post.title}</h3>
                        <p class="post-preview">${contentPreview}</p>
                        <div class="post-meta">
                            <div class="post-category">
                                <i class="bi ${categoryInfo.icon}"></i>
                                <span>${categoryInfo.name}</span>
                            </div>
                            <div class="post-stats">
                                <span><i class="bi bi-person"></i> ${post.author}</span>
                                <span><i class="bi bi-eye"></i> ${post.views}</span>
                                <span><i class="bi bi-hand-thumbs-up"></i> ${post.likes}</span>
                                <span><i class="bi bi-calendar"></i> ${post.date}</span>
                            </div>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    } catch (error) {
        console.error('加载热门帖子失败:', error);
        const postsList = document.getElementById('postsList');
        if (postsList) {
            postsList.innerHTML = '<div class="text-center text-danger">加载热门帖子失败</div>';
        }
    }
}

// 加载最近观看
async function loadRecentViews() {
    try {
        const viewsGrid = document.getElementById('viewsGrid');
        const views = await contentAPI.getRecentViews();
        
        if (!views || views.length === 0) {
            viewsGrid.innerHTML = '<div class="text-center">暂无最近观看记录</div>';
            return;
        }
        
        viewsGrid.innerHTML = views.map(view => `
            <div class="view-card">
                <img src="${view.image}" alt="${view.title}">
                <h3>${view.title}</h3>
                <div class="view-date">${view.date}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载最近观看失败:', error);
        throw error;
    }
} 