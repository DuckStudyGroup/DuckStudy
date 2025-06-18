import { contentAPI } from '../../../frontend/js/api.js';

// 模拟fetch响应
global.fetch = jest.fn();

// 在每个测试前重置模拟
beforeEach(() => {
  fetch.mockClear();
});

describe('帖子相关API测试', () => {
  test('获取帖子列表', async () => {
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        posts: [
          { 
            id: 1744789431836, 
            title: '计算机专业学习路线分享', 
            content: '作为一名在IT行业工作了5年的程序员，我想和大家分享一下我的学习经验和路线规划...',
            author: '王五',
            authorAvatar: 'https://placehold.jp/100x100.png',
            date: '2024/04/10',
            category: 'study',
            tags: ['计算机科学', '学习路线', '编程'],
            views: 358,
            likes: 157,
            favorites: 73,
            likedBy: [],
            favoritedBy: []
          },
          { 
            id: 1744791431962, 
            title: '大学生如何高效复习期末考试', 
            content: '作为一个即将毕业的大四学生，我经历了无数次期末考试的洗礼，今天就来分享一下我的高效复习方法...',
            author: '张三',
            authorAvatar: '/images/avatars/1747826293_cool.png',
            date: '2024/04/05',
            category: 'experience',
            tags: ['学习方法', '时间管理', '考试技巧'],
            views: 434,
            likes: 187,
            favorites: 90,
            likedBy: [],
            favoritedBy: ['李四']
          }
        ]
      })
    });
    
    // 调用API
    const result = await contentAPI.getPosts();
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/posts'));
    expect(result.posts).toHaveLength(2);
    expect(result.posts[0].id).toBe(1744789431836);
    expect(result.posts[0].author).toBe('王五');
    expect(result.posts[0].tags).toContain('计算机科学');
  });
  
  test('获取帖子详情', async () => {
    const testPostId = 1744789431836;
    
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: testPostId,
        title: '计算机专业学习路线分享',
        content: '作为一名在IT行业工作了5年的程序员，我想和大家分享一下我的学习经验和路线规划...',
        author: '王五',
        authorAvatar: 'https://placehold.jp/100x100.png',
        date: '2024/04/10',
        category: 'study',
        tags: ['计算机科学', '学习路线', '编程'],
        views: 358,
        likes: 157,
        favorites: 73,
        likedBy: [],
        favoritedBy: []
      })
    });
    
    // 调用API
    const result = await contentAPI.getPost(testPostId);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/posts/${testPostId}`));
    expect(result.id).toBe(testPostId);
    expect(result.title).toBe('计算机专业学习路线分享');
    expect(result.tags).toHaveLength(3);
  });
  
  test('创建帖子', async () => {
    const newPost = {
      title: '测试新帖子',
      content: '<p>这是一个测试内容</p>',
      author: '测试用户',
      date: '2025/05/20 14:30',
      category: 'help',
      tags: ['测试', '帮助'],
      coverImages: ['/images/posts/test.jpg']
    };
    
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '帖子创建成功',
        post: { 
          ...newPost, 
          id: 1747999999999,
          views: 0,
          likes: 0,
          favorites: 0,
          likedBy: [],
          favoritedBy: []
        }
      })
    });
    
    // 调用API
    const result = await contentAPI.createPost(newPost);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/posts'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String)
      })
    );
    expect(result.success).toBe(true);
    expect(result.post.id).toBe(1747999999999);
    expect(result.post.title).toBe(newPost.title);
    expect(result.post.tags).toEqual(newPost.tags);
  });
  
  test('更新帖子', async () => {
    const postId = 1744789431836;
    const updateData = {
      title: '更新后的计算机专业学习路线分享',
      content: '<p>更新后的内容：作为一名在IT行业工作了5年的程序员，我想和大家分享一下我的学习经验和路线规划...</p>',
      tags: ['计算机科学', '学习路线', '编程', '教程']
    };
    
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '帖子更新成功',
        post: { 
          id: postId,
          title: updateData.title,
          content: updateData.content,
          tags: updateData.tags,
          author: '王五',
          authorAvatar: 'https://placehold.jp/100x100.png',
          date: '2024/04/10',
          category: 'study',
          views: 358,
          likes: 157,
          favorites: 73,
          likedBy: [],
          favoritedBy: []
        }
      })
    });
    
    // 调用API
    const result = await contentAPI.updatePost(postId, updateData);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/posts/${postId}`),
      expect.objectContaining({
        method: 'PUT',
        body: expect.any(String)
      })
    );
    expect(result.success).toBe(true);
    expect(result.post.title).toBe(updateData.title);
    expect(result.post.tags).toHaveLength(4);
  });
  
  test('获取热门帖子', async () => {
    // 模拟API响应 - 匹配实际实现逻辑
    const mockPostsData = {
      posts: [
        {
          id: 1744789431836, 
          title: 'Python学习经验分享', 
          author: '张三',
          date: '2024-03-15',
          views: 256,
          likes: 100,
          favorites: 50,
          comments: []
        },
        {
          id: 1744789431837, 
          title: 'React Hooks技术讨论', 
          author: '李四',
          date: '2024-03-14',
          views: 189,
          likes: 80,
          favorites: 40,
          comments: []
        },
        {
          id: 1744789431838, 
          title: '低热度帖子', 
          author: '王五',
          date: '2024-03-13',
          views: 50,
          likes: 10,
          favorites: 5,
          comments: []
        }
      ]
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPostsData
    });
    
    // 调用API
    const result = await contentAPI.getHotPosts();
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/posts'));
    expect(result).toHaveLength(3);
    // 验证返回的是按热度排序的帖子
    expect(result[0].title).toBe('Python学习经验分享');
    expect(result[1].title).toBe('React Hooks技术讨论');
    expect(result[2].title).toBe('低热度帖子');
  });
  
  test('处理错误响应', async () => {
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({
        success: false,
        message: '服务器错误'
      })
    });
    
    // 断言API调用会抛出错误
    await expect(contentAPI.getPosts()).rejects.toThrow();
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/posts'));
  });
});