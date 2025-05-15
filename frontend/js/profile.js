import { userAPI } from './api.js';

// 初始化用户配置文件页面
async function initProfilePage() {
    try {
        // 获取当前用户状态
        const currentUserResponse = await userAPI.getStatus();
        if (!currentUserResponse.isLoggedIn) {
            // 如果未登录，重定向到登录页面
            alert('请先登录');
            window.location.href = 'login.html';
            return;
        }

        // 更新顶部导航栏用户状态
        await updateUserStatus(currentUserResponse);
        
        // 获取URL中的用户名参数
        const urlParams = new URLSearchParams(window.location.search);
        const profileUsername = urlParams.get('username');
        
        // 如果URL中有用户名参数且不是当前用户，则加载该用户的信息
        if (profileUsername && profileUsername !== currentUserResponse.username) {
            await loadOtherUserProfile(profileUsername, currentUserResponse.username);
        } else {
            // 否则加载当前用户的个人信息
            await loadCurrentUserProfile(currentUserResponse);
        }
        
        // 添加导航选项卡切换事件
        addTabSwitchEvents();
    } catch (error) {
        console.error('初始化用户资料页面失败:', error);
        alert('加载用户资料失败，请重试');
    }


// 更新用户状态
async function updateUserStatus(userData) {
    try {
        const userSection = document.getElementById('userSection');
        
        if (!userSection) {
            console.error('未找到用户区域元素');
            return;
        }
        
        if (userData.isLoggedIn) {
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
                    <span class="username">${userData.username}</span>
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
        console.error('更新用户状态失败:', error);
    }
}

// 加载当前登录用户的个人信息
async function loadCurrentUserProfile(userData) {
    // 设置资料页面标题
    document.title = `${userData.username} 的个人中心 - DuckStudy`;
    
    // 更新头像和用户名
    const profileUsername = document.getElementById('profileUsername');
    const joinDate = document.getElementById('joinDate');
    
    if (profileUsername) {
        profileUsername.textContent = userData.username;
    }
    
    if (joinDate) {
        // 模拟注册日期
        joinDate.textContent = '2023-01-01';
    }
    
    // 填充基本信息表单
    document.getElementById('username').value = userData.username;
    document.getElementById('nickname').value = userData.nickname || userData.username;
    document.getElementById('bio').value = userData.bio || '';
    document.getElementById('email').value = userData.email || '';
    
    // 启用表单编辑
    enableFormEditing(true);
    
    // 添加表单提交事件
    addFormSubmitEvents();
}

// 加载其他用户的个人信息（非当前登录用户）
async function loadOtherUserProfile(username, currentUsername) {
    try {
        // 获取其他用户的信息
        // 这里是模拟数据，实际项目中应该从API获取
        const userData = {
            username: username,
            nickname: username,
            bio: '这是一个默认的个人简介，实际项目中应从API获取',
            joinDate: '2023-02-01',
            // 其他用户信息
        };
        
        // 设置页面标题
        document.title = `${username} 的个人主页 - DuckStudy`;
        
        // 更新头像和用户名
        const profileUsername = document.getElementById('profileUsername');
        const joinDate = document.getElementById('joinDate');
        
        if (profileUsername) {
            profileUsername.textContent = userData.username;
        }
        
        if (joinDate) {
            joinDate.textContent = userData.joinDate;
        }
        
        // 填充基本信息表单
        document.getElementById('username').value = userData.username;
        document.getElementById('nickname').value = userData.nickname || userData.username;
        document.getElementById('bio').value = userData.bio || '';
        
        // 隐藏安全设置和通知设置选项卡
        const securityTab = document.querySelector('.nav-item[data-section="security"]');
        const notificationTab = document.querySelector('.nav-item[data-section="notification"]');
        
        if (securityTab) securityTab.style.display = 'none';
        if (notificationTab) notificationTab.style.display = 'none';
        
        // 禁用表单编辑
        enableFormEditing(false);
        
        // 修改页面显示为查看模式
        document.querySelector('.content-section.active h2').textContent = `${username} 的个人资料`;
        
        // 隐藏表单提交按钮
        const submitBtn = document.querySelector('#basicForm button[type="submit"]');
        if (submitBtn) submitBtn.style.display = 'none';
        
    } catch (error) {
        console.error('加载用户资料失败:', error);
        alert('加载用户资料失败，请重试');
    }
}

// 启用或禁用表单编辑
function enableFormEditing(enable) {
    const inputs = document.querySelectorAll('#basicForm input:not([readonly]), #basicForm textarea');
    inputs.forEach(input => {
        input.disabled = !enable;
    });
}

// 添加表单提交事件
function addFormSubmitEvents() {
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
                
                // 模拟保存用户资料
                alert('个人资料更新成功');
                
                // 实际项目中应调用API保存数据
                // await userAPI.updateProfile(formData);
                
            } catch (error) {
                console.error('更新个人资料失败:', error);
                alert('更新个人资料失败，请重试');
            }
        });
    }
    
    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                if (!currentPassword || !newPassword || !confirmPassword) {
                    alert('请填写所有密码字段');
                    return;
                }
                
                if (newPassword !== confirmPassword) {
                    alert('两次输入的新密码不一致');
                    return;
                }
                
                // 模拟密码修改
                alert('密码修改成功');
                
                // 清空表单
                securityForm.reset();
                
                // 实际项目中应调用API修改密码
                // await userAPI.updatePassword(currentPassword, newPassword);
                
            } catch (error) {
                console.error('修改密码失败:', error);
                alert('修改密码失败，请重试');
            }
        });
    }
    
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
                
                // 模拟保存通知设置
                alert('通知设置更新成功');
                
                // 实际项目中应调用API保存通知设置
                // await userAPI.updateNotificationSettings(formData);
                
            } catch (error) {
                console.error('更新通知设置失败:', error);
                alert('更新通知设置失败，请重试');
            }
        });
    }
}

// 添加选项卡切换事件
function addTabSwitchEvents() {
    const navItems = document.querySelectorAll('.profile-nav .nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        if (item.dataset.section) {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 移除所有active类
                navItems.forEach(nav => nav.classList.remove('active'));
                contentSections.forEach(section => section.classList.remove('active'));
                
                // 添加active类到当前点击项
                item.classList.add('active');
                
                // 显示对应的内容区域
                const targetSection = document.getElementById(item.dataset.section);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
            });
        }
    });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    initProfilePage();
}); 

