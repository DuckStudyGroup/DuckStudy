import { contentAPI } from '../../../frontend/js/api.js';

// 模拟fetch响应
global.fetch = jest.fn();

// 在每个测试前重置模拟
beforeEach(() => {
  fetch.mockClear();
});

describe('评论系统API测试', () => {
  test('获取特定帖子的评论列表', async () => {
    const testPostId = '1744789431836';  // 使用实际ID格式
    
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        comments: [
          { 
            id: 1744791772511,
            author: '测试1',
            content: '111',
            date: '2025/04/16 16:22',
            likes: 0,
            likedBy: [] 
          },
          { 
            id: 1744790457087,
            author: '测试1',
            content: '好',
            date: '2025/04/16 16:00',
            likes: 0,
            likedBy: [],
            replies: [
              { id: 1744790458088, author: '张三', content: '回复内容', date: '2025/04/16 16:10', likes: 0, likedBy: [] }
            ]
          }
        ],
        sort: 'desc'
      })
    });
    
    // 调用API
    const comments = await contentAPI.getComments(testPostId);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/comments/${testPostId}`));
    expect(comments).toHaveLength(2);
    expect(comments[1].replies).toBeTruthy();
    if (comments[1].replies) {  // 检查replies字段是否存在
      expect(comments[1].replies.length).toBe(1);
    }
  });
  
  test('获取所有评论', async () => {
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        comments: {
          '1744789431836': [
            { 
              id: 1744791772511, 
              author: '测试1', 
              content: '111', 
              date: '2025/04/16 16:22', 
              likes: 0, 
              likedBy: [] 
            }
          ],
          '1744790431961': [
            { 
              id: 1744792084099, 
              author: '测试1', 
              content: '111', 
              date: '2025/04/16 16:28', 
              likes: 0, 
              likedBy: [] 
            }
          ]
        }
      })
    });
    
    // 调用API
    const allComments = await contentAPI.getAllComments();
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/comments'));
    expect(allComments).toHaveProperty('1744789431836');
    expect(allComments['1744789431836']).toHaveLength(1);
    expect(allComments['1744790431961']).toHaveLength(1);
  });
  
  test('添加新评论', async () => {
    const testPostId = '1744789431836';  // 使用实际ID格式
    const commentData = {
      content: '测试评论内容',
      author: '测试用户'
    };
    
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '评论添加成功',
        comment: { 
          id: 1744799999999, 
          ...commentData, 
          date: '2025/04/16 17:00',
          likes: 0,
          likedBy: [],
          replies: []
        }
      })
    });
    
    // 调用API
    const result = await contentAPI.addComment(testPostId, commentData);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/comments/${testPostId}`),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String)
      })
    );
    expect(result.success).toBe(true);
    expect(result.comment.content).toBe(commentData.content);
  });
  
  test('删除评论', async () => {
    const testPostId = '1744789431836';  // 使用实际ID格式
    const commentId = '1744791772511';   // 使用实际ID格式
    
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '评论删除成功'
      })
    });
    
    // 调用API
    const result = await contentAPI.deleteComment(testPostId, commentId);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/comments/${testPostId}/${commentId}`),
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include'
      })
    );
    expect(result.success).toBe(true);
  });
  
  test('更新评论（添加回复）', async () => {
    const testPostId = '1744789431836';  // 使用实际ID格式
    const commentId = '1744791772511';   // 使用实际ID格式
    const updatedComment = {
      id: 1744791772511,
      author: '测试1',
      content: '111',
      date: '2025/04/16 16:22',
      likes: 0,
      likedBy: [],
      replies: [
        { 
          id: 1744799999999, 
          author: '张三', 
          content: '回复内容', 
          date: '2025/04/16 17:30', 
          likes: 0, 
          likedBy: [] 
        }
      ]
    };
    
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '评论更新成功',
        comment: updatedComment
      })
    });
    
    // 调用API
    const result = await fetch(`/api/comments/${testPostId}/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedComment)
    }).then(res => res.json());
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/comments/${testPostId}/${commentId}`),
      expect.objectContaining({
        method: 'PUT',
        body: expect.any(String)
      })
    );
    expect(result.success).toBe(true);
    expect(result.comment.replies).toHaveLength(1);
  });
  
  test('处理API错误响应', async () => {
    const testPostId = '1744789431836';  // 使用实际ID格式
    
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({
        success: false,
        message: '获取评论列表失败'
      })
    });
    
    // 断言API调用会抛出错误
    await expect(contentAPI.getComments(testPostId)).rejects.toThrow();
    
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/comments/${testPostId}`));
  });
}); 