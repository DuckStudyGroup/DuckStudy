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
        
        // 加载用户详细信息
        await loadUserProfile(username);
        
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
                    item.getAttribute('data-section') === 'notification') {
                    item.style.display = 'none';
                }
            });
        }
    } catch (error) {
        console.error('更新个人资料显示失败:', error);
        throw error;
    }
}

// 加载用户详细信息
async function loadUserProfile(username) {
    try {
        // 获取当前登录用户
        const currentUser = localStorage.getItem('username');
        
        // 如果没有用户名，跳转到登录页
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
            const isDefaultAvatar = user.avatar.includes('placehold.jp');
            
            if (isDefaultAvatar) {
                // 如果是默认头像，将img标签替换为图标
                const parentElement = avatarImage.parentElement;
                parentElement.innerHTML = `
                    <div class="avatar-icon">
                        <i class="bi bi-person-circle"></i>
                    </div>`;
            } else {
                // 如果是自定义头像，直接设置src
                avatarImage.src = user.avatar;
            }
            
            // 如果是查看自己的资料，显示编辑选项
            const isOwnProfile = currentUser === username;
            const avatarUploadSection = document.getElementById('avatarUploadSection');
            if (avatarUploadSection) {
                avatarUploadSection.style.display = isOwnProfile ? 'block' : 'none';
            }
            
            if (isOwnProfile) {
                // 填充表单
                document.getElementById('username').value = user.username;
                document.getElementById('nickname').value = user.nickname || '';
                document.getElementById('email').value = user.email || '';
                document.getElementById('bio').value = user.bio || '';
                
                // 启用表单编辑
                document.getElementById('nickname').removeAttribute('readonly');
                document.getElementById('email').removeAttribute('readonly');
                document.getElementById('bio').removeAttribute('readonly');
            } else {
                // 禁用表单编辑
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
            e.preventDefault();
            
            // 移除所有活动状态
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // 添加当前活动状态
            item.classList.add('active');
            const sectionId = item.getAttribute('data-section');
            if (sectionId) {
                const section = document.getElementById(sectionId);
                if (section) {
                    section.classList.add('active');
                }
            }
        });
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

// 头像上传相关功能
function initAvatarUpload() {
    const fileInput = document.getElementById('avatarInput');
    const uploadBtn = document.getElementById('uploadAvatarBtn');
    const avatarImg = document.querySelector('.profile-avatar img');
    const uploadSection = document.getElementById('avatarUploadSection');

    // 如果未找到必要元素，退出初始化
    if (!fileInput || !uploadBtn || !avatarImg) {
        console.log('头像上传功能初始化：未找到必要的DOM元素');
        return;
    }

    // 确保上传按钮是可见的，针对自己的资料页面
    const currentUser = localStorage.getItem('username');
    const urlUsername = getUrlUsername();
    
    if (uploadSection && (urlUsername === currentUser || !urlUsername)) {
        uploadSection.style.display = 'block';
    }

    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件');
            return;
        }

        // 验证文件大小（最大 2MB）
        if (file.size > 2 * 1024 * 1024) {
            alert('图片大小不能超过 2MB');
            return;
        }

        try {
            await handleAvatarUpload(file);
        } catch (error) {
            console.error('上传头像失败:', error);
            alert('上传失败，请重试');
        }
    });
}

// 处理基本信息表单提交
async function handleBasicFormSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = {
            email: document.getElementById('email').value,
            nickname: document.getElementById('nickname').value,
            bio: document.getElementById('bio').value
        };
        
        const response = await userAPI.updateUserInfo(formData);
        
        if (response.success) {
            alert('个人信息更新成功');
            // 刷新页面显示
            await loadUserProfile(getUrlUsername() || localStorage.getItem('username'));
        } else {
            alert(response.message || '更新失败，请重试');
        }
    } catch (error) {
        console.error('更新个人信息失败:', error);
        alert('更新失败，请重试');
    }
}

// 处理头像上传
async function handleAvatarUpload(file) {
    try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('directory', 'avatars');
        
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 更新用户头像
            const updateResponse = await userAPI.updateUserInfo({
                avatar: data.imageUrl
            });
            
            if (updateResponse.success) {
                // 确保BASE_URL定义正确
                const avatarUrl = data.imageUrl.startsWith('http') 
                    ? data.imageUrl 
                    : (typeof BASE_URL !== 'undefined' ? BASE_URL : window.location.origin) + data.imageUrl;
                
                // 更新头像显示 - 处理默认头像被替换为图标的情况
                const avatarParent = document.querySelector('.profile-avatar');
                if (avatarParent) {
                    // 无论当前是默认头像还是自定义头像，都重新创建img元素
                    avatarParent.innerHTML = `<img id="avatarImage" src="${avatarUrl}" alt="用户头像">`;
                }
                
                // 更新导航栏头像
                const userStatus = await userAPI.getStatus();
                await updateNavUserStatus(userStatus);
                
                alert('头像更新成功');
            } else {
                alert(updateResponse.message || '头像更新失败');
            }
        } else {
            alert(data.message || '图片上传失败');
        }
    } catch (error) {
        console.error('上传头像失败:', error);
        alert('上传失败，请重试');
    }
} 
