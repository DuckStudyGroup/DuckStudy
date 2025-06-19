import { contentAPI } from '../../../frontend/js/api.js';

// 模拟fetch响应
global.fetch = jest.fn();

// 在每个测试前重置模拟
beforeEach(() => {
  fetch.mockClear();
});

describe('评论更新和回复API测试', () => {
  test('更新评论', async () => {
    const postId = '1744789431836';
    const commentId = '1744791772511';
    const commentData = {
      id: 1744791772511,
      author: '测试1',
      content: '更新后的评论内容',
      date: '2025/04/16 16:22',
      likes: 1,
      likedBy: ['张三'],
      replies: []
    };
    
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '评论更新成功',
        comment: commentData
      })
    });
    
    // 调用API
    const result = await contentAPI.updateComment(postId, commentId, commentData);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/comments/${postId}/${commentId}`),
      expect.objectContaining({
        method: 'PUT',
        body: expect.any(String)
      })
    );
    expect(result.success).toBe(true);
    expect(result.comment.content).toBe('更新后的评论内容');
    expect(result.comment.likes).toBe(1);
  });
  
  test('更新评论 - 添加回复', async () => {
    const postId = '1744789431836';
    const commentId = '1744791772511';
    const commentData = {
      id: 1744791772511,
      author: '测试1',
      content: '评论内容',
      date: '2025/04/16 16:22',
      likes: 0,
      likedBy: [],
      replies: [
        { 
          id: 1744799999999, 
          author: '张三', 
          content: '新的回复内容', 
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
        comment: commentData
      })
    });
    
    // 调用API
    const result = await contentAPI.updateComment(postId, commentId, commentData);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/comments/${postId}/${commentId}`),
      expect.objectContaining({
        method: 'PUT',
        body: expect.any(String)
      })
    );
    expect(result.success).toBe(true);
    expect(result.comment.replies).toHaveLength(1);
    expect(result.comment.replies[0].content).toBe('新的回复内容');
  });
  
  test('更新评论 - 参数验证失败', async () => {
    // 调用API但缺少必要参数
    const result = await contentAPI.updateComment(null, null, null);
    
    // 断言
    expect(fetch).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toBe('缺少必要参数');
  });
  
  test('更新评论 - API错误响应', async () => {
    const postId = '1744789431836';
    const commentId = '1744791772511';
    const commentData = {
      id: 1744791772511,
      content: '更新后的评论内容'
    };
    
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        success: false,
        message: '评论不存在'
      })
    });
    
    // 调用API
    const result = await contentAPI.updateComment(postId, commentId, commentData);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.message).toBe('评论不存在');
  });
  
  test('删除回复', async () => {
    const postId = '1744789431836';
    const commentId = '1744791772511';
    const replyId = '1744799999999';
    
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: '回复删除成功',
        data: {
          postId,
          commentId,
          replyId
        }
      })
    });
    
    // 调用API
    const result = await contentAPI.deleteReply(postId, commentId, replyId);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/comments/${postId}/${commentId}/replies/${replyId}`),
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include'
      })
    );
    expect(result.success).toBe(true);
    expect(result.message).toBe('回复删除成功');
  });
  
  test('删除回复 - API错误响应', async () => {
    const postId = '1744789431836';
    const commentId = '1744791772511';
    const replyId = '9999999999';
    
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        success: false,
        message: '回复不存在'
      })
    });
    
    // 断言API调用会抛出错误
    await expect(contentAPI.deleteReply(postId, commentId, replyId)).rejects.toThrow('回复不存在');
    
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  
  test('删除回复 - 权限错误', async () => {
    const postId = '1744789431836';
    const commentId = '1744791772511';
    const replyId = '1744799999999';
    
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        success: false,
        message: '只能删除自己的回复'
      })
    });
    
    // 断言API调用会抛出错误
    await expect(contentAPI.deleteReply(postId, commentId, replyId)).rejects.toThrow('只能删除自己的回复');
    
    expect(fetch).toHaveBeenCalledTimes(1);
  });
}); 