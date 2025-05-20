import { userAPI } from './api.js';

/**
 * 检查是否为默认头像
 * @param {string} avatarUrl 头像URL
 * @returns {boolean} 是否为默认头像
 */
export function isDefaultAvatar(avatarUrl) {
    return avatarUrl && avatarUrl.includes('placehold.jp');
}

/**
 * 渲染头像HTML
 * @param {string} avatarUrl 头像URL
 * @param {string} username 用户名
 * @returns {string} 头像HTML
 */
export function renderAvatar(avatarUrl, username) {
    if (isDefaultAvatar(avatarUrl)) {
        return `<div class="avatar"><i class="bi bi-person-circle"></i></div>`;
    } else {
        return `<img src="${avatarUrl}" alt="${username || '用户'}的头像" class="avatar-img" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`;
    }
}

/**
 * 更新导航栏用户状态
 * @param {Object} userStatus 用户状态对象
 */
export async function updateNavUserStatus(userStatus) {
    const userSection = document.getElementById('userSection');
    
    if (!userSection) {
        console.error('未找到用户区域元素');
        return;
    }
    
    // 检查页面位置（是在根目录还是子目录）
    const isInSubdirectory = window.location.pathname.includes('/pages/');
    const profilePath = isInSubdirectory ? 'profile.html' : 'pages/profile.html';
    const favoritesPath = isInSubdirectory ? 'favorites.html' : 'pages/favorites.html';
    const historyPath = isInSubdirectory ? 'history.html' : 'pages/history.html';
    const loginPath = isInSubdirectory ? 'login.html' : 'pages/login.html';
    const registerPath = isInSubdirectory ? 'register.html' : 'pages/register.html';
    const homePath = isInSubdirectory ? '../index.html' : 'index.html';
    
    if (userStatus.isLoggedIn) {
        const avatarHtml = renderAvatar(userStatus.avatar, userStatus.username);
        
        userSection.innerHTML = `
            <div class="user-profile">
                <div class="avatar-container">
                    ${avatarHtml}
                    <div class="dropdown-menu">
                        <a href="${profilePath}" class="dropdown-item">
                            <i class="bi bi-person"></i> 个人中心
                        </a>
                        <a href="${favoritesPath}" class="dropdown-item">
                            <i class="bi bi-heart"></i> 我的收藏
                        </a>
                        <a href="${historyPath}" class="dropdown-item">
                            <i class="bi bi-clock-history"></i> 历史观看
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item" id="logoutBtn">
                            <i class="bi bi-box-arrow-right"></i> 退出登录
                        </a>
                    </div>
                </div>
                <span class="username">${userStatus.username}</span>
            </div>
        `;

        // 添加退出登录事件监听
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await userAPI.logout();
                    window.location.href = homePath;
                } catch (error) {
                    console.error('退出登录失败:', error);
                    alert('退出登录失败，请重试');
                }
            });
        }
        
        // 添加头像下拉菜单事件
        const avatarContainer = document.querySelector('.avatar-container');
        if (avatarContainer) {
            avatarContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdownMenu = avatarContainer.querySelector('.dropdown-menu');
                if (dropdownMenu) {
                    dropdownMenu.classList.toggle('show');
                }
            });
            
            // 点击其他地方关闭下拉菜单
            document.addEventListener('click', () => {
                const dropdownMenu = avatarContainer.querySelector('.dropdown-menu');
                if (dropdownMenu && dropdownMenu.classList.contains('show')) {
                    dropdownMenu.classList.remove('show');
                }
            });
        }
    } else {
        userSection.innerHTML = `
            <a href="${loginPath}" class="btn btn-outline-primary me-2">登录</a>
            <a href="${registerPath}" class="btn btn-primary">注册</a>
        `;
    }
}

/**
 * 初始化导航栏
 */
export async function initNavbar() {
    try {
        // 获取用户状态
        const userStatus = await userAPI.getStatus();
        
        // 更新导航栏用户状态
        await updateNavUserStatus(userStatus);
    } catch (error) {
        console.error('初始化导航栏失败:', error);
        // 如果获取状态失败，显示登录按钮
        const userSection = document.getElementById('userSection');
        if (userSection) {
            const isInSubdirectory = window.location.pathname.includes('/pages/');
            const loginPath = isInSubdirectory ? 'login.html' : 'pages/login.html';
            const registerPath = isInSubdirectory ? 'register.html' : 'pages/register.html';
            
            userSection.innerHTML = `
                <a href="${loginPath}" class="btn btn-outline-primary me-2">登录</a>
                <a href="${registerPath}" class="btn btn-primary">注册</a>
            `;
        }
    }
} 