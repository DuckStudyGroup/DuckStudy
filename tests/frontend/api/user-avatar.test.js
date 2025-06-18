import { userAPI, BASE_URL } from '../../../frontend/js/api.js';

describe('userAPI.getUserAvatar测试', () => {
  // 在每个测试前清除localStorage
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  // 在每个测试后恢复console.error
  afterEach(() => {
    console.error.mockRestore();
  });

  test('当localStorage中有用户数据且头像是绝对URL时应直接返回', () => {
    // 模拟localStorage中有用户数据
    const userData = {
      username: 'testuser',
      avatar: 'https://example.com/avatar.jpg',
      role: 'user'
    };
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // 调用函数
    const avatar = userAPI.getUserAvatar();
    
    // 断言
    expect(avatar).toBe('https://example.com/avatar.jpg');
  });

  test('当localStorage中有用户数据且头像是相对路径时应添加BASE_URL', () => {
    // 模拟localStorage中有用户数据
    const userData = {
      username: 'testuser',
      avatar: '/images/avatars/user.jpg',
      role: 'user'
    };
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // 调用函数
    const avatar = userAPI.getUserAvatar();
    
    // 断言
    expect(avatar).toBe(`${BASE_URL}/images/avatars/user.jpg`);
  });

  test('当localStorage中没有用户数据时应返回默认头像', () => {
    // 调用函数
    const avatar = userAPI.getUserAvatar();
    
    // 断言
    expect(avatar).toBe('https://placehold.jp/100x100.png');
  });

  test('当localStorage中的userData不是有效JSON时应返回默认头像', () => {
    // 模拟localStorage中有无效的用户数据
    localStorage.setItem('userData', 'invalid-json');
    
    // 调用函数
    const avatar = userAPI.getUserAvatar();
    
    // 断言
    expect(avatar).toBe('https://placehold.jp/100x100.png');
    expect(console.error).toHaveBeenCalled();
  });

  test('当localStorage中的userData没有avatar字段时应返回默认头像', () => {
    // 模拟localStorage中有用户数据但没有avatar字段
    const userData = {
      username: 'testuser',
      role: 'user'
    };
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // 调用函数
    const avatar = userAPI.getUserAvatar();
    
    // 断言
    expect(avatar).toBe('https://placehold.jp/100x100.png');
  });
}); 