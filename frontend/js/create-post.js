import { userAPI, contentAPI } from './api.js';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 检查用户登录状态
        await checkLoginStatus();
        
        // 添加表单提交事件
        addFormSubmitEvent();
        
        // 添加取消按钮事件
        addCancelEvent();
    } catch (error) {
        console.error('初始化失败:', error);
        alert('页面加载失败，请刷新重试');
    }
});

// 检查用户登录状态
async function checkLoginStatus() {
    try {
        const response = await userAPI.getStatus();
        if (!response.isLoggedIn) {
            alert('请先登录后再发帖');
            window.location.href = 'login.html';
            return;
        }
        
        // 更新用户状态显示
        updateUserStatus(response);
    } catch (error) {
        console.error('检查登录状态失败:', error);
        alert('检查登录状态失败，请刷新重试');
    }
}

// 更新用户状态显示
function updateUserStatus(response) {
    const userSection = document.getElementById('userSection');
    if (!userSection) return;

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
                    window.location.href = 'login.html';
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
}

// 添加表单提交事件
function addFormSubmitEvent() {
    const form = document.getElementById('createPostForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            // 获取表单数据
            const title = document.getElementById('postTitle').value.trim();
            const category = document.getElementById('postCategory').value;
            const content = document.getElementById('postContent').value.trim();
            const tags = document.getElementById('postTags').value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
            
            // 验证表单数据
            if (!title || !category || !content) {
                alert('请填写所有必填项');
                return;
            }
            
            // 禁用提交按钮
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 发布中...';
            
            // 获取用户信息
            const userResponse = await userAPI.getStatus();
            if (!userResponse.isLoggedIn) {
                throw new Error('用户未登录');
            }
            
            // 创建新帖子
            const newPost = {
                id: Date.now(), // 使用时间戳作为临时ID
                title: title,
                author: userResponse.username,
                date: new Date().toISOString().split('T')[0],
                views: 0,
                likes: 0,
                category: category,
                tags: tags,
                content: content
            };
            
            // 将新帖子添加到帖子列表
            window.mockPosts = window.mockPosts || [];
            window.mockPosts.unshift(newPost);
            
            // 模拟发布延迟
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 发布成功
            alert('发布成功！');
            window.location.href = 'posts.html';
        } catch (error) {
            console.error('发布帖子失败:', error);
            alert('发布失败，请重试');
            
            // 恢复提交按钮
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = false;
            submitBtn.textContent = '发布';
        }
    });
}

// 添加取消按钮事件
function addCancelEvent() {
    const cancelBtn = document.getElementById('cancelBtn');
    if (!cancelBtn) return;

    cancelBtn.addEventListener('click', () => {
        if (confirm('确定要取消发布吗？')) {
            window.location.href = 'posts.html';
        }
    });
} 