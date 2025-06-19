import { userAPI } from '../../../frontend/js/api.js';

// 模拟fetch响应
global.fetch = jest.fn();

// 在每个测试前重置模拟
beforeEach(() => {
  fetch.mockClear();
  // 清除可能的localStorage模拟状态
  localStorage.clear();
});

describe('用户认证API测试', () => {
  test('获取用户状态 - 已登录', async () => {
    // 模拟API响应 - 已登录状态，匹配实际结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isLoggedIn: true,
        username: 'testuser',
        avatar: '/images/avatars/default.png',
        role: 'user'
      })
    });
    
    // 调用API
    const status = await userAPI.getStatus();
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/user/status'));
    expect(status.isLoggedIn).toBe(true);
    expect(status.username).toBe('testuser');
  });
  
  test('获取用户状态 - 未登录', async () => {
    // 模拟API响应 - 未登录状态，匹配实际结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isLoggedIn: false,
        avatar: 'https://placehold.jp/100x100.png'
      })
    });
    
    // 调用API
    const status = await userAPI.getStatus();
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(status.isLoggedIn).toBe(false);
    expect(status).not.toHaveProperty('username');
  });
  
  test('用户登录成功', async () => {
    const username = 'testuser';
    const password = 'password123';
    
    // 模拟API响应 - 登录成功，匹配实际结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '登录成功',
        user: {
          username: username,
          avatar: '/images/avatars/default.png',
          role: 'user'
        }
      })
    });
    
    // 调用API
    const result = await userAPI.login(username, password);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/login'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining(username)
      })
    );
    expect(result.success).toBe(true);
    expect(result.user.username).toBe(username);
  });
  
  test('用户登录失败 - 错误的凭据', async () => {
    const username = 'wronguser';
    const password = 'wrongpass';
    
    // 模拟API响应 - 登录失败，匹配实际结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        message: '用户名或密码错误'
      })
    });
    
    // 调用API
    const result = await userAPI.login(username, password);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.message).toBe('用户名或密码错误');
  });
  
  test('用户注册成功', async () => {
    const userData = {
      username: 'newuser',
      password: 'password123',
      email: 'newuser@example.com'
    };
    
    // 模拟API响应 - 注册成功，匹配实际结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '注册成功'
      })
    });
    
    // 调用API
    const result = await userAPI.register(userData.username, userData.password, userData.email);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/register'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining(userData.username)
      })
    );
    expect(result.success).toBe(true);
  });
  
  test('用户注册失败 - 用户名已存在', async () => {
    const userData = {
      username: 'existinguser',
      password: 'password123',
      email: 'existing@example.com'
    };
    
    // 模拟API响应 - 注册失败，匹配实际结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        message: '用户名已存在'
      })
    });
    
    // 调用API
    const result = await userAPI.register(userData.username, userData.password, userData.email);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.message).toBe('用户名已存在');
  });
  
  test('用户登出', async () => {
    // 模拟API响应 - 登出成功，匹配实际结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '退出成功'
      })
    });
    
    // 调用API
    const result = await userAPI.logout();
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/logout'),
      expect.objectContaining({
        method: 'POST'
      })
    );
    expect(result.success).toBe(true);
  });
  
  test('获取用户资料', async () => {
    const testUsername = 'testuser';
    
    // 模拟API响应 - 匹配实际结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: {
          username: testUsername,
          avatar: '/images/avatars/default.png',
          nickname: 'Test User',
          bio: '这是一个测试用户',
          email: 'test@example.com',
          registerDate: '2024-01-01', // 注意：在实际数据中可能是registerDate或registrationDate
          role: 'user'
        }
      })
    });
    
    // 调用API
    const result = await userAPI.getUserProfile(testUsername);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/user/profile/${testUsername}`));
    expect(result.success).toBe(true);
    expect(result.user.username).toBe(testUsername);
    expect(result.user).toHaveProperty('bio');
    expect(result.user).toHaveProperty('email');
  });
  
  test('更新用户信息', async () => {
    const updateData = {
      nickname: '新昵称',
      bio: '更新的个人简介',
      avatar: '/images/avatars/custom.png'
    };
    
    // 模拟API响应 - 匹配实际结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '用户信息更新成功',
        user: {
          username: 'testuser',
          ...updateData,
          email: 'test@example.com'
        }
      })
    });
    
    // 调用API
    const result = await userAPI.updateUserInfo(updateData);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/user/update'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('新昵称')
      })
    );
    expect(result.success).toBe(true);
    expect(result.user.nickname).toBe(updateData.nickname);
    expect(result.user.bio).toBe(updateData.bio);
  });
  
  test('处理网络错误', async () => {
    // 模拟网络错误
    fetch.mockRejectedValueOnce(new Error('Network Error'));
    console.error = jest.fn(); // 模拟console.error以避免测试输出中的错误消息
    
    // 调用API
    const result = await userAPI.getStatus();
    
    // 断言API返回默认状态对象
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ isLoggedIn: false, avatar: 'https://placehold.jp/100x100.png' });
    expect(console.error).toHaveBeenCalled();
  });
}); 