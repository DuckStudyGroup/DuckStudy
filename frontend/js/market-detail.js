import { userAPI, contentAPI } from './api.js';

// 全局商品数据
window.marketItems = [];

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 初始化商品数据
        await initMarketItems();
        
        // 更新用户状态
        await updateUserStatus();
        
        // 加载商品详情
        await loadItemDetail();
        
        // 加载相关推荐
        await loadRelatedItems();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
});

// 初始化商品数据
async function initMarketItems() {
    try {
        // 使用API获取所有商品
        const data = await contentAPI.getMarketItems();
        window.marketItems = data.items || [];
    } catch (error) {
        console.error('加载商品数据失败:', error);
        window.marketItems = [];
    }
}

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
                                <i class="bi bi-bookmark"></i> 我的收藏
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
            
            return response;
        } else {
            userSection.innerHTML = `
                <a href="login.html" class="btn btn-outline-primary me-2">登录</a>
                <a href="register.html" class="btn btn-primary">注册</a>
            `;
            return null;
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
        return null;
    }
}

// 获取分类名称和图标
function getCategoryInfo(category) {
    const categoryMap = {
        'textbook': { name: '教材教辅', icon: 'bi-book' },
        'electronics': { name: '电子产品', icon: 'bi-laptop' },
        'study': { name: '学习用品', icon: 'bi-pencil' },
        'life': { name: '生活用品', icon: 'bi-house' },
        'others': { name: '其他', icon: 'bi-tag' }
    };
    return categoryMap[category] || { name: '其他', icon: 'bi-tag' };
}

// 加载商品详情
async function loadItemDetail() {
    try {
        const itemDetailContainer = document.getElementById('itemDetail');
        if (!itemDetailContainer) {
            console.error('未找到商品详情容器');
            return;
        }
        
        // 获取URL中的商品ID
        const itemId = new URLSearchParams(window.location.search).get('id');
        if (!itemId) {
            itemDetailContainer.innerHTML = '<div class="alert alert-danger">未找到商品ID</div>';
            return;
        }
        
        // 从API获取商品详情
        const response = await contentAPI.getMarketItem(itemId);
        
        if (!response.success || !response.item) {
            itemDetailContainer.innerHTML = '<div class="alert alert-danger">商品不存在或已下架</div>';
            return;
        }
        
        const item = response.item;
        
        // 增加浏览次数 - 实际应用中应该由后端处理
        item.views++;
        await contentAPI.updateMarketItem(item.id, item);
        
        // 获取当前用户信息
        const userResponse = await userAPI.getStatus();
        let isFavorited = false;
        
        // 检查是否已收藏
        if (userResponse && userResponse.isLoggedIn) {
            const userId = userResponse.userId || userResponse.username;
            const favoritedMarketItems = JSON.parse(localStorage.getItem(`userFavorites_market_${userId}`) || '[]');
            isFavorited = favoritedMarketItems.includes(itemId.toString());
        }
        
        // 获取分类信息
        const categoryInfo = getCategoryInfo(item.category);
        
        // 设置页面标题
        document.title = `${item.title} - DuckStudy`;
        
        // 渲染商品详情
        itemDetailContainer.innerHTML = `
            <div class="item-detail">
                <div class="item-image">
                    <img src="${item.images[0]}" alt="${item.title}">
                </div>
                <div class="item-info">
                    <h1 class="item-title">${item.title}</h1>
                    <div class="item-price">¥${item.price}</div>
                    <div class="item-category">
                        <i class="bi ${categoryInfo.icon}"></i>
                        ${categoryInfo.name}
                    </div>
                    <div class="item-condition">成色：${item.condition}</div>
                    <div class="item-meta">
                        <div class="item-meta-item">
                            <i class="bi bi-geo-alt"></i> ${item.location}
                        </div>
                        <div class="item-meta-item">
                            <i class="bi bi-calendar"></i> ${item.date}
                        </div>
                    </div>
                    <div class="item-desc">${item.description}</div>
                    <div class="item-contact">
                        <strong>联系方式：</strong> ${item.contact}
                    </div>
                    <div class="item-seller">
                        <div class="seller-avatar">
                            <i class="bi bi-person"></i>
                        </div>
                        <div class="seller-name">${item.seller}</div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-primary contact-btn">
                            <i class="bi bi-chat"></i> 联系卖家
                        </button>
                        <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-id="${item.id}" data-favorited="${isFavorited}">
                            <i class="bi ${isFavorited ? 'bi-bookmark-fill' : 'bi-bookmark'}"></i>
                        </button>
                    </div>
                    <div class="item-stats">
                        <span><i class="bi bi-eye"></i> ${item.views} 浏览</span>
                        <span><i class="bi bi-bookmark"></i> ${item.favorites} 收藏</span>
                    </div>
                </div>
            </div>
        `;
        
        // 添加收藏事件监听
        addFavoriteEvent();
        
        // 添加联系卖家事件监听
        addContactEvent();
        
    } catch (error) {
        console.error('加载商品详情失败:', error);
        const itemDetailContainer = document.getElementById('itemDetail');
        if (itemDetailContainer) {
            itemDetailContainer.innerHTML = '<div class="alert alert-danger">加载商品详情失败，请刷新重试</div>';
        }
    }
}

