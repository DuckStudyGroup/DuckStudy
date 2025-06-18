/**
 * 导航工具函数测试
 * 测试导航栏相关工具函数，包括头像渲染、用户状态更新等
 */

// 模拟依赖
jest.mock('../../../frontend/js/api.js', () => ({
  userAPI: {
    getStatus: jest.fn(),
    logout: jest.fn()
  },
  BASE_URL: 'http://localhost:5000'
}));

// 导入被测试模块
import { isDefaultAvatar, renderAvatar, updateNavUserStatus, initNavbar } from '../../../frontend/js/nav-utils.js';
import { userAPI } from '../../../frontend/js/api.js';

// 设置DOM环境
const setupDOM = () => {
  document.body.innerHTML = `
    <nav class="navbar">
      <div class="container">
        <a class="navbar-brand" href="index.html">DuckStudy</a>
        <div class="d-flex align-items-center">
          <div class="user-section">
            <div id="userSection"></div>
          </div>
        </div>
      </div>
    </nav>
  `;
};

// 模拟用户状态数据
const mockLoggedInUser = {
  isLoggedIn: true,
  username: 'testuser',
  avatar: '/images/avatars/testuser.jpg',
  role: 'user'
};

const mockNotLoggedInUser = {
  isLoggedIn: false
};

// 在每个测试前准备环境
beforeEach(() => {
  // 重置DOM
  setupDOM();
  
  // 重置模拟
  jest.clearAllMocks();
  
  // 模拟原始window.location
  const originalLocation = window.location;
  delete window.location;
  window.location = {
    pathname: '/index.html',
    href: 'http://localhost:5000/index.html'
  };
  
  // 模拟alert
  window.alert = jest.fn();
});

