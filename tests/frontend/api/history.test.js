import { contentAPI } from '../../../frontend/js/api.js';

// 模拟fetch响应
global.fetch = jest.fn();

// 在每个测试前重置模拟
beforeEach(() => {
  fetch.mockClear();
});

describe('历史记录API测试', () => {
  test('获取最近浏览记录', async () => {
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          'title': 'Python基础教程',
          'date': '2024-03-15',
          'image': 'https://placehold.jp/150x150.png'
        },
        {
          'title': 'Web开发入门',
          'date': '2024-03-14',
          'image': 'https://placehold.jp/150x150.png'
        }
      ])
    });
    
    // 调用API
    const recentViews = await contentAPI.getRecentViews();
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/history'));
    expect(recentViews).toHaveLength(2);
    expect(recentViews[0].title).toBe('Python基础教程');
    expect(recentViews[1].date).toBe('2024-03-14');
  });
  
  test('处理获取最近浏览记录失败的情况', async () => {
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });
    
    // 断言API调用会抛出错误
    await expect(contentAPI.getRecentViews()).rejects.toThrow('获取最近观看失败');
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/history'));
  });
  
  test('处理网络错误', async () => {
    // 模拟网络错误
    fetch.mockRejectedValueOnce(new Error('Network Error'));
    
    // 断言API调用会抛出错误
    await expect(contentAPI.getRecentViews()).rejects.toThrow();
    
    expect(fetch).toHaveBeenCalledTimes(1);
  });
}); 