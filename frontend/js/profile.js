import { userAPI } from './api.js';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 更新用户状态
        await updateUserStatus();
        
        // 添加导航切换事件
        addNavEvents();
        
        // 添加表单提交事件
        addFormEvents();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
});

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
            // 更新用户信息
            document.getElementById('profileUsername').textContent = response.username;
            document.getElementById('username').value = response.username;
            
            // 加载用户详细信息
            await loadUserProfile(response.username);
            
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
                        window.location.href = '../index.html';
                    } catch (error) {
                        console.error('退出登录失败:', error);
                        alert('退出登录失败，请重试');
                    }
                });
            }
        } else {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('获取用户状态失败:', error);
        window.location.href = 'login.html';
    }
}

// 加载用户详细信息
async function loadUserProfile(username) {
    try {
        // 这里应该调用后端API获取用户详细信息
        // 目前使用模拟数据
        const mockProfile = {
            nickname: username,
            bio: '这个人很懒，什么都没写...',
            email: `${username}@example.com`,
            joinDate: '2024-01-01'
        };
        
        // 更新表单数据
        document.getElementById('nickname').value = mockProfile.nickname;
        document.getElementById('bio').value = mockProfile.bio;
        document.getElementById('email').value = mockProfile.email;
        document.getElementById('joinDate').textContent = mockProfile.joinDate;
    } catch (error) {
        console.error('加载用户信息失败:', error);
    }
}

// 添加导航切换事件
function addNavEvents() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 移除所有活动状态
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // 添加当前活动状态
            item.classList.add('active');
            const sectionId = item.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

// 添加表单提交事件
function addFormEvents() {
    // 基本信息表单
    const basicForm = document.getElementById('basicForm');
    if (basicForm) {
        basicForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const formData = {
                    nickname: document.getElementById('nickname').value,
                    bio: document.getElementById('bio').value,
                    email: document.getElementById('email').value
                };
                
                // 这里应该调用后端API保存用户信息
                console.log('保存基本信息:', formData);
                alert('保存成功！');
            } catch (error) {
                console.error('保存基本信息失败:', error);
                alert('保存失败，请重试');
            }
        });
    }
    
    // 安全设置表单
    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                if (newPassword !== confirmPassword) {
                    alert('两次输入的密码不一致');
                    return;
                }
                
                // 这里应该调用后端API修改密码
                console.log('修改密码:', { currentPassword, newPassword });
                alert('密码修改成功！');
                
                // 清空表单
                securityForm.reset();
            } catch (error) {
                console.error('修改密码失败:', error);
                alert('修改失败，请重试');
            }
        });
    }
    
    // 消息通知表单
    const notificationForm = document.getElementById('notificationForm');
    if (notificationForm) {
        notificationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const formData = {
                    emailNotification: document.getElementById('emailNotification').checked,
                    systemNotification: document.getElementById('systemNotification').checked,
                    marketNotification: document.getElementById('marketNotification').checked
                };
                
                // 这里应该调用后端API保存通知设置
                console.log('保存通知设置:', formData);
                alert('设置保存成功！');
            } catch (error) {
                console.error('保存通知设置失败:', error);
                alert('保存失败，请重试');
            }
        });
    }
} 