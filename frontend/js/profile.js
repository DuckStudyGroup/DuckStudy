import { userAPI } from './api.js';
import { updateNavUserStatus } from './nav-utils.js';
import { BASE_URL } from './api.js';

// 获取 URL 参数中的 username
function getUrlUsername() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('username');
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 获取 URL 中的 username 参数
        const urlUsername = getUrlUsername();
        
        // 获取当前登录用户状态
        const userStatus = await userAPI.getStatus();
        
        // 更新导航栏用户状态 (使用共享函数)
        await updateNavUserStatus(userStatus);
        
        // 如果 URL 中有 username 参数，显示该用户的信息
        // 否则显示当前登录用户的信息
        const displayUsername = urlUsername || (userStatus.isLoggedIn ? userStatus.username : null);
        
        if (!displayUsername) {
            // 如果既没有 URL 参数也没有登录，跳转到登录页
            window.location.href = 'login.html';
            return;
        }
        
        // 判断是否是查看自己的主页
        const isOwnProfile = userStatus.isLoggedIn && displayUsername === userStatus.username;
        
        // 更新用户信息显示
        await updateProfileDisplay(displayUsername, isOwnProfile);
        
        // 只有在查看自己的主页时才添加编辑功能
        if (isOwnProfile) {
            // 添加导航切换事件
            addNavEvents();
            // 添加表单提交事件
            addFormEvents();
            // 加载浏览历史
            loadViewHistory();
        }
        
        // 初始化头像上传
        initAvatarUpload();
        
        // 添加表单提交事件
        const basicForm = document.getElementById('basicForm');
        if (basicForm) {
            basicForm.addEventListener('submit', handleBasicFormSubmit);
        }
    } catch (error) {
        console.error('初始化页面失败:', error);
        alert('加载页面失败，请刷新重试');
    }
});

// 更新个人资料显示
async function updateProfileDisplay(username, isOwnProfile) {
    try {
        // 更新用户名显示
        document.getElementById('profileUsername').textContent = username;
        
        // 加载用户详细信息，并传递 isOwnProfile
        await loadUserProfile(username, isOwnProfile);
        
        // 根据是否是自己的主页来调整界面
        const forms = document.querySelectorAll('.profile-form');
        const navItems = document.querySelectorAll('.nav-item');
        
        if (!isOwnProfile) {
            // 如果不是自己的主页，隐藏编辑功能
            forms.forEach(form => {
                const inputs = form.querySelectorAll('input, textarea');
                inputs.forEach(input => input.setAttribute('readonly', true));
                const buttons = form.querySelectorAll('button');
                buttons.forEach(button => button.style.display = 'none');
            });
            
            // 隐藏安全设置和消息通知选项
            navItems.forEach(item => {
                if (item.getAttribute('data-section') === 'security' || 
                    item.getAttribute('data-section') === 'notification' ||
                    item.getAttribute('data-section') === 'history') {
                    item.style.display = 'none';
                }
            });
        }

        // 更新"我的收藏"链接
        const favoritesLink = document.getElementById('favoritesLink');
        if (favoritesLink) {
            if (isOwnProfile) {
                favoritesLink.href = `favorites.html`; // 自己的收藏页面
                favoritesLink.innerHTML = '<i class="bi bi-heart-fill"></i> 我的收藏';
            } else {
                favoritesLink.href = `favorites.html?username=${username}`; // 他人的收藏页面
                favoritesLink.innerHTML = `<i class="bi bi-heart-fill"></i> TA的收藏`;
            }
        }

    } catch (error) {
        console.error('更新个人资料显示失败:', error);
        throw error;
    }
}