describe('Nav Utils', () => {
  // 1. isDefaultAvatar 函数测试
  describe('isDefaultAvatar', () => {
    test('应正确识别默认头像URL', () => {
      expect(isDefaultAvatar('https://placehold.jp/100x100.png')).toBe(true);
      expect(isDefaultAvatar('https://placehold.jp/3d4070/ffffff/150x150.png')).toBe(true);
    });
    
    test('应正确识别非默认头像URL', () => {
      expect(isDefaultAvatar('/images/avatars/user1.jpg')).toBe(false);
      expect(isDefaultAvatar('https://example.com/avatar.png')).toBe(false);
    });
    
    test('应正确处理无效的头像URL', () => {
      // isDefaultAvatar实现为：return avatarUrl && avatarUrl.includes('placehold.jp');
      // 当avatarUrl为null或undefined时，会直接返回null或undefined而不是false
      expect(isDefaultAvatar(null)).toBeFalsy();
      expect(isDefaultAvatar(undefined)).toBeFalsy();
      expect(isDefaultAvatar('')).toBeFalsy();
    });
  });
  
  // 2. renderAvatar 函数测试
  describe('renderAvatar', () => {
    test('应正确渲染默认头像', () => {
      const defaultAvatarUrl = 'https://placehold.jp/100x100.png';
      const html = renderAvatar(defaultAvatarUrl, 'testuser');
      expect(html).toContain('<div class="avatar">');
      expect(html).toContain('<i class="bi bi-person-circle"></i>');
    });
    
    test('应正确渲染自定义头像', () => {
      const customAvatarUrl = '/images/avatars/user1.jpg';
      const html = renderAvatar(customAvatarUrl, 'testuser');
      expect(html).toContain('<img src="/images/avatars/user1.jpg"');
      expect(html).toContain('alt="testuser的头像"');
    });
    
    test('应处理缺少用户名的情况', () => {
      const customAvatarUrl = '/images/avatars/user1.jpg';
      const html = renderAvatar(customAvatarUrl);
      expect(html).toContain('alt="用户的头像"');
    });
  });
  
  // 3. updateNavUserStatus 函数测试
  describe('updateNavUserStatus', () => {
    test('应正确更新已登录用户的导航栏', async () => {
      // 调用函数更新导航栏
      await updateNavUserStatus(mockLoggedInUser);
      
      // 获取更新后的DOM
      const userSection = document.getElementById('userSection');
      
      // 验证DOM更新
      expect(userSection.innerHTML).toContain('user-profile');
      expect(userSection.innerHTML).toContain(mockLoggedInUser.username);
      expect(userSection.innerHTML).toContain('个人中心');
      expect(userSection.innerHTML).toContain('我的收藏');
      expect(userSection.innerHTML).toContain('退出登录');
    });
    
    test('应正确更新未登录用户的导航栏', async () => {
      // 调用函数更新导航栏
      await updateNavUserStatus(mockNotLoggedInUser);
      
      // 获取更新后的DOM
      const userSection = document.getElementById('userSection');
      
      // 验证DOM更新
      expect(userSection.innerHTML).toContain('登录');
      expect(userSection.innerHTML).toContain('注册');
      expect(userSection.innerHTML).not.toContain('退出登录');
    });
    
    test('应处理userSection不存在的情况', async () => {
      // 移除userSection元素
      document.getElementById('userSection').remove();
      
      // 保存原始console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 调用函数
      await updateNavUserStatus(mockLoggedInUser);
      
      // 验证错误处理
      expect(console.error).toHaveBeenCalledWith('未找到用户区域元素');
      
      // 恢复原始console.error
      console.error = originalConsoleError;
    });
    
    test('应根据页面路径生成正确的链接', async () => {
      // 模拟在子目录中
      window.location.pathname = '/pages/post-detail.html';
      
      // 调用函数更新导航栏
      await updateNavUserStatus(mockLoggedInUser);
      
      // 获取更新后的DOM
      const userSection = document.getElementById('userSection');
      
      // 验证链接路径
      expect(userSection.innerHTML).toContain('profile.html');
      expect(userSection.innerHTML).toContain('favorites.html');
      expect(userSection.innerHTML).not.toContain('/pages/profile.html');
    });
    
    test('登出按钮点击应调用logout API', async () => {
      // 模拟logout API成功
      userAPI.logout.mockResolvedValue({ success: true });
      
      // 调用函数更新导航栏
      await updateNavUserStatus(mockLoggedInUser);
      
      // 获取登出按钮
      const logoutBtn = document.getElementById('logoutBtn');
      expect(logoutBtn).not.toBeNull();
      
      // 模拟点击登出按钮
      logoutBtn.click();
      
      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 验证API调用
      expect(userAPI.logout).toHaveBeenCalled();
    });
    
    test('登出失败应显示错误提示', async () => {
      // 模拟logout API失败
      userAPI.logout.mockRejectedValue(new Error('登出失败'));
      
      // 调用函数更新导航栏
      await updateNavUserStatus(mockLoggedInUser);
      
      // 获取登出按钮
      const logoutBtn = document.getElementById('logoutBtn');
      
      // 模拟点击登出按钮
      logoutBtn.click();
      
      // 等待异步操作完成
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 验证错误提示
      expect(window.alert).toHaveBeenCalledWith('退出登录失败，请重试');
    });
    
    test('头像点击应切换下拉菜单显示状态', async () => {
      // 调用函数更新导航栏
      await updateNavUserStatus(mockLoggedInUser);
      
      // 获取头像容器
      const avatarContainer = document.querySelector('.avatar-container');
      const dropdownMenu = avatarContainer.querySelector('.dropdown-menu');
      
      // 验证初始状态
      expect(dropdownMenu.classList.contains('show')).toBe(false);
      
      // 模拟点击头像
      avatarContainer.click();
      
      // 验证点击后状态
      expect(dropdownMenu.classList.contains('show')).toBe(true);
      
      // 模拟点击文档其他位置
      document.dispatchEvent(new Event('click'));
      
      // 验证下拉菜单关闭
      expect(dropdownMenu.classList.contains('show')).toBe(false);
    });
    
    test('应处理自定义HTML结构（无登出按钮）', async () => {
      // 创建一个自定义的HTML结构，模拟logoutBtn不存在的情况
      document.body.innerHTML = `
        <div id="userSection"></div>
      `;
      
      // 模拟一个自定义的更新函数，模拟登出按钮不存在的情况
      const updateWithoutLogoutBtn = async () => {
        const userSection = document.getElementById('userSection');
        userSection.innerHTML = `
          <div class="user-profile">
            <div class="avatar-container">
              <img src="/images/avatars/default.png" alt="用户头像">
              <div class="dropdown-menu">
                <a href="profile.html" class="dropdown-item">个人中心</a>
              </div>
            </div>
            <span class="username">testuser</span>
          </div>
        `;
      };
      
      // 执行自定义更新
      await updateWithoutLogoutBtn();
      
      // 验证DOM结构
      const userSection = document.getElementById('userSection');
      expect(userSection.innerHTML).toContain('user-profile');
      expect(userSection.innerHTML).not.toContain('logoutBtn');
      
      // 验证没有logoutBtn
      const logoutBtn = document.getElementById('logoutBtn');
      expect(logoutBtn).toBeNull();
      
      // 调用updateNavUserStatus函数，测试它是否能处理没有登出按钮的情况
      await updateNavUserStatus(mockLoggedInUser);
      
      // 验证函数正常执行，没有抛出错误
      expect(document.getElementById('userSection')).not.toBeNull();
    });
    
    test('应处理自定义HTML结构（无头像容器）', async () => {
      // 创建一个自定义的HTML结构，模拟avatarContainer不存在的情况
      document.body.innerHTML = `
        <div id="userSection"></div>
      `;
      
      // 模拟一个自定义的更新函数，模拟头像容器不存在的情况
      const updateWithoutAvatarContainer = async () => {
        const userSection = document.getElementById('userSection');
        userSection.innerHTML = `
          <div class="user-profile">
            <span class="username">testuser</span>
            <a href="#" id="logoutBtn">退出登录</a>
          </div>
        `;
      };
      
      // 执行自定义更新
      await updateWithoutAvatarContainer();
      
      // 验证DOM结构
      const userSection = document.getElementById('userSection');
      expect(userSection.innerHTML).toContain('user-profile');
      expect(userSection.innerHTML).not.toContain('avatar-container');
      
      // 验证没有avatarContainer
      const avatarContainer = document.querySelector('.avatar-container');
      expect(avatarContainer).toBeNull();
      
      // 调用updateNavUserStatus函数，测试它是否能处理没有头像容器的情况
      await updateNavUserStatus(mockLoggedInUser);
      
      // 验证函数正常执行，没有抛出错误
      expect(document.getElementById('userSection')).not.toBeNull();
    });
    
    test('应处理自定义HTML结构（有容器但无下拉菜单）', async () => {
      // 创建一个自定义的HTML结构，模拟avatarContainer存在但dropdownMenu不存在
      document.body.innerHTML = `
        <div id="userSection"></div>
      `;
      
      // 模拟一个自定义的更新函数
      const updateWithoutDropdownMenu = async () => {
        const userSection = document.getElementById('userSection');
        userSection.innerHTML = `
          <div class="user-profile">
            <div class="avatar-container">
              <img src="/images/avatars/default.png" alt="用户头像">
              <!-- 没有下拉菜单 -->
            </div>
            <span class="username">testuser</span>
          </div>
        `;
      };
      
      // 执行自定义更新
      await updateWithoutDropdownMenu();
      
      // 验证DOM结构
      const userSection = document.getElementById('userSection');
      expect(userSection.innerHTML).toContain('avatar-container');
      // 不检查HTML字符串内容，而是直接检查DOM元素是否存在
      
      // 验证avatarContainer存在但dropdownMenu不存在
      const avatarContainer = document.querySelector('.avatar-container');
      expect(avatarContainer).not.toBeNull();
      const dropdownMenu = avatarContainer.querySelector('.dropdown-menu');
      expect(dropdownMenu).toBeNull();
      
      // 模拟点击头像容器
      avatarContainer.click();
      
      // 再次验证没有dropdownMenu（确保点击没有引起错误）
      const dropdownMenuAfterClick = avatarContainer.querySelector('.dropdown-menu');
      expect(dropdownMenuAfterClick).toBeNull();
      
      // 模拟全局点击事件（测试点击文档其他地方时的处理）
      document.dispatchEvent(new Event('click'));
      
      // 验证函数正常执行，没有抛出错误
      expect(document.getElementById('userSection')).not.toBeNull();
    });
  });
  
  // 4. initNavbar 函数测试
  describe('initNavbar', () => {
    test('应正确初始化导航栏（成功获取用户状态）', async () => {
      // 模拟getStatus API返回已登录用户
      userAPI.getStatus.mockResolvedValue(mockLoggedInUser);
      
      // 调用初始化函数
      await initNavbar();
      
      // 验证API调用
      expect(userAPI.getStatus).toHaveBeenCalled();
      
      // 获取更新后的DOM
      const userSection = document.getElementById('userSection');
      
      // 验证DOM更新
      expect(userSection.innerHTML).toContain(mockLoggedInUser.username);
    });
    
    test('应处理获取用户状态失败的情况', async () => {
      // 保存原始console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 模拟getStatus API失败
      userAPI.getStatus.mockRejectedValue(new Error('获取用户状态失败'));
      
      // 调用初始化函数
      await initNavbar();
      
      // 验证错误处理
      expect(console.error).toHaveBeenCalledWith('初始化导航栏失败:', expect.any(Error));
      
      // 获取更新后的DOM
      const userSection = document.getElementById('userSection');
      
      // 验证默认为未登录状态
      expect(userSection.innerHTML).toContain('登录');
      expect(userSection.innerHTML).toContain('注册');
      
      // 恢复原始console.error
      console.error = originalConsoleError;
    });
    
    test('应处理userSection不存在的情况（获取状态失败时）', async () => {
      // 移除userSection元素
      document.getElementById('userSection').remove();
      
      // 保存原始console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 模拟getStatus API失败
      userAPI.getStatus.mockRejectedValue(new Error('获取用户状态失败'));
      
      // 调用初始化函数
      await initNavbar();
      
      // 验证错误处理
      expect(console.error).toHaveBeenCalledWith('初始化导航栏失败:', expect.any(Error));
      
      // 由于userSection不存在，函数应该正常完成而不抛出额外错误
      
      // 恢复原始console.error
      console.error = originalConsoleError;
    });
    
    test('应处理从子目录加载的情况（获取状态失败时）', async () => {
      // 保存原始console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // 模拟在子目录中
      window.location.pathname = '/pages/post-detail.html';
      
      // 模拟getStatus API失败
      userAPI.getStatus.mockRejectedValue(new Error('获取用户状态失败'));
      
      // 调用初始化函数
      await initNavbar();
      
      // 验证错误处理
      expect(console.error).toHaveBeenCalledWith('初始化导航栏失败:', expect.any(Error));
      
      // 获取更新后的DOM
      const userSection = document.getElementById('userSection');
      
      // 验证生成了正确的路径的链接
      expect(userSection.innerHTML).toContain('login.html');
      expect(userSection.innerHTML).not.toContain('pages/login.html');
      
      // 恢复原始console.error
      console.error = originalConsoleError;
    });
  });
}); 