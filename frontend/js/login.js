import { BASE_URL } from './api.js';
import { initNavbar } from './nav-utils.js';

// 登录功能
document.addEventListener('DOMContentLoaded', () => {
    // 初始化导航栏
    initNavbar();
    
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // 获取表单数据
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe')?.checked || false;
            
            // 验证表单数据
            if (!username || !password) {
                showError('用户名和密码不能为空');
                return;
            }
            
            try {
                // 显示加载状态
                const submitBtn = document.getElementById('loginBtn');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>登录中...';
                
                // 发送登录请求
                const response = await fetch(`${BASE_URL}/api/user/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password }),
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // 登录成功，保存用户信息
                    const userData = {
                        username: data.user.username,
                        email: data.user.email,
                        role: data.user.role,
                        avatar: data.user.avatar || 'https://placehold.jp/40x40.png',
                        rememberMe: rememberMe
                    };
                    
                    localStorage.setItem('userData', JSON.stringify(userData));
                    
                    // 跳转到首页 (由于在pages目录下，所以要跳转到上一级)
                    window.location.href = '../index.html';
                } else {
                    // 显示错误信息
                    showError(data.message || '登录失败，请重试');
                }
            } catch (error) {
                console.error('登录请求失败:', error);
                showError('登录失败，请检查网络连接');
            } finally {
                // 恢复按钮状态
                const submitBtn = document.getElementById('loginBtn');
                submitBtn.disabled = false;
                submitBtn.textContent = '登录';
            }
        });
    }
    
    // 显示错误信息
    function showError(message) {
        if (loginError) {
            loginError.textContent = message;
            loginError.classList.remove('d-none');
            
            // 5秒后自动隐藏错误信息
            setTimeout(() => {
                loginError.classList.add('d-none');
            }, 5000);
        }
    }
    
    // 密码可见性切换
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    
    if (passwordInput && togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePasswordBtn.innerHTML = '<i class="bi bi-eye-slash"></i>';
            } else {
                passwordInput.type = 'password';
                togglePasswordBtn.innerHTML = '<i class="bi bi-eye"></i>';
            }
        });
    }
}); 