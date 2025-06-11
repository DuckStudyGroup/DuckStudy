import { userAPI, contentAPI } from './api.js';
import { initNavbar } from './nav-utils.js';

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

// 初始化市场数据
async function initMarketItems() {
    if (!window.marketItems || window.marketItems.length === 0) {
        try {
            // 使用API获取所有商品
            const data = await contentAPI.getMarketItems();
            window.marketItems = data.items || [];
        } catch (error) {
            console.error('加载市场商品数据失败:', error);
            window.marketItems = [];
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

// 获取市场分类信息
function getMarketCategoryInfo(category) {
    const categoryMap = {
        'textbook': { name: '教材教辅', icon: 'bi-book' },
        'electronics': { name: '电子产品', icon: 'bi-laptop' },
        'study': { name: '学习用品', icon: 'bi-pencil' },
        'life': { name: '生活用品', icon: 'bi-house' },
        'others': { name: '其他', icon: 'bi-tag' }
    };
    return categoryMap[category] || { name: '其他', icon: 'bi-tag' };
}

// 加载用户收藏内容
async function loadFavoriteContent(type = 'all') {
    try {
        const favoritesContainer = document.getElementById('favoritesContainer');
        const noFavorites = document.getElementById('noFavorites');
        const marketNotImplemented = document.getElementById('marketNotImplemented');
        
        if (!favoritesContainer || !noFavorites || !marketNotImplemented) {
            console.error('未找到收藏容器元素');
            return;
        }
        
        // 初始化隐藏提示
        noFavorites.style.display = 'none';
        marketNotImplemented.style.display = 'none';
        favoritesContainer.innerHTML = '';
        
        // 获取当前登录用户信息
        const userResponse = await userAPI.getStatus();
        if (!userResponse || !userResponse.isLoggedIn) {
            noFavorites.style.display = 'block';
            return;
        }
        
        const userId = userResponse.userId || userResponse.username;
        
        // 获取特定用户的帖子收藏ID列表
        const favoritedPostIds = JSON.parse(localStorage.getItem(`userFavorites_posts_${userId}`) || '[]');
        
        // 获取特定用户的市场收藏ID列表
        const favoritedMarketIds = JSON.parse(localStorage.getItem(`userFavorites_market_${userId}`) || '[]');
        
        // 更新收藏计数
        const postsCount = document.getElementById('postsCount');
        const marketCount = document.getElementById('marketCount');
        
        if (postsCount) postsCount.textContent = favoritedPostIds.length;
        if (marketCount) marketCount.textContent = favoritedMarketIds.length;
        
        // 检查是否有收藏内容
        if (type === 'all' && favoritedPostIds.length === 0 && favoritedMarketIds.length === 0) {
            noFavorites.style.display = 'block';
            return;
        } else if (type === 'posts' && favoritedPostIds.length === 0) {
            noFavorites.style.display = 'block';
            return;
        } else if (type === 'market' && favoritedMarketIds.length === 0) {
            noFavorites.style.display = 'block';
            return;
        }
        
        // 根据ID查找帖子详情
        if (type === 'all' || type === 'posts') {
            const favoritePosts = window.mockPosts.filter(post => 
                favoritedPostIds.includes(post.id.toString())
            );
            
            if (favoritePosts.length > 0) {
                // 渲染收藏的帖子列表
                favoritesContainer.innerHTML = favoritePosts.map(post => {
                    const categoryInfo = getCategoryInfo(post.category);
                    
                    return `
                        <div class="post-card" data-id="${post.id}" data-type="post">
                            <button type="button" class="remove-favorite" data-id="${post.id}" data-type="post">
                                <i class="bi bi-x-lg"></i>
                            </button>
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
                                <div class="post-category">
                                    <i class="bi ${categoryInfo.icon}"></i>
                                    ${categoryInfo.name}
                                </div>
                            </div>
                            <div class="post-content">
                                <h3 class="post-title">${post.title}</h3>
                                <p class="post-excerpt">${post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content}</p>
                                <div class="post-tags">
                                    ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                                </div>
                            </div>
                            <div class="post-footer">
                                <div class="post-stats">
                                    <span><i class="bi bi-eye"></i> ${post.views}</span>
                                    <span><i class="bi bi-chat"></i> ${post.comments ? post.comments.length : 0}</span>
                                    <span><i class="bi bi-heart"></i> ${post.likes}</span>
                                    <span><i class="bi bi-bookmark-fill"></i> ${post.favorites}</span>
                                </div>
                                <a href="post-detail.html?id=${post.id}" class="read-more">阅读全文 <i class="bi bi-arrow-right"></i></a>
                            </div>
                        </div>
                    `;
                }).join('');
            } else if (type === 'posts') {
                // 如果没有收藏的帖子则显示提示
                noFavorites.style.display = 'block';
            }
        }
        
        // 根据ID查找市场商品详情
        if (type === 'all' || type === 'market') {
            // 初始化市场数据
            await initMarketItems();
            
            const favoriteMarketItems = window.marketItems.filter(item => 
                favoritedMarketIds.includes(item.id.toString())
            );
            
            if (favoriteMarketItems.length > 0) {
                // 为市场商品创建HTML内容
                const marketHTML = favoriteMarketItems.map(item => {
                    const categoryInfo = getMarketCategoryInfo(item.category);
                    
                    return `
                        <div class="market-card" data-id="${item.id}" data-type="market">
                            <button type="button" class="remove-favorite" data-id="${item.id}" data-type="market">
                                <i class="bi bi-x-lg"></i>
                            </button>
                            <div class="market-card-img">
                                <img src="${item.images[0]}" alt="${item.title}">
                                <div class="market-card-category">
                                    <i class="bi ${categoryInfo.icon}"></i> ${categoryInfo.name}
                                </div>
                            </div>
                            <div class="market-card-content">
                                <h3 class="market-card-title">${item.title}</h3>
                                <p class="market-card-desc">${item.description}</p>
                                <div class="market-card-meta">
                                    <span class="price">¥${item.price}</span>
                                    <span class="condition">${item.condition}</span>
                                    <span class="location"><i class="bi bi-geo-alt"></i> ${item.location}</span>
                                </div>
                                <div class="market-card-footer">
                                    <span class="time">${item.date}</span>
                                    <div class="market-card-stats">
                                        <span><i class="bi bi-eye"></i> ${item.views}</span>
                                        <span><i class="bi bi-bookmark"></i> ${item.favorites}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                // 将市场商品添加到容器
                if (type === 'all') {
                    favoritesContainer.innerHTML += marketHTML;
                } else {
                    favoritesContainer.innerHTML = marketHTML;
                }
            } else if (type === 'market') {
                // 如果没有收藏的市场商品则显示提示
                noFavorites.style.display = 'block';
            }
        }
        
        // 添加移除收藏的事件
        addRemoveFavoriteEvents();
        
    } catch (error) {
        console.error('加载收藏内容失败:', error);
        throw error;
    }
}

// 添加移除收藏的事件处理
function addRemoveFavoriteEvents() {
    const removeButtons = document.querySelectorAll('.remove-favorite');
    
    removeButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            // 阻止事件冒泡，避免触发卡片点击
            event.stopPropagation();
            
            const itemId = button.dataset.id;
            const itemType = button.dataset.type;
            const itemCard = button.closest(`.${itemType}-card, .post-card`);
            
            if (confirm('确定要取消收藏这项内容吗？')) {
                try {
                    // 获取当前登录用户信息
                    const userResponse = await userAPI.getStatus();
                    if (!userResponse || !userResponse.isLoggedIn) {
                        alert('请先登录');
                        return;
                    }
                    
                    const userId = userResponse.userId || userResponse.username;
                    
                    if (itemType === 'post') {
                        // 从本地存储中移除帖子收藏
                        const favoritedPosts = JSON.parse(localStorage.getItem(`userFavorites_posts_${userId}`) || '[]');
                        const index = favoritedPosts.indexOf(itemId);
                        
                        if (index > -1) {
                            favoritedPosts.splice(index, 1);
                            localStorage.setItem(`userFavorites_posts_${userId}`, JSON.stringify(favoritedPosts));
                            
                            // 更新帖子数据中的收藏状态
                            const post = window.mockPosts.find(p => p.id.toString() === itemId);
                            if (post) {
                                // 确保favoritedBy数组存在
                                if (!post.favoritedBy) {
                                    post.favoritedBy = [];
                                }
                                // 从favoritedBy数组中移除用户
                                const userIndex = post.favoritedBy.indexOf(userId);
                                if (userIndex !== -1) {
                                    post.favoritedBy.splice(userIndex, 1);
                                    post.favorites = Math.max(0, (post.favorites || 0) - 1);
                                    // 更新帖子数据
                                    await contentAPI.updatePost(post.id, post);
                                }
                            }
                            
                            // 更新收藏计数
                            const postsCount = document.getElementById('postsCount');
                            if (postsCount) postsCount.textContent = favoritedPosts.length;
                        }
                    } else if (itemType === 'market') {
                        // 从本地存储中移除市场商品收藏
                        const favoritedItems = JSON.parse(localStorage.getItem(`userFavorites_market_${userId}`) || '[]');
                        const index = favoritedItems.indexOf(itemId);
                        
                        if (index > -1) {
                            favoritedItems.splice(index, 1);
                            localStorage.setItem(`userFavorites_market_${userId}`, JSON.stringify(favoritedItems));
                            
                            // 更新商品数据中的收藏数
                            const item = window.marketItems.find(i => i.id.toString() === itemId);
                            if (item && item.favorites > 0) {
                                item.favorites--;
                                await contentAPI.updateMarketItem(item.id, item);
                            }
                            
                            // 更新收藏计数
                            const marketCount = document.getElementById('marketCount');
                            if (marketCount) marketCount.textContent = favoritedItems.length;
                        }
                    }
                    
                    // 移除卡片元素
                    if (itemCard) {
                        itemCard.classList.add('fade-out');
                        setTimeout(() => {
                            itemCard.remove();
                            
                            // 检查是否还有收藏的内容
                            const favoritesContainer = document.getElementById('favoritesContainer');
                            const currentType = document.querySelector('.category-item.active').dataset.type;
                            
                            if (favoritesContainer && favoritesContainer.children.length === 0) {
                                // 如果当前类别没有内容了，显示提示
                                const noFavorites = document.getElementById('noFavorites');
                                if (noFavorites) {
                                    noFavorites.style.display = 'block';
                                }
                            }
                        }, 300);
                    }
                } catch (error) {
                    console.error('取消收藏失败:', error);
                    alert('取消收藏失败，请重试');
                }
            }
        });
    });
    
    // 使整个卡片可点击
    const postCards = document.querySelectorAll('.post-card');
    postCards.forEach(card => {
        card.addEventListener('click', (event) => {
            // 如果点击的是移除按钮或阅读全文链接，不进行跳转
            if (!event.target.closest('.remove-favorite') && !event.target.closest('.read-more')) {
                const postId = card.dataset.id;
                window.location.href = `post-detail.html?id=${postId}`;
            }
        });
    });
    
    // 为市场商品卡片添加点击事件
    const marketCards = document.querySelectorAll('.market-card');
    marketCards.forEach(card => {
        card.addEventListener('click', (event) => {
            // 如果点击的是移除按钮，不进行跳转
            if (!event.target.closest('.remove-favorite')) {
                const itemId = card.dataset.id;
                window.location.href = `market-detail.html?id=${itemId}`;
            }
        });
    });
}

// 添加分类导航事件
function addCategoryEvents() {
    const categoryItems = document.querySelectorAll('.category-item');
    
    categoryItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // 移除所有active类
            categoryItems.forEach(i => i.classList.remove('active'));
            
            // 添加active类到当前点击项
            item.classList.add('active');
            
            // 根据分类加载内容
            const type = item.dataset.type;
            await loadFavoriteContent(type);
        });
    });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 初始化导航栏
        await initNavbar();
        
        // 初始化帖子数据
        await initMockPosts();
        
        // 初始化市场数据
        await initMarketItems();
        
        // 获取用户登录状态
        const userStatus = await userAPI.getStatus();
        if (!userStatus || !userStatus.isLoggedIn) {
            // 用户未登录时重定向到登录页面
            alert('请先登录后再查看收藏');
            window.location.href = 'login.html';
            return;
        }
        
        // 加载用户收藏内容
        await loadFavoriteContent('all');
        
        // 添加分类切换事件
        addCategoryEvents();
        
        // 添加移除收藏事件
        addRemoveFavoriteEvents();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
});