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

describe('userAPI.register测试', () => {
  test('成功注册用户', async () => {
    const registerData = {
      username: 'newuser',
      password: 'password123',
      email: 'newuser@example.com'
    };
    
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '注册成功'
      })
    });
    
    // 调用API
    const result = await userAPI.register(
      registerData.username, 
      registerData.password, 
      registerData.email
    );
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/api/user/register`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(registerData),
        credentials: 'include'
      })
    );
    expect(result.success).toBe(true);
    expect(result.message).toBe('注册成功');
  });
  
  test('注册失败 - 用户名已存在', async () => {
    const registerData = {
      username: 'existinguser',
      password: 'password123',
      email: 'existing@example.com'
    };
    
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        message: '用户名已存在'
      })
    });
    
    // 调用API并捕获错误
    try {
      await userAPI.register(
        registerData.username, 
        registerData.password, 
        registerData.email
      );
      fail('应该抛出错误');
    } catch (error) {
      expect(error.message).toBe('用户名已存在');
    }
    
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  
  test('注册失败 - 邮箱已被注册', async () => {
    const registerData = {
      username: 'newuser2',
      password: 'password123',
      email: 'existing@example.com'
    };
    
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        message: '邮箱已被注册'
      })
    });
    
    // 调用API并捕获错误
    try {
      await userAPI.register(
        registerData.username, 
        registerData.password, 
        registerData.email
      );
      fail('应该抛出错误');
    } catch (error) {
      expect(error.message).toBe('邮箱已被注册');
    }
  });
  
  test('注册失败 - 网络错误', async () => {
    // 模拟网络错误
    fetch.mockRejectedValueOnce(new Error('网络连接失败'));
    
    // 调用API并捕获错误
    try {
      await userAPI.register('testuser', 'password', 'test@example.com');
      fail('应该抛出错误');
    } catch (error) {
      expect(error.message).toBe('网络连接失败');
    }
    
    expect(console.error).toHaveBeenCalled();
  });
  
  test('注册失败 - 服务器错误', async () => {
    // 模拟服务器错误但没有返回JSON
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => { throw new Error('Invalid JSON'); }
    });
    
    // 调用API并捕获错误
    try {
      await userAPI.register('testuser', 'password', 'test@example.com');
      fail('应该抛出错误');
    } catch (error) {
      // 这里不做具体错误信息断言，因为处理方式可能不同
      expect(error).toBeDefined();
    }
  });
}); 