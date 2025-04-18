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
        
        // 加载商品列表
        await loadMarketItems();
        
        // 添加分类切换事件
        addCategoryEvents();
        
        // 添加搜索功能
        addSearchEvents();
        
        // 添加发布商品按钮事件
        addCreateItemBtn();
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

// 加载商品列表
async function loadMarketItems(category = '', searchTerm = '') {
    const marketGrid = document.querySelector('.market-grid');
    const resultCount = document.getElementById('resultCount');
    
    if (!marketGrid) {
        console.error('未找到商品列表容器');
        return;
    }
    
    // 筛选商品
    let filteredItems = window.marketItems;
    
    // 按分类筛选
    if (category && category !== 'all') {
        filteredItems = filteredItems.filter(item => item.category === category);
    }
    
    // 按搜索词筛选
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredItems = filteredItems.filter(item => 
            item.title.toLowerCase().includes(term) || 
            item.description.toLowerCase().includes(term) ||
            item.location.toLowerCase().includes(term)
        );
    }
    
    // 更新结果数量提示
    if (resultCount) {
        if (category || searchTerm) {
            resultCount.textContent = `找到 ${filteredItems.length} 个商品`;
            resultCount.style.display = 'block';
        } else {
            resultCount.style.display = 'none';
        }
    }
    
    // 没有结果时显示提示
    if (filteredItems.length === 0) {
        marketGrid.innerHTML = '<div class="no-results">没有找到符合条件的商品</div>';
        return;
    }
    
    // 渲染商品列表
    marketGrid.innerHTML = filteredItems.map(item => {
        const categoryInfo = getCategoryInfo(item.category);
        return `
            <div class="market-card" data-id="${item.id}">
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
    
    // 添加商品点击事件
    addMarketItemClickEvents();
}

// 添加商品点击事件
function addMarketItemClickEvents() {
    const marketCards = document.querySelectorAll('.market-card');
    marketCards.forEach(card => {
        card.addEventListener('click', () => {
            const itemId = card.dataset.id;
            window.location.href = `market-detail.html?id=${itemId}`;
        });
    });
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
            
            // 获取分类值并加载商品
            const category = item.dataset.category || '';
            const searchInput = document.querySelector('.search-box input');
            const searchTerm = searchInput ? searchInput.value.trim() : '';
            
            loadMarketItems(category, searchTerm);
        });
    });
}

// 添加搜索功能
function addSearchEvents() {
    const searchInput = document.querySelector('.search-box input');
    const searchIcon = document.querySelector('.search-box i');
    
    if (searchInput && searchIcon) {
        // 点击搜索图标触发搜索
        searchIcon.addEventListener('click', () => {
            const activeCategory = document.querySelector('.category-item.active');
            const category = activeCategory ? activeCategory.dataset.category : '';
            loadMarketItems(category, searchInput.value.trim());
        });
        
        // 回车键触发搜索
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeCategory = document.querySelector('.category-item.active');
                const category = activeCategory ? activeCategory.dataset.category : '';
                loadMarketItems(category, searchInput.value.trim());
            }
        });
    }
}

// 添加发布商品按钮
function addCreateItemBtn() {
    // 查找main-content元素
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    // 创建发布按钮元素
    const createBtn = document.createElement('button');
    createBtn.className = 'create-item-btn';
    createBtn.id = 'createItemBtn';
    createBtn.innerHTML = '<i class="bi bi-plus-lg"></i>';
    
    // 添加到页面
    mainContent.appendChild(createBtn);
    
    // 添加点击事件
    createBtn.addEventListener('click', async () => {
        try {
            const userResponse = await userAPI.getStatus();
            if (!userResponse.isLoggedIn) {
                alert('请先登录后再发布商品');
                return;
            }
            
            // 跳转到发布商品页面
            window.location.href = 'market-publish.html';
        } catch (error) {
            console.error('检查用户状态失败:', error);
            alert('请先登录后再发布商品');
        }
    });
} 