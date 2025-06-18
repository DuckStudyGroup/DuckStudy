/**
 * 登录页面功能测试
 * 测试登录表单提交、错误处理、密码可见性切换等功能
 */

// 模拟依赖
jest.mock('../../../frontend/js/api.js', () => ({
  BASE_URL: 'http://localhost:5000',
  userAPI: {
    login: jest.fn(),
    getStatus: jest.fn()
  }
}));

jest.mock('../../../frontend/js/nav-utils.js', () => ({
  initNavbar: jest.fn(() => Promise.resolve())
}));

// 导入被测试的模块和依赖
import { BASE_URL } from '../../../frontend/js/api.js';
import { initNavbar } from '../../../frontend/js/nav-utils.js';

// 设置DOM环境
const setupDOM = () => {
  document.body.innerHTML = `
    <div class="container">
      <div class="row">
        <div class="col-md-6 offset-md-3">
          <div class="login-form">
            <h2>登录</h2>
            <div id="loginError" class="alert alert-danger d-none"></div>
            <form id="loginForm">
              <div class="form-group">
                <label for="username">用户名</label>
                <input type="text" id="username" class="form-control" placeholder="请输入用户名">
              </div>
              <div class="form-group">
                <label for="password">密码</label>
                <div class="password-input-group">
                  <input type="password" id="password" class="form-control" placeholder="请输入密码">
                  <button type="button" class="toggle-password">
                    <i class="bi bi-eye"></i>
                  </button>
                </div>
              </div>
              <div class="form-check">
                <input type="checkbox" id="rememberMe" class="form-check-input">
                <label class="form-check-label" for="rememberMe">记住我</label>
              </div>
              <button type="submit" id="loginBtn" class="btn btn-primary">登录</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
};

// 在每个测试前准备环境
beforeEach(() => {
  // 重置DOM
  setupDOM();
  
  // 重置模拟
  jest.clearAllMocks();
  
  // 重置localStorage
  localStorage.clear();
  
  // 模拟fetch
  global.fetch = jest.fn();
  
  // 模拟window.location
  delete window.location;
  window.location = {
    href: 'http://localhost:5000/pages/login.html'
  };
});

describe('登录页面功能测试', () => {
  // 1. 测试DOMContentLoaded事件
  test('页面加载时应初始化导航栏', () => {
    // 导入login.js模块，触发DOMContentLoaded事件处理程序
    require('../../../frontend/js/login.js');
    
    // 手动触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 验证initNavbar被调用
    expect(initNavbar).toHaveBeenCalled();
  });
  
  // 2. 测试表单验证
  test('表单提交时应验证用户名和密码', () => {
    // 导入login.js模块
    require('../../../frontend/js/login.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 获取表单元素
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    // 触发表单提交事件（不填写用户名和密码）
    loginForm.dispatchEvent(new Event('submit'));
    
    // 验证错误信息显示
    expect(loginError.textContent).toBe('用户名和密码不能为空');
    expect(loginError.classList.contains('d-none')).toBe(false);
    
    // 验证fetch未被调用
    expect(global.fetch).not.toHaveBeenCalled();
  });
  
  // 3. 测试登录成功
  test('登录成功应保存用户数据并跳转到首页', async () => {
    // 模拟fetch响应
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        user: {
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          avatar: '/images/avatars/default.png'
        }
      })
    });
    
    // 导入login.js模块
    require('../../../frontend/js/login.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 填写表单
    document.getElementById('username').value = 'testuser';
    document.getElementById('password').value = 'password123';
    document.getElementById('rememberMe').checked = true;
    
    // 获取提交按钮
    const submitBtn = document.getElementById('loginBtn');
    
    // 触发表单提交事件
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 验证fetch调用
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE_URL}/api/user/login`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123'
        })
      })
    );
    
    // 验证用户数据保存到localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    expect(userData).toEqual({
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      avatar: '/images/avatars/default.png',
      rememberMe: true
    });
    
    // 验证页面跳转
    expect(window.location.href).toBe('../index.html');
  });
  
  // 4. 测试登录失败 - API返回错误
  test('登录失败应显示错误信息', async () => {
    // 模拟fetch响应
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        success: false,
        message: '用户名或密码错误'
      })
    });
    
    // 导入login.js模块
    require('../../../frontend/js/login.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 填写表单
    document.getElementById('username').value = 'wronguser';
    document.getElementById('password').value = 'wrongpass';
    
    // 获取提交按钮和错误信息元素
    const submitBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    
    // 触发表单提交事件
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 验证错误信息显示
    expect(loginError.textContent).toBe('用户名或密码错误');
    expect(loginError.classList.contains('d-none')).toBe(false);
    
    // 验证按钮状态恢复
    expect(submitBtn.disabled).toBe(false);
    expect(submitBtn.textContent).toBe('登录');
  });
  
  // 5. 测试登录失败 - 网络错误
  test('网络错误应显示错误信息', async () => {
    // 模拟fetch抛出错误
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // 导入login.js模块
    require('../../../frontend/js/login.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 填写表单
    document.getElementById('username').value = 'testuser';
    document.getElementById('password').value = 'password123';
    
    // 获取提交按钮和错误信息元素
    const submitBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    
    // 模拟console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // 触发表单提交事件
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 验证错误信息显示
    expect(loginError.textContent).toBe('登录失败，请检查网络连接');
    expect(loginError.classList.contains('d-none')).toBe(false);
    
    // 验证控制台错误日志
    expect(console.error).toHaveBeenCalledWith('登录请求失败:', expect.any(Error));
    
    // 验证按钮状态恢复
    expect(submitBtn.disabled).toBe(false);
    expect(submitBtn.textContent).toBe('登录');
    
    // 恢复原始console.error
    console.error = originalConsoleError;
  });
  
  // 6. 测试密码可见性切换
  test('点击切换按钮应切换密码可见性', () => {
    // 导入login.js模块
    require('../../../frontend/js/login.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 获取密码输入框和切换按钮
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    
    // 验证初始状态
    expect(passwordInput.type).toBe('password');
    expect(togglePasswordBtn.innerHTML).toContain('bi-eye');
    
    // 点击切换按钮
    togglePasswordBtn.click();
    
    // 验证密码可见
    expect(passwordInput.type).toBe('text');
    expect(togglePasswordBtn.innerHTML).toContain('bi-eye-slash');
    
    // 再次点击切换按钮
    togglePasswordBtn.click();
    
    // 验证密码隐藏
    expect(passwordInput.type).toBe('password');
    expect(togglePasswordBtn.innerHTML).toContain('bi-eye');
  });
  
  // 7. 测试错误信息自动隐藏
  test('错误信息应在5秒后自动隐藏', async () => {
    // 模拟setTimeout
    jest.useFakeTimers();
    
    // 导入login.js模块
    require('../../../frontend/js/login.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 获取表单和错误信息元素
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    // 触发表单提交事件（不填写用户名和密码）
    loginForm.dispatchEvent(new Event('submit'));
    
    // 验证错误信息显示
    expect(loginError.textContent).toBe('用户名和密码不能为空');
    expect(loginError.classList.contains('d-none')).toBe(false);
    
    // 快进5秒
    jest.advanceTimersByTime(5000);
    
    // 验证错误信息隐藏
    expect(loginError.classList.contains('d-none')).toBe(true);
    
    // 恢复真实计时器
    jest.useRealTimers();
  });
  
  // 8. 测试表单元素不存在的情况
  test('应处理表单元素不存在的情况', () => {
    // 清空DOM
    document.body.innerHTML = '';
    
    // 导入login.js模块
    require('../../../frontend/js/login.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 验证没有抛出错误
    expect(() => {
      // 尝试获取表单元素
      const loginForm = document.getElementById('loginForm');
      const passwordInput = document.getElementById('password');
      const togglePasswordBtn = document.querySelector('.toggle-password');
      
      // 尝试触发事件
      if (loginForm) loginForm.dispatchEvent(new Event('submit'));
      if (togglePasswordBtn) togglePasswordBtn.click();
    }).not.toThrow();
  });
}); 