// 加载用户详细信息
async function loadUserProfile(username, isOwnProfile) {
    try {
        if (!username) {
            window.location.href = '/pages/login.html';
            return;
        }
        
        const response = await userAPI.getUserProfile(username);
        
        if (response.success) {
            const user = response.user;
            
            // 更新页面显示
            document.getElementById('profileUsername').textContent = user.nickname || user.username;
            document.getElementById('joinDate').textContent = user.registerDate;
            
            // 检测是否为默认头像
            const avatarImage = document.getElementById('avatarImage');
            const avatarIconContainer = document.querySelector('.profile-avatar .avatar-icon');
            
            if (user.avatar && !user.avatar.includes('placehold.jp')) {
                // 如果有自定义头像
                if (avatarIconContainer) {
                    // 如果当前是图标，替换回img
                    avatarImage.parentElement.innerHTML = `<img id="avatarImage" src="${user.avatar}" alt="用户头像">`;
                } else if (avatarImage) {
                    avatarImage.src = user.avatar;
                }
            } else {
                // 如果是默认头像或无头像
                if (avatarImage && !avatarIconContainer) {
                    avatarImage.parentElement.innerHTML = `
                        <div class="avatar-icon">
                            <i class="bi bi-person-circle"></i>
                        </div>`;
                } else if (!avatarImage && !avatarIconContainer) {
                    const avatarParent = document.querySelector('.profile-avatar');
                    if (avatarParent) {
                        avatarParent.innerHTML = `
                        <div class="avatar-icon">
                            <i class="bi bi-person-circle"></i>
                        </div>`;
                    }
                }
            }
            
            // 填充表单信息
            document.getElementById('username').value = user.username;
            document.getElementById('nickname').value = user.nickname || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('bio').value = user.bio || '';

            // 根据是否是自己的主页控制编辑功能
            const avatarUploadSection = document.getElementById('avatarUploadSection');
            if (avatarUploadSection) {
                avatarUploadSection.style.display = isOwnProfile ? 'block' : 'none';
            }
            
            if (isOwnProfile) {
                document.getElementById('nickname').removeAttribute('readonly');
                document.getElementById('email').removeAttribute('readonly');
                document.getElementById('bio').removeAttribute('readonly');
            } else {
                document.getElementById('nickname').setAttribute('readonly', true);
                document.getElementById('email').setAttribute('readonly', true);
                document.getElementById('bio').setAttribute('readonly', true);
            }
        } else {
            alert(response.message || '加载用户资料失败');
        }
    } catch (error) {
        console.error('加载用户资料失败:', error);
        alert('加载失败，请重试');
    }
}

// 添加导航切换事件
function addNavEvents() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const sectionId = item.getAttribute('data-section');
            
            if (sectionId) {
                e.preventDefault();
                
                // 移除所有活动状态
                navItems.forEach(nav => nav.classList.remove('active'));
                sections.forEach(section => section.classList.remove('active'));
                
                // 添加当前活动状态
                item.classList.add('active');
                const section = document.getElementById(sectionId);
                if (section) {
                    section.classList.add('active');
                    
                    // 如果切换到历史记录页面，重新加载历史记录
                    if (sectionId === 'history') {
                        loadViewHistory();
                    }
                }
            }
        });
    });
}

// 加载浏览历史
async function loadViewHistory() {
    try {
        const historyItems = document.getElementById('historyItems');
        if (!historyItems) return;

        // 从localStorage获取浏览历史
        const history = JSON.parse(localStorage.getItem('viewHistory') || '[]');
        
        if (history.length === 0) {
            historyItems.innerHTML = `
                <div class="history-empty">
                    <i class="bi bi-clock-history"></i>
                    <p>暂无浏览记录</p>
                </div>
            `;
            return;
        }

        // 按时间倒序排序
        history.sort((a, b) => b.timestamp - a.timestamp);

        // 生成历史记录HTML
        historyItems.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <a href="post-detail.html?id=${item.postId}" class="post-title">${item.title}</a>
                    </div>
                    <div class="col-md-3">
                        <span class="view-time">${formatDate(item.timestamp)}</span>
                    </div>
                    <div class="col-md-3">
                        <div class="actions">
                            <a href="post-detail.html?id=${item.postId}" class="btn btn-sm btn-outline-primary">
                                <i class="bi bi-eye"></i> 查看
                            </a>
                            <button class="btn btn-sm btn-outline-danger delete-history-btn" data-post-id="${item.postId}">
                                <i class="bi bi-trash"></i> 删除
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // 为所有删除按钮添加点击事件
        const deleteButtons = historyItems.querySelectorAll('.delete-history-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const postId = button.getAttribute('data-post-id');
                if (confirm('确定要删除这条浏览记录吗？')) {
                    removeFromHistory(postId);
                }
            });
        });
    } catch (error) {
        console.error('加载浏览历史失败:', error);
    }
}

