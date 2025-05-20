import { userAPI, contentAPI } from './api.js';
import { initNavbar } from './nav-utils.js';

// 全局商品数据
window.marketItems = [];

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 初始化商品数据
        await initMarketItems();
        
        // 初始化导航栏
        await initNavbar();
        
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
    const marketGrid = document.querySelector('#itemsContainer');
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
    // 获取已有的发布按钮
    const createBtn = document.getElementById('publishBtn');
    if (!createBtn) {
        console.error('未找到发布按钮');
        return;
    }
    
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