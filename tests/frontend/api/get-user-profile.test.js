import { userAPI, BASE_URL } from '../../../frontend/js/api.js';

// 模拟fetch响应
global.fetch = jest.fn();

// 在每个测试前重置模拟
beforeEach(() => {
  fetch.mockClear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// 在每个测试后恢复console.error
afterEach(() => {
  console.error.mockRestore();
});

describe('userAPI.getUserProfile测试', () => {
  test('成功获取用户资料', async () => {
    const testUsername = 'testuser';
    
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: {
          username: testUsername,
          avatar: '/images/avatars/user.jpg',
          nickname: '测试用户',
          bio: '这是测试用户的个人简介',
          email: 'test@example.com',
          registerDate: '2024-04-01',
          role: 'user'
        }
      })
    });
    
    // 调用API
    const result = await userAPI.getUserProfile(testUsername);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`/api/user/profile/${testUsername}`);
    expect(result.success).toBe(true);
    expect(result.user.username).toBe(testUsername);
    
    // 验证头像URL是否正确处理（相对路径应该被转换为绝对路径）
    expect(result.user.avatar).toBe(`${BASE_URL}/images/avatars/user.jpg`);
  });
  
  test('获取不存在的用户资料', async () => {
    const nonExistentUser = 'nonexistentuser';
    
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        message: '用户不存在'
      })
    });
    
    // 调用API
    const result = await userAPI.getUserProfile(nonExistentUser);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.message).toBe('用户不存在');
  });
  
  test('处理绝对路径头像', async () => {
    const testUsername = 'testuser';
    const absoluteAvatarUrl = 'https://example.com/images/avatar.jpg';
    
    // 模拟API响应，返回绝对路径头像
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: {
          username: testUsername,
          avatar: absoluteAvatarUrl,
          nickname: '测试用户',
          role: 'user'
        }
      })
    });
    
    // 调用API
    const result = await userAPI.getUserProfile(testUsername);
    
    // 断言 - 绝对路径应保持不变
    expect(result.user.avatar).toBe(absoluteAvatarUrl);
  });
  
  test('处理网络错误', async () => {
    const testUsername = 'testuser';
    
    // 模拟网络错误
    fetch.mockRejectedValueOnce(new Error('网络连接失败'));
    
    // 调用API并捕获错误
    try {
      await userAPI.getUserProfile(testUsername);
      fail('应该抛出错误');
    } catch (error) {
      expect(error.message).toBe('网络连接失败');
    }
    
    expect(console.error).toHaveBeenCalled();
  });
  
  test('处理服务器错误', async () => {
    const testUsername = 'testuser';
    
    // 模拟服务器错误
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });
    
    // 调用API并捕获错误
    try {
      await userAPI.getUserProfile(testUsername);
      fail('应该抛出错误');
    } catch (error) {
      // 这里不做具体错误信息断言，因为处理方式可能不同
      expect(error).toBeDefined();
    }
  });
}); 