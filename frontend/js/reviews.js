import { userAPI, contentAPI } from './api.js';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 更新用户状态
        await updateUserStatus();
        
        // 加载评价列表
        await loadReviews();
        
        // 添加分类切换事件
        addCategoryEvents();
        
        // 添加写评价按钮事件
        addCreateReviewEvent();
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
                        window.location.reload();
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
        const userSection = document.getElementById('userSection');
        if (userSection) {
            userSection.innerHTML = `
                <a href="login.html" class="btn btn-outline-primary me-2">登录</a>
                <a href="register.html" class="btn btn-primary">注册</a>
            `;
        }
    }
}

// 加载评价列表
async function loadReviews() {
    try {
        const reviewsContainer = document.getElementById('reviewsContainer');
        const reviews = await contentAPI.getReviews();
        
        if (!reviews || reviews.length === 0) {
            reviewsContainer.innerHTML = '<div class="text-center">暂无课程评价</div>';
            return;
        }
        
        reviewsContainer.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div class="course-info">
                        <h3 class="course-title">${review.title}</h3>
                        <div class="course-meta">
                            <span class="platform">Coursera</span>
                            <span class="instructor">讲师：李教授</span>
                        </div>
                    </div>
                    <div class="rating">
                        <div class="stars">
                            ${generateStars(review.rating)}
                        </div>
                        <span class="rating-score">${review.rating}</span>
                    </div>
                </div>
                <div class="review-content">
                    <div class="reviewer">
                        <div class="avatar">
                            <i class="bi bi-person-circle"></i>
                        </div>
                        <div class="reviewer-info">
                            <span class="reviewer-name">${review.author}</span>
                            <span class="review-time">${review.date}</span>
                        </div>
                    </div>
                    <p class="review-text">${review.content}</p>
                </div>
                <div class="review-footer">
                    <div class="review-stats">
                        <span><i class="bi bi-hand-thumbs-up"></i> 45</span>
                        <span><i class="bi bi-chat"></i> 12</span>
                    </div>
                    <button class="btn btn-outline-primary btn-sm">写评价</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载评价失败:', error);
        throw error;
    }
}

// 生成星级评分
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="bi bi-star-fill"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="bi bi-star-half"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="bi bi-star"></i>';
    }
    
    return stars;
}

// 添加分类切换事件
function addCategoryEvents() {
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            // 移除所有active类
            categoryItems.forEach(i => i.classList.remove('active'));
            // 添加active类到当前点击项
            item.classList.add('active');
            // TODO: 根据分类加载评价
            console.log('切换到分类:', item.textContent);
        });
    });
}

// 添加写评价按钮事件
function addCreateReviewEvent() {
    const createReviewBtn = document.getElementById('createReviewBtn');
    if (createReviewBtn) {
        createReviewBtn.addEventListener('click', () => {
            // TODO: 检查用户是否登录
            // 如果未登录，跳转到登录页面
            // 如果已登录，跳转到写评价页面
            console.log('点击写评价按钮');
        });
    }
} 