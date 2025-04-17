import { userAPI, contentAPI } from './api.js';

// 模拟数据
const MOCK_REVIEWS = {
    all: [
        {
            title: 'Python编程入门',
            rating: 4.5,
            content: '课程内容非常系统，从基础语法到实际应用都有详细讲解，特别适合初学者。',
            author: '张三',
            date: '2024-03-15',
            category: 'programming'
        },
        {
            title: 'UI设计基础',
            rating: 4.0,
            content: '课程内容很实用，特别是设计原则和工具使用的部分，让我受益匪浅。',
            author: '李四',
            date: '2024-03-10',
            category: 'design'
        },
        {
            title: '英语口语进阶',
            rating: 4.8,
            content: '老师的发音很标准，课程设计合理，通过大量练习提高了我的口语水平。',
            author: '王五',
            date: '2024-03-08',
            category: 'language'
        },
        {
            title: '项目管理实战',
            rating: 4.2,
            content: '课程结合实际案例，让我对项目管理有了更深入的理解，非常实用。',
            author: '赵六',
            date: '2024-03-05',
            category: 'career'
        },
        {
            title: '数字营销策略',
            rating: 4.6,
            content: '课程内容紧跟时代发展，提供了很多实用的营销工具和方法。',
            author: '钱七',
            date: '2024-03-01',
            category: 'business'
        }
    ],
    programming: [
        {
            title: 'Python编程入门',
            rating: 4.5,
            content: '课程内容非常系统，从基础语法到实际应用都有详细讲解，特别适合初学者。',
            author: '张三',
            date: '2024-03-15',
            category: 'programming'
        },
        {
            title: 'Web前端开发',
            rating: 4.7,
            content: '课程涵盖了HTML、CSS、JavaScript的基础知识，讲解清晰易懂。',
            author: '李四',
            date: '2024-03-12',
            category: 'programming'
        }
    ],
    design: [
        {
            title: 'UI设计基础',
            rating: 4.0,
            content: '课程内容很实用，特别是设计原则和工具使用的部分，让我受益匪浅。',
            author: '李四',
            date: '2024-03-10',
            category: 'design'
        }
    ],
    language: [
        {
            title: '英语口语进阶',
            rating: 4.8,
            content: '老师的发音很标准，课程设计合理，通过大量练习提高了我的口语水平。',
            author: '王五',
            date: '2024-03-08',
            category: 'language'
        }
    ],
    career: [
        {
            title: '项目管理实战',
            rating: 4.2,
            content: '课程结合实际案例，让我对项目管理有了更深入的理解，非常实用。',
            author: '赵六',
            date: '2024-03-05',
            category: 'career'
        }
    ],
    business: [
        {
            title: '数字营销策略',
            rating: 4.6,
            content: '课程内容紧跟时代发展，提供了很多实用的营销工具和方法。',
            author: '钱七',
            date: '2024-03-01',
            category: 'business'
        }
    ]
};

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 更新用户状态
        await updateUserStatus();
        
        // 加载评价列表
        await loadReviews('all');
        
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
        const response = await userAPI.getStatus();
        const userSection = document.getElementById('userSection');
        
        if (response.isLoggedIn) {
            userSection.innerHTML = `
                <div class="user-profile">
                    <div class="avatar">
                        <i class="bi bi-person-circle"></i>
                    </div>
                    <span class="username">${response.username}</span>
                    <button class="btn btn-outline-primary btn-sm" id="logoutBtn">退出</button>
                </div>
            `;
            
            // 添加退出登录事件
            document.getElementById('logoutBtn').addEventListener('click', async () => {
                try {
                    await userAPI.logout();
                    window.location.reload();
                } catch (error) {
                    console.error('退出登录失败:', error);
                    alert('退出登录失败，请重试');
                }
            });
        } else {
            userSection.innerHTML = `
                <a href="login.html" class="btn btn-outline-primary me-2">登录</a>
                <a href="register.html" class="btn btn-primary">注册</a>
            `;
        }
    } catch (error) {
        console.error('获取用户状态失败:', error);
        userSection.innerHTML = `
            <a href="login.html" class="btn btn-outline-primary me-2">登录</a>
            <a href="register.html" class="btn btn-primary">注册</a>
        `;
    }
}

// 加载评价列表
async function loadReviews(category) {
    try {
        const reviewsContainer = document.getElementById('reviewsContainer');
        // 在实际项目中，这里应该调用API获取数据
        // const reviews = await contentAPI.getReviews(category);
        const reviews = MOCK_REVIEWS[category] || [];
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<div class="text-center">暂无课程评价</div>';
            return;
        }
        
        reviewsContainer.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div class="course-info">
                        <h3 class="course-title">${review.title}</h3>
                        <div class="course-meta">
                            <span class="category">${getCategoryName(review.category)}</span>
                            <span class="date">${review.date}</span>
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
                        <div class="reviewer-avatar">
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
            // 加载对应分类的评价
            const category = item.dataset.category;
            loadReviews(category);
        });
    });
}

// 获取分类名称
function getCategoryName(category) {
    const categoryNames = {
        'programming': '编程开发',
        'design': '设计创作',
        'language': '语言学习',
        'exam': '考试认证',
        'career': '职场技能',
        'business': '商业管理',
        'art': '艺术创作',
        'science': '科学教育'
    };
    return categoryNames[category] || '其他';
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