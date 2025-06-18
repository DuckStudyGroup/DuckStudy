import { contentAPI } from '../../../frontend/js/api.js';

// 模拟fetch响应
global.fetch = jest.fn();

// 在每个测试前重置模拟
beforeEach(() => {
  fetch.mockClear();
});

describe('课程评价API测试', () => {
  test('获取课程评价列表', async () => {
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          'title': 'Python编程入门',
          'rating': 4.5,
          'content': '课程内容非常系统，从基础语法到实际应用都有详细讲解...',
          'author': '张三',
          'date': '2024-03-15'
        },
        {
          'title': 'UI设计基础',
          'rating': 4.0,
          'content': '课程内容很实用，特别是设计原则和工具使用的部分...',
          'author': '李四',
          'date': '2024-03-10'
        }
      ])
    });
    
    // 调用API
    const reviews = await contentAPI.getReviews();
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/reviews'));
    expect(reviews).toHaveLength(2);
    expect(reviews[0].title).toBe('Python编程入门');
    expect(reviews[0].rating).toBe(4.5);
    expect(reviews[1].author).toBe('李四');
  });
  
  test('处理获取课程评价失败的情况', async () => {
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });
    
    // 断言API调用会抛出错误
    await expect(contentAPI.getReviews()).rejects.toThrow('获取课程评价失败');
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/reviews'));
  });
  
  test('处理网络错误', async () => {
    // 模拟网络错误
    fetch.mockRejectedValueOnce(new Error('Network Error'));
    
    // 断言API调用会抛出错误
    await expect(contentAPI.getReviews()).rejects.toThrow();
    
    expect(fetch).toHaveBeenCalledTimes(1);
  });
}); 