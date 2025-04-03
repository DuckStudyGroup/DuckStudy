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
            loadRecentViews(),
            loadHotProjects()
        ]);
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
});

// 更新用户状态
async function updateUserStatus() {
    try {
        console.log('开始获取用户状态...');
        const response = await userAPI.getStatus();
        console.log('获取用户状态成功:', response);
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
                        window.location.reload();
                    } catch (error) {
                        console.error('退出登录失败:', error);
                        alert('退出登录失败，请重试');
                    }
                });
            }
        } else {
            userSection.innerHTML = `
                <a href="pages/login.html" class="btn btn-outline-primary me-2">登录</a>
                <a href="pages/register.html" class="btn btn-primary">注册</a>
            `;
        }
    } catch (error) {
        console.error('获取用户状态失败:', error);
        const userSection = document.getElementById('userSection');
        if (userSection) {
            userSection.innerHTML = `
                <a href="pages/login.html" class="btn btn-outline-primary me-2">登录</a>
                <a href="pages/register.html" class="btn btn-primary">注册</a>
            `;
        }
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
        const items = await contentAPI.getMarketItems();
        
        if (!items || items.length === 0) {
            marketGrid.innerHTML = '<div class="text-center">暂无商品</div>';
            return;
        }
        
        marketGrid.innerHTML = items.map(item => `
            <div class="market-card">
                <img src="${item.image}" alt="${item.title}">
                <div class="market-info">
                    <h3>${item.title}</h3>
                    <div class="price">¥${item.price}</div>
                    <div class="description">${item.description}</div>
                </div>
            </div>
        `).join('');
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
        
        postsList.innerHTML = posts.map(post => `
            <div class="post-item">
                <h3>${post.title}</h3>
                <div class="post-meta">
                    <span>作者：${post.author}</span>
                    <span>浏览：${post.views}</span>
                    <span>${post.date}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载热门帖子失败:', error);
        throw error;
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

// 加载热门项目
async function loadHotProjects() {
    try {
        const projectsGrid = document.getElementById('projectsGrid');
        const projects = await contentAPI.getHotProjects();
        
        if (!projects || projects.length === 0) {
            projectsGrid.innerHTML = '<div class="text-center">暂无热门项目</div>';
            return;
        }
        
        projectsGrid.innerHTML = projects.map(project => `
            <div class="project-card">
                <h3>${project.title}</h3>
                <div class="project-description">${project.description}</div>
                <div class="project-stats">
                    <span><i class="bi bi-star"></i> ${project.stars}</span>
                    <span><i class="bi bi-git-fork"></i> ${project.forks}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载热门项目失败:', error);
        throw error;
    }
} 