// 从历史记录中删除
function removeFromHistory(postId) {
    try {
        // 从localStorage获取历史记录
        const history = JSON.parse(localStorage.getItem('viewHistory') || '[]');
        
        // 确保 postId 是数字类型
        const postIdNum = Number(postId);
        
        // 过滤掉要删除的记录
        const newHistory = history.filter(item => item.postId !== postIdNum);
        
        // 保存更新后的历史记录
        localStorage.setItem('viewHistory', JSON.stringify(newHistory));
        
        // 重新加载历史记录显示
        loadViewHistory();
    } catch (error) {
        console.error('删除历史记录失败:', error);
    }
}

// 格式化日期
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // 如果是今天的记录
    if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        if (hours < 1) {
            const minutes = Math.floor(diff / (60 * 1000));
            return `${minutes}分钟前`;
        }
        return `${hours}小时前`;
    }
    
    // 如果是昨天的记录
    if (diff < 48 * 60 * 60 * 1000) {
        return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 其他日期
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 添加表单提交事件
function addFormEvents() {
    // 基本信息表单
    const basicForm = document.getElementById('basicForm');
    if (basicForm) {
        basicForm.addEventListener('submit', handleBasicFormSubmit);
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
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } catch (error) {
                console.error('修改密码失败:', error);
                alert('修改密码失败，请重试');
            }
        });
    }
    
    // 消息通知表单
    const notificationForm = document.getElementById('notificationForm');
    if (notificationForm) {
        notificationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const emailNotification = document.getElementById('emailNotification').checked;
                const systemNotification = document.getElementById('systemNotification').checked;
                const marketNotification = document.getElementById('marketNotification').checked;
                
                // 这里应该调用后端API保存通知设置
                console.log('保存通知设置:', {
                    emailNotification,
                    systemNotification,
                    marketNotification
                });
                alert('通知设置保存成功！');
            } catch (error) {
                console.error('保存通知设置失败:', error);
                alert('保存设置失败，请重试');
            }
        });
    }
}

// 处理基本信息表单提交
async function handleBasicFormSubmit(event) {
    event.preventDefault();
    try {
        const nickname = document.getElementById('nickname').value;
        const email = document.getElementById('email').value;
        const bio = document.getElementById('bio').value;
        
        // 这里应该调用后端API更新用户信息
        const response = await userAPI.updateUser({
            nickname,
            email,
            bio
        });
        
        if (response.success) {
            alert('个人信息更新成功！');
        } else {
            alert(response.message || '更新失败，请重试');
        }
    } catch (error) {
        console.error('更新个人信息失败:', error);
        alert('更新失败，请重试');
    }
}

// 初始化头像上传
function initAvatarUpload() {
    const avatarUploadBtn = document.getElementById('uploadAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');
    
    if (avatarUploadBtn && avatarInput) {
        avatarUploadBtn.addEventListener('click', () => {
            avatarInput.click();
        });
        
        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await handleAvatarUpload(file);
                } catch (error) {
                    console.error('上传头像失败:', error);
                    alert('上传头像失败，请重试');
                }
            }
        });
    }
}

// 处理头像上传
async function handleAvatarUpload(file) {
    try {
        // 这里应该调用后端API上传头像
        const formData = new FormData();
        formData.append('image', file);
        formData.append('directory', 'avatars');
        
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 更新头像显示
            const avatarImage = document.getElementById('avatarImage');
            if (avatarImage) {
                avatarImage.src = data.imageUrl;
            }
            
            // 更新用户信息
            await userAPI.updateUserInfo({
                avatar: data.imageUrl
            });
            
            alert('头像更新成功！');
        } else {
            throw new Error(data.message || '上传失败');
        }
    } catch (error) {
        console.error('上传头像失败:', error);
        throw error;
    }
}
