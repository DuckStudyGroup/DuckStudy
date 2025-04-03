import { userAPI, contentAPI } from './api.js';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 更新用户状态
        await updateUserStatus();
        
        // 加载帖子列表
        await loadPosts();
        
        // 添加分类切换事件
        addCategoryEvents();
        
        // 添加发帖按钮事件
        addCreatePostEvent();
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

// 模拟帖子数据
const mockPosts = [
    {
        id: 1,
        title: 'Python学习经验分享',
        author: '张三',
        date: '2024-03-15',
        views: 256,
        likes: 0,
        category: 'study',
        tags: ['Python', '编程', '学习'],
        content: '这是一段帖子内容的预览，实际内容将通过API获取...'
    },
    {
        id: 2,
        title: 'JavaScript学习心得',
        author: '李四',
        date: '2024-03-16',
        views: 128,
        likes: 0,
        category: 'study',
        tags: ['JavaScript', '前端', '学习'],
        content: '这是一段帖子内容的预览，实际内容将通过API获取...'
    },
    {
        id: 3,
        title: 'Flask框架使用技巧',
        author: '王五',
        date: '2024-03-17',
        views: 89,
        likes: 0,
        category: 'tech',
        tags: ['Flask', 'Python', '后端'],
        content: '这是一段帖子内容的预览，实际内容将通过API获取...'
    },
    {
        id: 4,
        title: '如何提高编程效率',
        author: '赵六',
        date: '2024-03-18',
        views: 167,
        likes: 0,
        category: 'experience',
        tags: ['编程', '效率', '经验'],
        content: '这是一段帖子内容的预览，实际内容将通过API获取...'
    },
    {
        id: 5,
        title: '遇到一个Python问题，求帮助',
        author: '孙七',
        date: '2024-03-19',
        views: 45,
        likes: 0,
        category: 'help',
        tags: ['Python', '问题', '求助'],
        content: '这是一段帖子内容的预览，实际内容将通过API获取...'
    },
    {
        id: 6,
        title: '分享一些优质学习资源',
        author: '周八',
        date: '2024-03-20',
        views: 234,
        likes: 0,
        category: 'resource',
        tags: ['资源', '学习', '分享'],
        content: '这是一段帖子内容的预览，实际内容将通过API获取...'
    }
];

// 加载帖子列表
async function loadPosts(category = '') {
    try {
        const postsContainer = document.getElementById('postsContainer');
        
        // 使用全局帖子列表
        let posts = window.mockPosts || [...mockPosts];
        if (category) {
            posts = posts.filter(post => post.category === category);
        }
        
        if (!posts || posts.length === 0) {
            postsContainer.innerHTML = '<div class="text-center">暂无帖子</div>';
            return;
        }
        
        postsContainer.innerHTML = posts.map(post => `
            <div class="post-card">
                <div class="post-header">
                    <div class="post-author">
                        <div class="avatar">
                            <i class="bi bi-person-circle"></i>
                        </div>
                        <div class="author-info">
                            <span class="author-name">${post.author}</span>
                            <span class="post-time">${post.date}</span>
                        </div>
                    </div>
                    <div class="post-category">${getCategoryName(post.category)}</div>
                </div>
                <div class="post-content">
                    <h3 class="post-title">${post.title}</h3>
                    <p class="post-excerpt">${post.content}</p>
                    <div class="post-tags">
                        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="post-footer">
                    <div class="post-stats">
                        <span><i class="bi bi-eye"></i> ${post.views}</span>
                        <span><i class="bi bi-chat"></i> 0</span>
                        <span><i class="bi bi-hand-thumbs-up"></i> ${post.likes}</span>
                    </div>
                    <a href="post-detail.html?id=${post.id}" class="read-more">阅读全文 <i class="bi bi-arrow-right"></i></a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载帖子失败:', error);
        throw error;
    }
}

// 获取分类名称
function getCategoryName(category) {
    const categoryMap = {
        'study': '学习交流',
        'tech': '技术讨论',
        'experience': '经验分享',
        'help': '问题求助',
        'resource': '资源分享'
    };
    return categoryMap[category] || category;
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
            // 根据分类加载帖子
            const category = item.dataset.category || '';
            loadPosts(category);
        });
    });
}

// 添加发帖按钮事件
function addCreatePostEvent() {
    const createPostBtn = document.getElementById('createPostBtn');
    if (createPostBtn) {
        createPostBtn.addEventListener('click', async () => {
            try {
                const response = await userAPI.getStatus();
                if (!response.isLoggedIn) {
                    alert('请先登录后再发帖');
                    window.location.href = 'login.html';
                    return;
                }
                window.location.href = 'create-post.html';
            } catch (error) {
                console.error('检查登录状态失败:', error);
                alert('操作失败，请重试');
            }
        });
    }
} 