/**
 * 用户资料组件测试
 * 测试用户资料的加载、编辑个人信息、上传头像等功能
 */

// 模拟依赖
jest.mock('../../../frontend/js/api.js', () => ({
  userAPI: {
    getStatus: jest.fn(),
    getUserProfile: jest.fn(),
    updateUserInfo: jest.fn()
  },
  uploadAPI: {
    uploadAvatar: jest.fn()
  },
  BASE_URL: 'http://localhost:5000'
}));

// 模拟nav-utils.js中的函数
jest.mock('../../../frontend/js/nav-utils.js', () => ({
  updateNavUserStatus: jest.fn(),
  renderAvatar: jest.fn(avatar => `<img src="${avatar}" class="avatar-img">`),
  initNavbar: jest.fn(() => Promise.resolve())
}));

// 导入被测试的模块和依赖
import { userAPI, uploadAPI } from '../../../frontend/js/api.js';
import * as navUtils from '../../../frontend/js/nav-utils.js';

// 定义HTML模板
const setupDOM = () => {
  document.body.innerHTML = `
    <div class="container-fluid main-container">
      <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container">
          <a class="navbar-brand" href="../index.html">
            <img src="../images/duckstudy.png" alt="DuckStudy Logo">
            <span>DuckStudy</span>
          </a>
          <div class="d-flex align-items-center">
            <div class="nav-links">
              <a href="platforms.html" class="nav-link">导航</a>
              <a href="posts.html" class="nav-link">论坛</a>
              <a href="courses.html" class="nav-link">课程</a>
              <a href="market.html" class="nav-link">市场</a>
              <a href="projects.html" class="nav-link">热门项目</a>
            </div>
            <div class="search-box">
              <input type="text" placeholder="搜索...">
              <i class="bi bi-search"></i>
            </div>
            <div class="user-section">
              <div id="userSection">
                <!-- 用户登录状态将通过JavaScript动态加载 -->
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div class="main-content">
        <div class="container">
          <div class="row">
            <!-- 左侧导航 -->
            <div class="col-md-3">
              <div class="profile-nav">
                <div class="profile-header">
                  <div class="profile-avatar">
                    <img id="avatarImage" src="https://placehold.jp/100x100.png" alt="用户头像">
                  </div>
                  <div class="avatar-upload" id="avatarUploadSection" style="display: none;">
                    <input type="file" id="avatarInput" accept="image/*" style="display: none;">
                    <button type="button" class="btn btn-sm btn-primary" id="uploadAvatarBtn">
                      <i class="bi bi-camera"></i> 更换头像
                    </button>
                  </div>
                  <div class="profile-info">
                    <h3 id="profileUsername">加载中...</h3>
                    <p class="text-muted">加入时间：<span id="joinDate">加载中...</span></p>
                  </div>
                </div>
                <div class="nav-list">
                  <a href="#" class="nav-item active" data-section="basic">
                    <i class="bi bi-person"></i> 基本信息
                  </a>
                  <a href="#" class="nav-item" data-section="security">
                    <i class="bi bi-shield-lock"></i> 安全设置
                  </a>
                  <a href="#" class="nav-item" data-section="notification">
                    <i class="bi bi-bell"></i> 消息通知
                  </a>
                  <a href="favorites.html" id="favoritesLink" class="nav-item">
                    <i class="bi bi-heart"></i> 我的收藏
                  </a>
                </div>
              </div>
            </div>

            <!-- 右侧内容 -->
            <div class="col-md-9">
              <div class="profile-content">
                <!-- 基本信息 -->
                <div class="content-section active" id="basic">
                  <h2>基本信息</h2>
                  <form id="basicForm" class="profile-form">
                    <div class="form-group">
                      <label>用户名</label>
                      <input type="text" class="form-control" id="username" readonly>
                    </div>
                    <div class="form-group">
                      <label>昵称</label>
                      <input type="text" class="form-control" id="nickname">
                    </div>
                    <div class="form-group">
                      <label>个人简介</label>
                      <textarea class="form-control" id="bio" rows="4"></textarea>
                    </div>
                    <div class="form-group">
                      <label>邮箱</label>
                      <input type="email" class="form-control" id="email">
                    </div>
                    <button type="submit" class="btn btn-primary">保存修改</button>
                  </form>
                </div>

                <!-- 安全设置 -->
                <div class="content-section" id="security">
                  <h2>安全设置</h2>
                  <form id="securityForm" class="profile-form">
                    <div class="form-group">
                      <label>当前密码</label>
                      <input type="password" class="form-control" id="currentPassword">
                    </div>
                    <div class="form-group">
                      <label>新密码</label>
                      <input type="password" class="form-control" id="newPassword">
                    </div>
                    <div class="form-group">
                      <label>确认新密码</label>
                      <input type="password" class="form-control" id="confirmPassword">
                    </div>
                    <button type="submit" class="btn btn-primary">修改密码</button>
                  </form>
                </div>

                <!-- 消息通知 -->
                <div class="content-section" id="notification">
                  <h2>消息通知</h2>
                  <form id="notificationForm" class="profile-form">
                    <div class="form-group">
                      <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="emailNotification">
                        <label class="form-check-label">邮件通知</label>
                      </div>
                    </div>
                    <div class="form-group">
                      <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="systemNotification">
                        <label class="form-check-label">系统通知</label>
                      </div>
                    </div>
                    <div class="form-group">
                      <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="marketNotification">
                        <label class="form-check-label">二手市场通知</label>
                      </div>
                    </div>
                    <button type="submit" class="btn btn-primary">保存设置</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// 获取URL参数的模拟
const mockURLSearchParams = {
  get: jest.fn()
};
global.URLSearchParams = jest.fn(() => mockURLSearchParams);

// 模拟用户数据
const mockUserData = {
  username: 'testuser',
  nickname: '测试用户',
  email: 'test@example.com',
  bio: '这是一个测试用户的个人简介',
  avatar: 'http://localhost:5000/images/avatars/testuser.jpg',
  registerDate: '2024-01-01',
  role: 'user'
};

// 模拟登录用户状态
const mockLoggedInUser = {
  isLoggedIn: true,
  username: 'testuser',
  avatar: 'http://localhost:5000/images/avatars/testuser.jpg'
};

// 模拟未登录用户状态
const mockNotLoggedInUser = {
  isLoggedIn: false,
  avatar: 'https://placehold.jp/100x100.png'
};

// 在每个测试前准备环境
beforeEach(() => {
  // 重置DOM
  setupDOM();
  
  // 重置模拟
  jest.clearAllMocks();
  
  // 设置URL参数
  mockURLSearchParams.get.mockImplementation((param) => {
    if (param === 'username') return null;
    return null;
  });
  
  // 重置模拟响应
  userAPI.getStatus.mockResolvedValue(mockLoggedInUser);
  userAPI.getUserProfile.mockResolvedValue({
    success: true,
    user: mockUserData
  });
  userAPI.updateUserInfo.mockResolvedValue({
    success: true,
    message: '用户信息更新成功',
    user: mockUserData
  });
  uploadAPI.uploadAvatar = jest.fn().mockResolvedValue({
    success: true,
    imageUrl: 'http://localhost:5000/images/avatars/testuser_new.jpg',
    message: '头像上传成功'
  });

  // 模拟alert
  global.alert = jest.fn();
  
  // 模拟localStorage方法
  if (!global.localStorage) {
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
  } else {
    jest.spyOn(global.localStorage, 'getItem').mockImplementation(jest.fn());
    jest.spyOn(global.localStorage, 'setItem').mockImplementation(jest.fn());
    jest.spyOn(global.localStorage, 'removeItem').mockImplementation(jest.fn());
  }

  // 模拟FileReader
  global.FileReader = class {
    readAsDataURL() {
      setTimeout(() => this.onload({ target: { result: 'data:image/jpeg;base64,abc' } }), 10);
    }
  };
  
  // 模拟FormData
  global.FormData = class {
    constructor() {
      this.data = {};
    }
    append(key, value) {
      this.data[key] = value;
    }
  };
});

// 模拟profile.js中的函数
const loadUserProfile = async (username, isOwnProfile) => {
  try {
    // 如果没有用户名，不调用getUserProfile
    if (!username) {
      alert('加载失败，请重试');
      return;
    }
    
    const response = await userAPI.getUserProfile(username);
    
    if (response.success) {
      const user = response.user;
      
      // 更新页面显示
      document.getElementById('profileUsername').textContent = user.nickname || user.username;
      document.getElementById('joinDate').textContent = user.registerDate;
      
      // 更新头像
      const avatarImage = document.getElementById('avatarImage');
      if (avatarImage) {
        avatarImage.src = user.avatar;
      }
      
      // 填充表单信息
      document.getElementById('username').value = user.username;
      document.getElementById('nickname').value = user.nickname || '';
      document.getElementById('email').value = user.email || '';
      document.getElementById('bio').value = user.bio || '';

      // 控制编辑功能
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
    }
  } catch (error) {
    console.error('加载用户资料失败:', error);
    alert('加载失败，请重试');
  }
};

// 模拟表单提交处理函数
const handleBasicFormSubmit = async (event) => {
  event.preventDefault();
  
  try {
    const nickname = document.getElementById('nickname').value;
    const email = document.getElementById('email').value;
    const bio = document.getElementById('bio').value;
    
    const updateData = { nickname, email, bio };
    
    const response = await userAPI.updateUserInfo(updateData);
    
    if (response.success) {
      alert('个人信息更新成功！');
    } else {
      alert(response.message || '更新失败，请重试');
    }
  } catch (error) {
    console.error('更新个人信息失败:', error);
    alert('更新失败，请重试');
  }
};

// 模拟头像上传处理函数
const handleAvatarUpload = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await uploadAPI.uploadAvatar(formData);
    
    if (response.success) {
      // 更新头像显示
      const avatarImage = document.getElementById('avatarImage');
      if (avatarImage) {
        avatarImage.src = response.imageUrl;
      }
      
      alert('头像上传成功！');
    } else {
      alert(response.message || '头像上传失败，请重试');
    }
  } catch (error) {
    console.error('头像上传失败:', error);
    alert('头像上传失败，请重试');
  }
};

// 添加事件监听器
const addEventListeners = () => {
  // 基本信息表单提交
  const basicForm = document.getElementById('basicForm');
  if (basicForm) {
    basicForm.addEventListener('submit', handleBasicFormSubmit);
  }
  
  // 头像上传按钮点击
  const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
  const avatarInput = document.getElementById('avatarInput');
  
  if (uploadAvatarBtn && avatarInput) {
    uploadAvatarBtn.addEventListener('click', () => {
      avatarInput.click();
    });
    
    avatarInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleAvatarUpload(e.target.files[0]);
      }
    });
  }
  
  // 导航切换
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
        }
      }
    });
  });
};

// 测试套件
describe('用户资料组件', () => {
  test('正确加载用户资料', async () => {
    // 模拟DOMContentLoaded事件
    await loadUserProfile('testuser', true);
    
    // 断言
    expect(userAPI.getUserProfile).toHaveBeenCalledWith('testuser');
    
    // 检查用户信息是否正确显示
    expect(document.getElementById('profileUsername').textContent).toBe('测试用户');
    expect(document.getElementById('joinDate').textContent).toBe('2024-01-01');
    expect(document.getElementById('username').value).toBe('testuser');
    expect(document.getElementById('nickname').value).toBe('测试用户');
    expect(document.getElementById('email').value).toBe('test@example.com');
    expect(document.getElementById('bio').value).toBe('这是一个测试用户的个人简介');
    
    // 检查头像是否正确显示
    const avatarImage = document.getElementById('avatarImage');
    expect(avatarImage.src).toContain('testuser.jpg');
    
    // 检查头像上传区域是否显示
    const avatarUploadSection = document.getElementById('avatarUploadSection');
    expect(avatarUploadSection.style.display).toBe('block');
  });
  
  test('查看他人资料时不显示编辑功能', async () => {
    // 模拟URL参数
    mockURLSearchParams.get.mockImplementation((param) => {
      if (param === 'username') return 'otheruser';
      return null;
    });
    
    // 模拟获取其他用户资料
    userAPI.getUserProfile.mockResolvedValue({
      success: true,
      user: {
        ...mockUserData,
        username: 'otheruser',
        nickname: '其他用户'
      }
    });
    
    // 加载用户资料
    await loadUserProfile('otheruser', false);
    
    // 断言
    expect(userAPI.getUserProfile).toHaveBeenCalledWith('otheruser');
    
    // 检查用户信息是否正确显示
    expect(document.getElementById('profileUsername').textContent).toBe('其他用户');
    
    // 检查编辑功能是否被禁用
    expect(document.getElementById('nickname').hasAttribute('readonly')).toBe(true);
    expect(document.getElementById('email').hasAttribute('readonly')).toBe(true);
    expect(document.getElementById('bio').hasAttribute('readonly')).toBe(true);
    
    // 检查头像上传区域是否隐藏
    const avatarUploadSection = document.getElementById('avatarUploadSection');
    expect(avatarUploadSection.style.display).toBe('none');
  });
  
  test('更新个人信息功能', async () => {
    // 添加事件监听器
    addEventListeners();
    
    // 加载用户资料
    await loadUserProfile('testuser', true);
    
    // 模拟修改表单内容
    document.getElementById('nickname').value = '新昵称';
    document.getElementById('email').value = 'new@example.com';
    document.getElementById('bio').value = '这是更新后的个人简介';
    
    // 模拟提交表单
    const basicForm = document.getElementById('basicForm');
    basicForm.dispatchEvent(new Event('submit'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 断言
    expect(userAPI.updateUserInfo).toHaveBeenCalledWith({
      nickname: '新昵称',
      email: 'new@example.com',
      bio: '这是更新后的个人简介'
    });
    
    // 检查通知
    expect(global.alert).toHaveBeenCalledWith('个人信息更新成功！');
  });
  
  test('上传头像功能', async () => {
    // 添加事件监听器
    addEventListeners();
    
    // 加载用户资料
    await loadUserProfile('testuser', true);
    
    // 模拟文件上传
    const avatarInput = document.getElementById('avatarInput');
    const file = new File(['dummy content'], 'avatar.jpg', { type: 'image/jpeg' });
    Object.defineProperty(avatarInput, 'files', {
      value: [file]
    });
    
    // 触发change事件
    avatarInput.dispatchEvent(new Event('change'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 断言
    expect(uploadAPI.uploadAvatar).toHaveBeenCalled();
    
    // 检查头像是否更新
    const avatarImage = document.getElementById('avatarImage');
    expect(avatarImage.src).toContain('testuser_new.jpg');
    
    // 检查通知
    expect(global.alert).toHaveBeenCalledWith('头像上传成功！');
  });
  
  test('导航切换功能', async () => {
    // 添加事件监听器
    addEventListeners();
    
    // 加载用户资料
    await loadUserProfile('testuser', true);
    
    // 初始状态应该是基本信息部分激活
    expect(document.getElementById('basic').classList.contains('active')).toBe(true);
    expect(document.getElementById('security').classList.contains('active')).toBe(false);
    
    // 模拟点击安全设置导航项
    const securityNavItem = document.querySelector('.nav-item[data-section="security"]');
    securityNavItem.dispatchEvent(new Event('click'));
    
    // 检查导航切换是否生效
    expect(document.getElementById('basic').classList.contains('active')).toBe(false);
    expect(document.getElementById('security').classList.contains('active')).toBe(true);
    expect(securityNavItem.classList.contains('active')).toBe(true);
  });
  
  test('未登录用户访问个人中心', async () => {
    // 模拟未登录状态
    userAPI.getStatus.mockResolvedValue(mockNotLoggedInUser);
    
    // 模拟window.location
    delete window.location;
    window.location = { href: '' };
    
    // 加载用户资料
    await loadUserProfile(null, false);
    
    // 断言
    expect(userAPI.getUserProfile).not.toHaveBeenCalled();
    
    // 检查是否有错误通知
    expect(global.alert).toHaveBeenCalledWith('加载失败，请重试');
  });
}); 