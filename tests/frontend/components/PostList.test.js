/**
 * 帖子列表组件测试
 * 测试帖子列表渲染、分类筛选、搜索和排序功能
 */

// 模拟依赖
jest.mock('../../../frontend/js/api.js', () => ({
  contentAPI: {
    getPosts: jest.fn(),
    getAllComments: jest.fn()
  },
  userAPI: {
    getStatus: jest.fn()
  }
}));

// 导入被测试的模块和依赖
import { contentAPI, userAPI } from '../../../frontend/js/api.js';
import * as navUtils from '../../../frontend/js/nav-utils.js';

// 定义HTML模板
const setupDOM = () => {
  document.body.innerHTML = `
    <div class="categories">
      <div class="category-item active" data-category="">全部</div>
      <div class="category-item" data-category="study">学习交流</div>
      <div class="category-item" data-category="life">校园生活</div>
    </div>
    <div class="search-box">
      <input type="text" placeholder="搜索帖子...">
    </div>
    <select id="sortSelect">
      <option value="time-desc">最新发布</option>
      <option value="hot-desc">最热门</option>
      <option value="likes-desc">点赞最多</option>
    </select>
    <div id="resultCount"></div>
    <div id="postsContainer"></div>
    <button id="createPostBtn">发布帖子</button>
  `;
};

// 模拟window.location
const originalLocation = window.location;
delete window.location;
window.location = { 
  href: 'http://localhost/posts.html',
  hostname: 'localhost',
  pathname: '/posts.html'
};

// 全局模拟函数
const mockRenderAvatar = jest.fn(avatar => `<img src="${avatar}" class="avatar-img">`);
navUtils.renderAvatar = mockRenderAvatar;
navUtils.initNavbar = jest.fn(() => Promise.resolve());
navUtils.isDefaultAvatar = jest.fn(() => false);

// 模拟全局对象
window.mockPosts = [];

