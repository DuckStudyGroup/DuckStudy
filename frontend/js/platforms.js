import { userAPI } from './api.js';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    updateUserStatus();
    loadPlatforms();
    addCategoryFilterEvents();
    addLoadMoreEvent();
});

// 更新用户状态
async function updateUserStatus() {
    try {
        const userSection = document.querySelector('.user-section');
        if (!userSection) return;

        const response = await userAPI.getStatus();
        if (response.isLoggedIn) {
            userSection.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-link dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown">
                        <i class="fas fa-user-circle"></i> ${response.username}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="/profile.html">个人中心</a></li>
                        <li><a class="dropdown-item" href="/favorites.html">我的收藏</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" id="logoutBtn">退出登录</a></li>
                    </ul>
                </div>
            `;

            // 添加退出登录事件
            document.getElementById('logoutBtn').addEventListener('click', async (e) => {
                e.preventDefault();
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
                <a href="/login.html" class="btn btn-outline-primary me-2">登录</a>
                <a href="/register.html" class="btn btn-primary">注册</a>
            `;
        }
    } catch (error) {
        console.error('获取用户状态失败:', error);
        const userSection = document.querySelector('.user-section');
        if (userSection) {
            userSection.innerHTML = `
                <a href="/login.html" class="btn btn-outline-primary me-2">登录</a>
                <a href="/register.html" class="btn btn-primary">注册</a>
            `;
        }
    }
}

// 加载学习平台列表
function loadPlatforms(category = 'all') {
    const platformsGrid = document.querySelector('.platforms-grid');
    if (!platformsGrid) return;

    // 显示加载状态
    platformsGrid.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
        </div>
    `;

    // 模拟API调用
    setTimeout(() => {
        const platforms = getMockPlatforms();
        const filteredPlatforms = category === 'all' 
            ? platforms 
            : platforms.filter(p => p.category === category);

        if (filteredPlatforms.length === 0) {
            platformsGrid.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <p class="text-muted">暂无相关学习平台</p>
                </div>
            `;
            return;
        }

        platformsGrid.innerHTML = filteredPlatforms.map(platform => `
            <div class="platform-card">
                <div class="platform-icon">
                    <i class="${platform.icon}"></i>
                </div>
                <div class="platform-info">
                    <h3>${platform.name}</h3>
                    <p>${platform.description}</p>
                    <div class="platform-tags">
                        ${platform.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <a href="${platform.url}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt me-2"></i>访问平台
                    </a>
                </div>
            </div>
        `).join('');
    }, 500);
}

// 添加分类筛选事件
function addCategoryFilterEvents() {
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            // 更新选中状态
            categoryItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // 加载对应分类的平台
            const category = item.dataset.category;
            loadPlatforms(category);
        });
    });
}

// 添加加载更多事件
function addLoadMoreEvent() {
    const loadMoreBtn = document.querySelector('.load-more .btn');
    if (!loadMoreBtn) return;

    loadMoreBtn.addEventListener('click', () => {
        // 显示加载状态
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            加载中...
        `;

        // 模拟加载更多数据
        setTimeout(() => {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = '加载更多';
            // TODO: 实现加载更多逻辑
        }, 1000);
    });
}

// 模拟平台数据
function getMockPlatforms() {
    return [
        {
            name: 'Coursera',
            description: '全球顶尖大学提供的在线课程，涵盖计算机科学、数据科学、商业等多个领域。',
            category: 'programming',
            icon: 'fas fa-graduation-cap',
            tags: ['编程', '数据科学', '机器学习'],
            url: 'https://www.coursera.org'
        },
        {
            name: 'Udemy',
            description: '实用技能学习平台，提供大量编程、设计、商业等领域的课程。',
            category: 'programming',
            icon: 'fas fa-laptop-code',
            tags: ['编程', 'Web开发', '移动开发'],
            url: 'https://www.udemy.com'
        },
        {
            name: 'Figma',
            description: '专业的在线设计工具，适合UI/UX设计师使用。',
            category: 'design',
            icon: 'fas fa-paint-brush',
            tags: ['设计', 'UI/UX', '原型设计'],
            url: 'https://www.figma.com'
        },
        {
            name: 'Duolingo',
            description: '有趣的语言学习平台，支持多种语言学习。',
            category: 'language',
            icon: 'fas fa-language',
            tags: ['语言学习', '英语', '日语'],
            url: 'https://www.duolingo.com'
        },
        {
            name: 'LinkedIn Learning',
            description: '专业的职业技能学习平台，提供商业、技术等领域的课程。',
            category: 'business',
            icon: 'fas fa-briefcase',
            tags: ['商业', '职业发展', '领导力'],
            url: 'https://www.linkedin.com/learning'
        }
    ];
} 