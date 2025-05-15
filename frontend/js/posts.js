import { userAPI, contentAPI } from './api.js';

// 初始化全局帖子列表
async function initMockPosts() {
    try {
        // 使用API获取所有帖子
        const data = await contentAPI.getPosts();
        window.mockPosts = data.posts;
    } catch (error) {
        console.error('加载帖子数据失败:', error);
        window.mockPosts = [];
    }
}

// 保存帖子数据到JSON文件
async function savePostsToJson() {
    try {
        const data = {
            posts: window.mockPosts
        };
        // 注意：由于浏览器安全限制，这里只是模拟保存操作
        // 实际项目中需要通过后端API来保存数据
        console.log('保存帖子数据:', data);
        // 这里可以添加与后端API的交互代码
    } catch (error) {
        console.error('保存帖子数据失败:', error);
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 初始化帖子数据
        await initMockPosts();
        
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

// 获取分类名称和对应的图标
function getCategoryInfo(category) {
    const categoryMap = {
        'study': { name: '学习交流', icon: 'bi-book' },
        'tech': { name: '技术讨论', icon: 'bi-code-square' },
        'experience': { name: '经验分享', icon: 'bi-share' },
        'help': { name: '问题求助', icon: 'bi-question-circle' },
        'resource': { name: '资源分享', icon: 'bi-link' }
    };
    return categoryMap[category] || { name: category, icon: 'bi-tag' };
}

// 添加分类切换事件
function addCategoryEvents() {
    const categoryItems = document.querySelectorAll('.category-item');
    
    // 初始化分类统计
    updateCategoryCount();
    
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
    
    // 添加搜索事件
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            const searchTerm = searchInput.value.trim().toLowerCase();
            const activeCategory = document.querySelector('.category-item.active').dataset.category || '';
            loadPosts(activeCategory, searchTerm);
        }, 300));
    }
}

// 防抖函数，避免频繁触发搜索
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// 更新各分类的帖子数量
function updateCategoryCount() {
    // 获取所有分类
    const categories = {};
    const allCount = window.mockPosts.length;
    
    // 统计各分类的帖子数量
    window.mockPosts.forEach(post => {
        if (!categories[post.category]) {
            categories[post.category] = 0;
        }
        categories[post.category]++;
    });
    
    // 更新分类显示
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        const category = item.dataset.category;
        const countBadge = document.createElement('span');
        countBadge.className = 'category-count';
        
        if (category) {
            // 特定分类
            countBadge.textContent = categories[category] || 0;
        } else {
            // 全部分类
            countBadge.textContent = allCount;
        }
        
        // 移除旧的计数标签
        const oldBadge = item.querySelector('.category-count');
        if (oldBadge) {
            item.removeChild(oldBadge);
        }
        
        item.appendChild(countBadge);
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

// 处理富文本内容为纯文本
function stripHtmlTags(html) {
    if (!html) return '';
    
    // 创建临时元素
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // 获取纯文本内容
    return tempDiv.textContent || tempDiv.innerText || '';
}

// 加载帖子列表
async function loadPosts(category = '', searchTerm = '') {
    try {
        const postsContainer = document.getElementById('postsContainer');
        
        // 使用全局帖子列表
        let posts = window.mockPosts;
        
        // 按分类筛选
        if (category) {
            posts = posts.filter(post => post.category === category);
        }
        
        // 按搜索词筛选
        if (searchTerm) {
            posts = posts.filter(post => 
                post.title.toLowerCase().includes(searchTerm) || 
                stripHtmlTags(post.content).toLowerCase().includes(searchTerm) ||
                post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        
        // 显示筛选结果数量
        const resultCount = document.getElementById('resultCount');
        if (resultCount) {
            resultCount.textContent = `找到 ${posts.length} 个帖子`;
            resultCount.style.display = searchTerm ? 'block' : 'none';
        }
        
        if (!posts || posts.length === 0) {
            postsContainer.innerHTML = '<div class="text-center py-5">暂无帖子</div>';
            return;
        }
        
        // 获取所有帖子的评论数据
        const commentsData = await loadAllCommentsCount();
        
        postsContainer.innerHTML = posts.map(post => {
            const categoryInfo = getCategoryInfo(post.category);
            // 获取当前帖子的评论数量
            const commentCount = commentsData[post.id] ? commentsData[post.id].length : 0;
            
            // 处理封面图片
            let coverImageHTML = '';
            if (post.coverImages && Array.isArray(post.coverImages) && post.coverImages.length > 0) {
                // 过滤并限制最多3张有效图片
                const validImages = post.coverImages
                    .filter(url => 
                        typeof url === 'string' && url.trim() !== '' && 
                        !url.includes('</') && !url.includes('<p') && 
                        !url.includes('<div') && !url.includes('%0A')
                    )
                    .slice(0, 3); // 限制最多3张图片
                
                if (validImages.length > 0) {
                    coverImageHTML = `
                        <div class="post-cover-images">
                            ${validImages.map(image => `
                                <div class="post-cover-image">
                                    <img src="${image}" alt="封面图片">
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            }

            // 处理帖子内容摘要
            const plainContent = stripHtmlTags(post.content);
            const excerpt = plainContent.length > 150 ? plainContent.substring(0, 150) + '...' : plainContent;
            
            return `
                <div class="post-card" data-post-id="${post.id}" style="cursor: pointer;">
                    <div class="post-header">
                        <div class="post-author">
                            <a href="profile.html?username=${encodeURIComponent(post.author)}" class="avatar" onclick="event.stopPropagation();">
                                <i class="bi bi-person-circle"></i>
                            </a>
                            <div class="author-info">
                                <span class="author-name">${post.author}</span>
                                <span class="post-time">${post.date}</span>
                            </div>
                        </div>
                        <div class="post-category">
                            <i class="bi ${categoryInfo.icon}"></i>
                            ${categoryInfo.name}
                        </div>
                    </div>
                    ${coverImageHTML}
                    <div class="post-content">
                        <h3 class="post-title">${post.title}</h3>
                        <p class="post-excerpt">${excerpt}</p>
                        <div class="post-tags">
                            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                    <div class="post-footer">
                        <div class="post-stats">
                            <span><i class="bi bi-eye"></i> ${post.views}</span>
                            <span><i class="bi bi-chat"></i> ${commentCount}</span>
                            <span><i class="bi bi-hand-thumbs-up"></i> ${post.likes}</span>
                        </div>
                        <span class="read-more">阅读全文 <i class="bi bi-arrow-right"></i></span>
                    </div>
                </div>
            `;
        }).join('');

        // 添加帖子卡片点击事件
        const postCards = document.querySelectorAll('.post-card');
        postCards.forEach(card => {
            card.addEventListener('click', () => {
                const postId = card.dataset.postId;
                window.location.href = `post-detail.html?id=${postId}`;
            });
        });
    } catch (error) {
        console.error('加载帖子失败:', error);
        throw error;
    }
}

// 加载所有帖子的评论数量
async function loadAllCommentsCount() {
    try {
        // 使用contentAPI获取所有评论数据
        return await contentAPI.getAllComments();
    } catch (error) {
        console.error('获取评论数据失败:', error);
        return {};
    }
} 