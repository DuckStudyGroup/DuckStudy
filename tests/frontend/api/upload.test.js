import { uploadAPI } from '../../../frontend/js/api.js';

// 模拟fetch响应
global.fetch = jest.fn();

// 在每个测试前重置模拟
beforeEach(() => {
  fetch.mockClear();
  jest.clearAllMocks();
});

describe('上传API测试', () => {
  test('上传图片 - 模拟功能', async () => {
    // 创建FormData对象
    const formData = new FormData();
    const mockFile = new File(['test file content'], 'test.jpg', { type: 'image/jpeg' });
    formData.append('image', mockFile);
    formData.append('filename', 'test_1744799999999.jpg');
    
    // 调用API
    const result = await uploadAPI.uploadImage(formData);
    
    // 断言 - 这是一个模拟函数，不会真正调用fetch
    expect(fetch).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.imageUrl).toBe('/images/posts/test_1744799999999.jpg');
    expect(result.imageId).toBe('test_1744799999999.jpg');
  });
  
  test('上传评论图片', async () => {
    // 创建FormData对象
    const formData = new FormData();
    const mockFile = new File(['test file content'], 'comment.jpg', { type: 'image/jpeg' });
    formData.append('image', mockFile);
    formData.append('filename', 'comment_1744799999999.jpg');
    
    // 模拟API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        imageId: 'comment_1744799999999',
        imageUrl: '/images/comments/comment_1744799999999.jpg',
        message: '图片上传成功'
      })
    });
    
    // 调用API
    const result = await uploadAPI.uploadCommentImage(formData);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/upload-image'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData)
      })
    );
    expect(result.success).toBe(true);
    expect(result.imageUrl).toBe('/images/comments/comment_1744799999999.jpg');
    expect(result.imageId).toBe('comment_1744799999999');
  });
  
  test('上传评论图片 - 处理失败响应', async () => {
    // 创建FormData对象
    const formData = new FormData();
    const mockFile = new File(['invalid file'], 'invalid.txt', { type: 'text/plain' });
    formData.append('image', mockFile);
    
    // 模拟API错误响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        message: '不支持的文件类型'
      })
    });
    
    // 调用API
    const result = await uploadAPI.uploadCommentImage(formData);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.message).toBe('不支持的文件类型');
  });
  
  test('上传评论图片 - 处理网络错误', async () => {
    // 创建FormData对象
    const formData = new FormData();
    const mockFile = new File(['test file content'], 'comment.jpg', { type: 'image/jpeg' });
    formData.append('image', mockFile);
    
    // 模拟网络错误
    fetch.mockRejectedValueOnce(new Error('Network Error'));
    
    // 调用API
    const result = await uploadAPI.uploadCommentImage(formData);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Network Error');
  });
}); 