// 添加收藏事件
function addFavoriteEvent() {
    const favoriteBtn = document.querySelector('.favorite-btn');
    if (!favoriteBtn) return;
    
    favoriteBtn.addEventListener('click', async () => {
        try {
            const userResponse = await userAPI.getStatus();
            if (!userResponse.isLoggedIn) {
                alert('请先登录后再收藏');
                return;
            }
            
            const userId = userResponse.userId || userResponse.username;
            const itemId = favoriteBtn.dataset.id;
            const isFavorited = favoriteBtn.dataset.favorited === 'true';
            
            // 获取市场收藏列表
            const favoritedItems = JSON.parse(localStorage.getItem(`userFavorites_market_${userId}`) || '[]');
            
            // 更新商品收藏数
            const item = window.marketItems.find(i => i.id === parseInt(itemId));
            if (item) {
                if (isFavorited) {
                    // 取消收藏
                    item.favorites = Math.max(0, item.favorites - 1);
                    
                    // 从收藏列表移除
                    const index = favoritedItems.indexOf(itemId);
                    if (index > -1) {
                        favoritedItems.splice(index, 1);
                    }
                    
                    // 更新UI
                    favoriteBtn.dataset.favorited = 'false';
                    favoriteBtn.classList.remove('favorited');
                    favoriteBtn.querySelector('i').classList.replace('bi-bookmark-fill', 'bi-bookmark');
                    
                    // 更新统计数据显示
                    const statsElement = document.querySelector('.item-stats span:nth-child(2)');
                    if (statsElement) {
                        statsElement.innerHTML = `<i class="bi bi-bookmark"></i> ${item.favorites} 收藏`;
                    }
                    
                    alert('已取消收藏');
                } else {
                    // 添加收藏
                    item.favorites++;
                    
                    // 添加到收藏列表
                    if (!favoritedItems.includes(itemId)) {
                        favoritedItems.push(itemId);
                    }
                    
                    // 更新UI
                    favoriteBtn.dataset.favorited = 'true';
                    favoriteBtn.classList.add('favorited');
                    favoriteBtn.querySelector('i').classList.replace('bi-bookmark', 'bi-bookmark-fill');
                    
                    // 更新统计数据显示
                    const statsElement = document.querySelector('.item-stats span:nth-child(2)');
                    if (statsElement) {
                        statsElement.innerHTML = `<i class="bi bi-bookmark"></i> ${item.favorites} 收藏`;
                    }
                    
                    alert('收藏成功！');
                }
                
                // 保存收藏状态
                localStorage.setItem(`userFavorites_market_${userId}`, JSON.stringify(favoritedItems));
                
                // 更新后端数据 - 实际应用中应该由后端处理
                await contentAPI.updateMarketItem(item.id, item);
            }
        } catch (error) {
            console.error('收藏操作失败:', error);
            alert('收藏操作失败，请重试');
        }
    });
}

// 添加联系卖家事件
function addContactEvent() {
    const contactBtn = document.querySelector('.contact-btn');
    if (!contactBtn) return;
    
    contactBtn.addEventListener('click', async () => {
        try {
            const userResponse = await userAPI.getStatus();
            if (!userResponse.isLoggedIn) {
                alert('请先登录后再联系卖家');
                return;
            }
            
            // 获取联系方式
            const contactInfo = document.querySelector('.item-contact').textContent.replace('联系方式：', '').trim();
            alert(`请通过以下方式联系卖家：${contactInfo}`);
            
        } catch (error) {
            console.error('操作失败:', error);
            alert('操作失败，请重试');
        }
    });
}

// 加载相关推荐商品
async function loadRelatedItems() {
    try {
        const relatedItemsContainer = document.getElementById('relatedItems');
        if (!relatedItemsContainer) {
            console.error('未找到相关推荐容器');
            return;
        }
        
        // 获取当前商品ID
        const currentItemId = new URLSearchParams(window.location.search).get('id');
        if (!currentItemId) return;
        
        // 获取当前商品
        const currentItem = window.marketItems.find(item => item.id === parseInt(currentItemId));
        if (!currentItem) return;
        
        // 筛选相同分类的其他商品
        let relatedItems = window.marketItems.filter(item => 
            item.id !== parseInt(currentItemId) && 
            item.category === currentItem.category
        );
        
        // 如果相同分类的商品不足3个，添加其他商品
        if (relatedItems.length < 3) {
            const otherItems = window.marketItems.filter(item => 
                item.id !== parseInt(currentItemId) && 
                item.category !== currentItem.category
            );
            
            // 按浏览量和收藏数排序
            otherItems.sort((a, b) => {
                const scoreA = a.views + (a.favorites * 2);
                const scoreB = b.views + (b.favorites * 2);
                return scoreB - scoreA;
            });
            
            // 添加到相关商品中，最多5个
            relatedItems = [...relatedItems, ...otherItems].slice(0, 5);
        }
        
        // 如果没有相关商品
        if (relatedItems.length === 0) {
            relatedItemsContainer.innerHTML = '<div class="no-related-items">暂无相关推荐</div>';
            return;
        }
        
        // 渲染相关推荐
        relatedItemsContainer.innerHTML = relatedItems.map(item => `
            <div class="related-item-card" data-id="${item.id}">
                <div class="related-item-img">
                    <img src="${item.images[0]}" alt="${item.title}">
                </div>
                <div class="related-item-content">
                    <h3 class="related-item-title">${item.title}</h3>
                    <div class="related-item-price">¥${item.price}</div>
                </div>
            </div>
        `).join('');
        
        // 添加点击事件
        document.querySelectorAll('.related-item-card').forEach(card => {
            card.addEventListener('click', () => {
                const itemId = card.dataset.id;
                window.location.href = `market-detail.html?id=${itemId}`;
            });
        });
        
    } catch (error) {
        console.error('加载相关推荐失败:', error);
        const relatedItemsContainer = document.getElementById('relatedItems');
        if (relatedItemsContainer) {
            relatedItemsContainer.innerHTML = '<div class="alert alert-danger">加载相关推荐失败</div>';
        }
    }
} 