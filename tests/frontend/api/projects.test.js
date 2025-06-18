import { contentAPI } from '../../../frontend/js/api.js';

// 模拟fetch响应
global.fetch = jest.fn();

// 在每个测试前重置模拟
beforeEach(() => {
  fetch.mockClear();
});

describe('项目相关API测试', () => {
  test('获取热门项目列表', async () => {
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          'title': '在线学习平台',
          'description': '基于Vue.js和Django的在线学习平台',
          'stars': 128,
          'forks': 45
        },
        {
          'title': '个人博客系统',
          'description': '使用React和Node.js开发的个人博客系统',
          'stars': 96,
          'forks': 32
        }
      ])
    });
    
    // 调用API
    const projects = await contentAPI.getHotProjects();
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/projects/hot'));
    expect(projects).toHaveLength(2);
    expect(projects[0].title).toBe('在线学习平台');
    expect(projects[0].stars).toBe(128);
    expect(projects[1].description).toContain('React和Node.js');
  });
  
  test('处理获取热门项目失败的情况', async () => {
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });
    
    // 断言API调用会抛出错误
    await expect(contentAPI.getHotProjects()).rejects.toThrow('获取热门项目失败');
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/projects/hot'));
  });
  
  test('处理网络错误', async () => {
    // 模拟网络错误
    fetch.mockRejectedValueOnce(new Error('Network Error'));
    
    // 断言API调用会抛出错误
    await expect(contentAPI.getHotProjects()).rejects.toThrow();
    
    expect(fetch).toHaveBeenCalledTimes(1);
  });
}); 