// 测试数据 - 匹配实际数据结构
const mockPostsData = {
  posts: [
    {
      id: 1744789431836,
      title: '计算机专业学习路线分享',
      content: '<p>作为一名在IT行业工作了5年的程序员，我想和大家分享一下我的学习经验和路线规划...</p>',
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
      content: '<p>作为一个即将毕业的大四学生，我经历了无数次期末考试的洗礼，今天就来分享一下我的高效复习方法...</p>',
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
};

// 评论数据 - 匹配实际数据结构
const mockCommentsData = {
  '1744789431836': [
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
      likedBy: [] 
    }
  ],
  '1744791431962': [
    { 
      id: 1744792084099, 
      author: '测试1', 
      content: '111', 
      date: '2025/04/16 16:28', 
      likes: 0, 
      likedBy: [] 
    }
  ]
};

// 在每个测试前准备环境
beforeEach(() => {
  // 重置DOM
  setupDOM();
  
  // 重置模拟
  jest.clearAllMocks();
  
  // 重置模拟响应
  contentAPI.getPosts.mockResolvedValue(mockPostsData);
  contentAPI.getAllComments.mockResolvedValue(mockCommentsData);
  userAPI.getStatus.mockResolvedValue({ isLoggedIn: true, username: 'testuser' });
  
  // 重置全局变量
  window.mockPosts = [...mockPostsData.posts];
});

// 在所有测试后清理
afterAll(() => {
  window.location = originalLocation;
});

// 导入模块（使用require而不是import，这样模拟才能生效）
describe('帖子列表组件', () => {
  test('初始化时正确加载帖子数据', async () => {
    // 加载模块
    const postsModule = require('../../../frontend/js/posts.js');
    
    // 触发DOMContentLoaded事件
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 断言
    expect(contentAPI.getPosts).toHaveBeenCalledTimes(1);
    expect(window.mockPosts.length).toBe(2);
    
    // 检查帖子容器内容
    const postsContainer = document.getElementById('postsContainer');
    expect(postsContainer.innerHTML).toContain('计算机专业学习路线分享');
    expect(postsContainer.innerHTML).toContain('大学生如何高效复习期末考试');
    expect(postsContainer.querySelectorAll('.post-card').length).toBe(2);
  });
  
  test('分类切换功能正确过滤帖子', async () => {
    // 加载模块
    const postsModule = require('../../../frontend/js/posts.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 模拟点击"学习交流"分类
    const studyCategory = document.querySelector('.category-item[data-category="study"]');
    studyCategory.dispatchEvent(new Event('click'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 断言
    const postsContainer = document.getElementById('postsContainer');
    expect(postsContainer.innerHTML).toContain('计算机专业学习路线分享');
    expect(postsContainer.innerHTML).not.toContain('大学生如何高效复习期末考试');
    expect(postsContainer.querySelectorAll('.post-card').length).toBe(1);
    
    // 模拟点击"全部"分类
    const allCategory = document.querySelector('.category-item[data-category=""]');
    allCategory.dispatchEvent(new Event('click'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 断言显示所有帖子
    expect(postsContainer.querySelectorAll('.post-card').length).toBe(2);
  });
  
  test('搜索功能正确过滤帖子', async () => {
    // 加载模块
    const postsModule = require('../../../frontend/js/posts.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 模拟搜索"计算机科学"
    const searchInput = document.querySelector('.search-box input');
    searchInput.value = '计算机科学';
    searchInput.dispatchEvent(new Event('input'));
    
    // 等待防抖
    await new Promise(resolve => setTimeout(resolve, 350));
    
    // 断言
    const postsContainer = document.getElementById('postsContainer');
    expect(postsContainer.innerHTML).toContain('计算机专业学习路线分享');
    expect(postsContainer.innerHTML).not.toContain('大学生如何高效复习期末考试');
    
    // 检查结果计数
    const resultCount = document.getElementById('resultCount');
    expect(resultCount.textContent).toContain('找到 1 个帖子');
    expect(resultCount.style.display).not.toBe('none');
  });
  
  test('排序功能正确排序帖子', async () => {
    // 加载模块
    const postsModule = require('../../../frontend/js/posts.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 模拟选择"点赞最多"排序
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.value = 'likes-desc';
    sortSelect.dispatchEvent(new Event('change'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 断言
    const postsContainer = document.getElementById('postsContainer');
    const postCards = postsContainer.querySelectorAll('.post-card');
    
    // 第一篇帖子应该是"大学生如何高效复习期末考试"（点赞数187）
    expect(postCards[0].innerHTML).toContain('大学生如何高效复习期末考试');
    expect(postCards[1].innerHTML).toContain('计算机专业学习路线分享');
  });
  
  test('发布帖子按钮正确处理用户状态', async () => {
    // 加载模块
    const postsModule = require('../../../frontend/js/posts.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 点击发布按钮（已登录状态）
    const createPostBtn = document.getElementById('createPostBtn');
    createPostBtn.click();
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 断言（已登录用户应该跳转到发布页面）
    expect(window.location.href).toBe('create-post.html');
    
    // 重置位置
    window.location.href = 'http://localhost/posts.html';
    
    // 模拟未登录状态
    userAPI.getStatus.mockResolvedValue({ isLoggedIn: false });
    
    // 清理alert
    const originalAlert = window.alert;
    window.alert = jest.fn();
    
    // 点击发布按钮（未登录状态）
    createPostBtn.click();
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 断言（未登录用户应该看到提示信息）
    expect(window.alert).toHaveBeenCalledWith('请先登录后再发布');
    expect(window.location.href).not.toBe('create-post.html');
    
    // 恢复alert
    window.alert = originalAlert;
  });
  
  test('帖子卡片点击跳转到帖子详情页', async () => {
    // 加载模块
    const postsModule = require('../../../frontend/js/posts.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 获取第一个帖子卡片并点击
    const firstPostCard = document.querySelector('.post-card');
    firstPostCard.click();
    
    // 断言（应该跳转到帖子详情页）
    expect(window.location.href).toBe(`post-detail.html?id=${mockPostsData.posts[0].id}`);
  });

  // 新增测试：API加载失败的场景
  test('处理 API 加载失败的场景', async () => {
    // 模拟API错误
    contentAPI.getPosts.mockRejectedValue(new Error('API错误'));
    
    // 捕获控制台错误
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // 加载模块
    const postsModule = require('../../../frontend/js/posts.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 断言错误被正确处理
    expect(console.error).toHaveBeenCalled();
    // 使用正确的错误消息前缀
    expect(console.error.mock.calls[0][0]).toBe('加载帖子数据失败:');
    
    // 恢复console.error
    console.error = originalConsoleError;
  });

  // 新增测试：空帖子列表的场景
  test('处理空帖子列表的场景', async () => {
    // 模拟空帖子列表
    contentAPI.getPosts.mockResolvedValue({ posts: [] });
    
    // 加载模块
    const postsModule = require('../../../frontend/js/posts.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 断言
    const postsContainer = document.getElementById('postsContainer');
    expect(postsContainer.innerHTML).toContain('暂无帖子');
  });

  // 新增测试：评论数据加载失败的场景
  test('处理评论数据加载失败的场景', async () => {
    // 模拟评论数据加载失败
    contentAPI.getAllComments.mockRejectedValue(new Error('评论加载失败'));
    
    // 捕获控制台错误
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // 加载模块
    const postsModule = require('../../../frontend/js/posts.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 断言错误被正确处理
    expect(console.error).toHaveBeenCalled();
    expect(console.error.mock.calls[0][0]).toContain('获取评论数据失败');
    
    // 断言帖子仍然被渲染
    const postsContainer = document.getElementById('postsContainer');
    expect(postsContainer.querySelectorAll('.post-card').length).toBe(2);
    
    // 恢复console.error
    console.error = originalConsoleError;
  });

  // 新增测试：通过标签搜索帖子
  test('通过标签搜索帖子', async () => {
    // 加载模块
    const postsModule = require('../../../frontend/js/posts.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 模拟搜索"时间管理"（这是第二篇帖子的一个标签）
    const searchInput = document.querySelector('.search-box input');
    searchInput.value = '时间管理';
    searchInput.dispatchEvent(new Event('input'));
    
    // 等待防抖
    await new Promise(resolve => setTimeout(resolve, 350));
    
    // 断言
    const postsContainer = document.getElementById('postsContainer');
    expect(postsContainer.innerHTML).not.toContain('计算机专业学习路线分享');
    expect(postsContainer.innerHTML).toContain('大学生如何高效复习期末考试');
    
    // 检查结果计数
    const resultCount = document.getElementById('resultCount');
    expect(resultCount.textContent).toContain('找到 1 个帖子');
  });

  // 新增测试：根据热度排序帖子
  test('根据热度排序帖子', async () => {
    // 加载模块
    const postsModule = require('../../../frontend/js/posts.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 模拟选择"最热门"排序
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.value = 'hot-desc';
    sortSelect.dispatchEvent(new Event('change'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 断言
    const postsContainer = document.getElementById('postsContainer');
    const postCards = postsContainer.querySelectorAll('.post-card');
    
    // 计算热度: 浏览量 + 点赞数*2 + 收藏数*3
    // 第一篇：358 + 157*2 + 73*3 = 887
    // 第二篇：434 + 187*2 + 90*3 = 1078
    // 第二篇热度更高，应该排在前面
    expect(postCards[0].innerHTML).toContain('大学生如何高效复习期末考试');
    expect(postCards[1].innerHTML).toContain('计算机专业学习路线分享');
  });

  // 新增测试：帖子的封面图片处理
  test('处理带有有效封面图片的帖子', async () => {
    // 准备一个带有封面图片的帖子
    const postsWithImages = {
      posts: [
        {
          ...mockPostsData.posts[0],
          coverImages: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg'
          ]
        }
      ]
    };
    
    // 更新模拟数据
    contentAPI.getPosts.mockResolvedValue(postsWithImages);
    
    // 加载模块
    const postsModule = require('../../../frontend/js/posts.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 断言
    const postsContainer = document.getElementById('postsContainer');
    expect(postsContainer.innerHTML).toContain('post-cover-images');
    expect(postsContainer.innerHTML).toContain('https://example.com/image1.jpg');
    expect(postsContainer.innerHTML).toContain('https://example.com/image2.jpg');
  });

  // 新增测试：处理无效的封面图片
  test('过滤无效的封面图片', async () => {
    // 准备一个带有无效封面图片的帖子
    const postsWithInvalidImages = {
      posts: [
        {
          ...mockPostsData.posts[0],
          coverImages: [
            'https://example.com/image1.jpg',
            '<div>这是一个无效图片</div>',
            '<p>段落不是图片</p>',
            'https://example.com/image2.jpg%0A',
            'https://valid-image.jpg'
          ]
        }
      ]
    };
    
    // 更新模拟数据
    contentAPI.getPosts.mockResolvedValue(postsWithInvalidImages);
    
    // 加载模块
    const postsModule = require('../../../frontend/js/posts.js');
    
    // 触发DOMContentLoaded事件
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    // 等待异步操作完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 断言：只有有效图片被渲染
    const postsContainer = document.getElementById('postsContainer');
    expect(postsContainer.innerHTML).toContain('https://example.com/image1.jpg');
    expect(postsContainer.innerHTML).not.toContain('<div>这是一个无效图片</div>');
    expect(postsContainer.innerHTML).not.toContain('<p>段落不是图片</p>');
    expect(postsContainer.innerHTML).not.toContain('https://example.com/image2.jpg%0A');
    expect(postsContainer.innerHTML).toContain('https://valid-image.jpg');
  });
}); 