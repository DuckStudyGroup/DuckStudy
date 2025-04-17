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
            window.location.href = 'pages/login.html';
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
function updateUserStatus(userData) {
    const userSection = document.getElementById('userSection');
    if (!userSection) return;

    if (userData.isLoggedIn) {
        userSection.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-link dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle"></i> ${userData.username}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="profile.html">个人中心</a></li>
                    <li><a class="dropdown-item" href="favorites.html">我的收藏</a></li>
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
            <a href="pages/login.html" class="btn btn-outline-primary me-2">登录</a>
            <a href="pages/register.html" class="btn btn-primary">注册</a>
        `;
    }
}

// 处理表单提交
async function addFormSubmitEvent() {
    const form = document.getElementById('createPostForm');
    if (!form) {
        console.error('未找到表单元素');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 获取表单数据
        const title = document.getElementById('title')?.value;
        const content = document.getElementById('content')?.value;
        const category = document.getElementById('category')?.value;
        const tags = document.getElementById('tags')?.value.split(',').map(tag => tag.trim());
        
        // 验证表单数据
        if (!title || !content || !category) {
            alert('请填写所有必填项');
            return;
        }
        
        // 获取当前用户信息
        const userResponse = await userAPI.getStatus();
        if (!userResponse.isLoggedIn) {
            alert('请先登录');
            return;
        }
        
        // 创建新帖子对象
        const newPost = {
            id: Date.now(), // 使用时间戳作为ID
            title: title,
            author: userResponse.username,
            date: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }),
            views: 0,
            likes: 0,
            category: category,
            tags: tags,
            content: content
        };
        
        try {
            // 使用API创建帖子
            const response = await contentAPI.createPost(newPost);
            
            if (response.success) {
                // 提示用户发帖成功
                alert('发帖成功！');
                
                // 跳转到帖子列表页面
                window.location.href = 'posts.html';
            } else {
                alert(response.message || '发帖失败，请重试');
            }
        } catch (error) {
            console.error('发帖失败:', error);
            alert('发帖失败，请重试');
        }
    });
}

// 添加取消按钮事件
function addCancelEvent() {
    const cancelBtn = document.getElementById('cancelBtn');
    if (!cancelBtn) {
        console.error('未找到取消按钮');
        return;
    }

    cancelBtn.addEventListener('click', () => {
        if (confirm('确定要取消发布吗？')) {
            window.location.href = 'posts.html';
        }
    });
} 