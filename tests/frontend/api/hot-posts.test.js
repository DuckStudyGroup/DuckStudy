import { contentAPI } from '../../../frontend/js/api.js';

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

describe('contentAPI.getHotPosts测试', () => {
  test('获取热门帖子并正确排序', async () => {
    // 模拟帖子数据，包含不同的浏览量、点赞数、收藏数和评论数
    const mockPosts = {
      posts: [
        {
          id: 1,
          title: '普通帖子',
          views: 100,
          likes: 10,
          favorites: 5,
          comments: [1, 2, 3] // 3条评论
        },
        {
          id: 2,
          title: '热门帖子',
          views: 200,
          likes: 50,
          favorites: 30,
          comments: [1, 2, 3, 4, 5] // 5条评论
        },
        {
          id: 3,
          title: '一般帖子',
          views: 150,
          likes: 20,
          favorites: 10,
          comments: [1, 2, 3, 4] // 4条评论
        },
        {
          id: 4,
          title: '低热度帖子',
          views: 50,
          likes: 5,
          favorites: 2,
          comments: [1] // 1条评论
        },
        {
          id: 5,
          title: '高浏览帖子',
          views: 300,
          likes: 5,
          favorites: 3,
          comments: [1, 2] // 2条评论
        },
        {
          id: 6,
          title: '高点赞帖子',
          views: 100,
          likes: 60,
          favorites: 5,
          comments: [1, 2, 3] // 3条评论
        }
      ]
    };
    
    // 模拟getPosts API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPosts
    });
    
    // 调用API
    const hotPosts = await contentAPI.getHotPosts();
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(hotPosts).toHaveLength(5); // 应该返回前5个热门帖子
    
    // 验证热门帖子排序 (热度 = 浏览量 + 点赞数*2 + 收藏数*3 + 评论数*1.5)
    // 帖子2: 200 + 50*2 + 30*3 + 5*1.5 = 200 + 100 + 90 + 7.5 = 397.5
    // 帖子6: 100 + 60*2 + 5*3 + 3*1.5 = 100 + 120 + 15 + 4.5 = 239.5
    // 帖子3: 150 + 20*2 + 10*3 + 4*1.5 = 150 + 40 + 30 + 6 = 226
    // 帖子5: 300 + 5*2 + 3*3 + 2*1.5 = 300 + 10 + 9 + 3 = 322
    // 帖子1: 100 + 10*2 + 5*3 + 3*1.5 = 100 + 20 + 15 + 4.5 = 139.5
    // 帖子4: 50 + 5*2 + 2*3 + 1*1.5 = 50 + 10 + 6 + 1.5 = 67.5
    
    expect(hotPosts[0].id).toBe(2); // 热门帖子应该排第一
    expect(hotPosts[1].id).toBe(5); // 高浏览帖子应该排第二
    expect(hotPosts[2].id).toBe(6); // 高点赞帖子应该排第三
    expect(hotPosts[3].id).toBe(3); // 一般帖子应该排第四
    expect(hotPosts[4].id).toBe(1); // 普通帖子应该排第五
  });
  
  test('处理没有评论字段的帖子', async () => {
    // 模拟帖子数据，部分帖子没有comments字段
    const mockPosts = {
      posts: [
        {
          id: 1,
          title: '无评论帖子',
          views: 100,
          likes: 10,
          favorites: 5
          // 没有comments字段
        },
        {
          id: 2,
          title: '有评论帖子',
          views: 100,
          likes: 10,
          favorites: 5,
          comments: [1, 2, 3] // 3条评论
        }
      ]
    };
    
    // 模拟getPosts API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPosts
    });
    
    // 调用API
    const hotPosts = await contentAPI.getHotPosts();
    
    // 断言 - 确保没有因为缺少comments字段而出错
    expect(hotPosts).toHaveLength(2);
    // 有评论的帖子应该排在前面
    expect(hotPosts[0].id).toBe(2);
    expect(hotPosts[1].id).toBe(1);
  });
  
  test('处理没有favorites字段的帖子', async () => {
    // 模拟帖子数据，部分帖子没有favorites字段
    const mockPosts = {
      posts: [
        {
          id: 1,
          title: '无收藏帖子',
          views: 100,
          likes: 10
          // 没有favorites字段
        },
        {
          id: 2,
          title: '有收藏帖子',
          views: 100,
          likes: 10,
          favorites: 5
        }
      ]
    };
    
    // 模拟getPosts API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPosts
    });
    
    // 调用API
    const hotPosts = await contentAPI.getHotPosts();
    
    // 断言 - 确保没有因为缺少favorites字段而出错
    expect(hotPosts).toHaveLength(2);
    // 有收藏的帖子应该排在前面
    expect(hotPosts[0].id).toBe(2);
    expect(hotPosts[1].id).toBe(1);
  });
  
  test('处理API错误', async () => {
    // 模拟API错误响应
    fetch.mockRejectedValueOnce(new Error('获取帖子列表失败'));
    
    // 调用API
    const hotPosts = await contentAPI.getHotPosts();
    
    // 断言 - 应返回空数组
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(hotPosts).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });
  
  test('处理空帖子列表', async () => {
    // 模拟空帖子列表
    const mockPosts = {
      posts: []
    };
    
    // 模拟getPosts API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPosts
    });
    
    // 调用API
    const hotPosts = await contentAPI.getHotPosts();
    
    // 断言 - 应返回空数组
    expect(hotPosts).toEqual([]);
  });
}); 