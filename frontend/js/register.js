import { BASE_URL } from './api.js';

// 注册功能
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerError = document.getElementById('registerError');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // 获取表单数据
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const acceptTerms = document.getElementById('terms')?.checked || false;
            
            // 验证表单数据
            if (!username || !email || !password || !confirmPassword) {
                showError('所有字段都为必填项');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('两次输入的密码不匹配');
                return;
            }
            
            if (!acceptTerms) {
                showError('请阅读并同意服务条款');
                return;
            }
            
            // 验证邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showError('请输入有效的电子邮箱地址');
                return;
            }
            
            try {
                // 显示加载状态
                const submitBtn = document.getElementById('registerBtn');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>注册中...';
                
                // 发送注册请求
                const response = await fetch(`${BASE_URL}/api/user/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password }),
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // 注册成功，显示成功信息
                    registerForm.reset();
                    showSuccess('注册成功！正在跳转到登录页面...');
                    
                    // 3秒后跳转到登录页面
                    setTimeout(() => {
                        window.location.href = '/pages/login.html';
                    }, 3000);
                } else {
                    // 显示错误信息
                    showError(data.message || '注册失败，请重试');
                }
            } catch (error) {
                console.error('注册请求失败:', error);
                showError('注册失败，请检查网络连接');
            } finally {
                // 恢复按钮状态
                const submitBtn = document.getElementById('registerBtn');
                submitBtn.disabled = false;
                submitBtn.textContent = '注册';
            }
        });
    }
    
    // 显示错误信息
    function showError(message) {
        if (registerError) {
            registerError.textContent = message;
            registerError.classList.remove('d-none', 'alert-success');
            registerError.classList.add('alert-danger');
            
            // 5秒后自动隐藏错误信息
            setTimeout(() => {
                registerError.classList.add('d-none');
            }, 5000);
        }
    }
    
    // 显示成功信息
    function showSuccess(message) {
        if (registerError) {
            registerError.textContent = message;
            registerError.classList.remove('d-none', 'alert-danger');
            registerError.classList.add('alert-success');
        }
    }
    
    // 实时密码匹配验证
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (passwordInput && confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            if (passwordInput.value !== confirmPasswordInput.value) {
                confirmPasswordInput.setCustomValidity('密码不匹配');
            } else {
                confirmPasswordInput.setCustomValidity('');
            }
        });
        
        passwordInput.addEventListener('input', () => {
            if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
                confirmPasswordInput.setCustomValidity('密码不匹配');
            } else {
                confirmPasswordInput.setCustomValidity('');
            }
        });
    }
}); 