import { userAPI } from '../../../frontend/js/api.js';

// 模拟fetch响应
global.fetch = jest.fn();

// 在每个测试前重置模拟
beforeEach(() => {
  fetch.mockClear();
  localStorage.clear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// 在每个测试后恢复console.error
afterEach(() => {
  console.error.mockRestore();
});

describe('userAPI.updateUserInfo测试', () => {
  test('成功更新用户信息', async () => {
    // 设置初始用户数据
    const initialUserData = {
      username: 'testuser',
      avatar: 'https://placehold.jp/100x100.png',
      email: 'test@example.com'
    };
    localStorage.setItem('userData', JSON.stringify(initialUserData));
    
    // 准备更新数据
    const updateData = {
      email: 'updated@example.com',
      bio: '这是我的个人简介'
    };
    
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '用户信息更新成功',
        user: {
          username: 'testuser',
          avatar: '/images/avatars/user.jpg',
          email: 'updated@example.com',
          bio: '这是我的个人简介'
        }
      })
    });
    
    // 调用API
    const result = await userAPI.updateUserInfo(updateData);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      '/api/user/update',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(updateData)
      })
    );
    expect(result.success).toBe(true);
    
    // 验证本地存储是否更新
    const storedData = JSON.parse(localStorage.getItem('userData') || '{}');
    expect(storedData.email).toBe('updated@example.com');
    expect(storedData.bio).toBe('这是我的个人简介');
  });
  
  test('更新用户信息失败', async () => {
    // 设置初始用户数据
    const initialUserData = {
      username: 'testuser',
      avatar: 'https://placehold.jp/100x100.png',
      email: 'test@example.com'
    };
    localStorage.setItem('userData', JSON.stringify(initialUserData));
    
    // 准备更新数据
    const updateData = {
      email: 'invalid@example.com'
    };
    
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        message: '邮箱格式无效'
      })
    });
    
    // 调用API
    const result = await userAPI.updateUserInfo(updateData);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.message).toBe('邮箱格式无效');
    
    // 验证本地存储未更新
    const storedData = JSON.parse(localStorage.getItem('userData') || '{}');
    expect(storedData.email).toBe('test@example.com');
  });
  
  test('处理网络错误', async () => {
    // 设置初始用户数据
    localStorage.setItem('userData', JSON.stringify({
      username: 'testuser',
      avatar: 'https://placehold.jp/100x100.png'
    }));
    
    // 模拟网络错误
    fetch.mockRejectedValueOnce(new Error('网络连接失败'));
    
    // 调用API并捕获错误
    try {
      await userAPI.updateUserInfo({ bio: '测试简介' });
      fail('应该抛出错误');
    } catch (error) {
      expect(error.message).toBe('网络连接失败');
    }
    
    expect(console.error).toHaveBeenCalled();
  });
  
  test('处理相对路径头像', async () => {
    // 设置初始用户数据
    localStorage.setItem('userData', JSON.stringify({
      username: 'testuser',
      avatar: 'https://placehold.jp/100x100.png'
    }));
    
    // 模拟API响应，返回相对路径头像
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '用户信息更新成功',
        user: {
          username: 'testuser',
          avatar: '/images/avatars/profile.jpg'
        }
      })
    });
    
    // 调用API
    await userAPI.updateUserInfo({ avatar: '/images/avatars/profile.jpg' });
    
    // 验证本地存储中的头像URL是否正确处理
    const storedData = JSON.parse(localStorage.getItem('userData') || '{}');
    expect(storedData.avatar).toContain('/images/avatars/profile.jpg');
    expect(storedData.avatar.startsWith('http')).toBe(true);
  });
}); 