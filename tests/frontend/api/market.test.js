import { contentAPI } from '../../../frontend/js/api.js';

// 模拟fetch响应
global.fetch = jest.fn();

// 在每个测试前重置模拟
beforeEach(() => {
  fetch.mockClear();
});

describe('市场相关API测试', () => {
  test('获取市场物品列表', async () => {
    // 模拟API响应 - 匹配实际数据结构
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { 
            id: 1, 
            title: '二手笔记本电脑', 
            price: 2999,
            description: '9成新，配置良好，适合学习编程',
            image: 'https://placehold.jp/200x200.png',
            seller: '张三',
            contact: '13800138000',
            date: '2024/04/10',
            views: 120,
            favorites: 15
          },
          { 
            id: 2, 
            title: '编程书籍', 
            price: 50,
            description: '《Python编程：从入门到实践》',
            image: 'https://placehold.jp/200x200.png',
            seller: '李四',
            contact: '13900139000',
            date: '2024/04/12',
            views: 85,
            favorites: 8
          }
        ]
      })
    });
    
    // 调用API
    const result = await contentAPI.getMarketItems();
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('../data/market.json'));
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe(1);
    expect(result.items[0].title).toBe('二手笔记本电脑');
    expect(result.items[1].price).toBe(50);
  });
  
  test('获取单个市场物品详情', async () => {
    const testItemId = 1;
    const mockItems = {
      items: [
        { 
          id: 1, 
          title: '二手笔记本电脑', 
          price: 2999,
          description: '9成新，配置良好，适合学习编程',
          image: 'https://placehold.jp/200x200.png',
          seller: '张三',
          contact: '13800138000',
          date: '2024/04/10',
          views: 120,
          favorites: 15
        },
        { 
          id: 2, 
          title: '编程书籍', 
          price: 50,
          description: '《Python编程：从入门到实践》',
          image: 'https://placehold.jp/200x200.png',
          seller: '李四',
          contact: '13900139000',
          date: '2024/04/12',
          views: 85,
          favorites: 8
        }
      ]
    };
    
    // 模拟getMarketItems API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItems
    });
    
    // 调用API
    const result = await contentAPI.getMarketItem(testItemId);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.item.id).toBe(testItemId);
    expect(result.item.title).toBe('二手笔记本电脑');
    expect(result.item.price).toBe(2999);
  });
  
  test('获取不存在的市场物品', async () => {
    const testItemId = 999; // 不存在的ID
    const mockItems = {
      items: [
        { id: 1, title: '二手笔记本电脑', price: 2999 },
        { id: 2, title: '编程书籍', price: 50 }
      ]
    };
    
    // 模拟getMarketItems API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItems
    });
    
    // 调用API
    const result = await contentAPI.getMarketItem(testItemId);
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
    expect(result.message).toBe('物品不存在');
  });
  
  test('创建新的市场物品', async () => {
    const newItem = {
      title: '全新键盘',
      price: 299,
      description: '机械键盘，青轴，带RGB灯效',
      image: 'https://placehold.jp/200x200.png',
      seller: '王五',
      contact: '13700137000'
    };
    
    // 调用API
    const result = await contentAPI.createMarketItem(newItem);
    
    // 断言 - 这是一个模拟函数，不会真正调用fetch
    expect(fetch).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.message).toBe('物品创建成功');
    expect(result.item).toHaveProperty('id');
    expect(result.item.title).toBe(newItem.title);
    expect(result.item.price).toBe(newItem.price);
    expect(result.item).toHaveProperty('date');
  });
  
  test('更新市场物品', async () => {
    const itemId = 1;
    const updateData = {
      price: 2799,
      description: '9.5成新，已降价，配置良好，适合学习编程'
    };
    
    // 调用API
    const result = await contentAPI.updateMarketItem(itemId, updateData);
    
    // 断言 - 这是一个模拟函数，不会真正调用fetch
    expect(fetch).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.message).toBe('物品更新成功');
  });
  
  test('获取热门市场物品', async () => {
    const mockItems = {
      items: [
        { 
          id: 1, 
          title: '二手笔记本电脑', 
          price: 2999,
          views: 120,
          favorites: 15
        },
        { 
          id: 2, 
          title: '编程书籍', 
          price: 50,
          views: 85,
          favorites: 8
        },
        { 
          id: 3, 
          title: '显示器', 
          price: 899,
          views: 200,
          favorites: 5
        }
      ]
    };
    
    // 模拟getMarketItems API响应
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItems
    });
    
    // 调用API
    const hotItems = await contentAPI.getHotMarketItems();
    
    // 断言
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(hotItems).toHaveLength(3);
    
    // 验证热门物品排序 (热度 = views + favorites * 2)
    // 物品1: 120 + 15*2 = 150
    // 物品2: 85 + 8*2 = 101
    // 物品3: 200 + 5*2 = 210
    expect(hotItems[0].id).toBe(3); // 显示器应该排第一
    expect(hotItems[1].id).toBe(1); // 笔记本电脑应该排第二
    expect(hotItems[2].id).toBe(2); // 编程书籍应该排第三
  });
  
  test('处理市场物品API错误', async () => {
    // 模拟API错误响应
    fetch.mockRejectedValueOnce(new Error('获取市场物品失败'));
    
    // 调用API并捕获错误
    try {
      await contentAPI.getMarketItems();
      // 如果没有抛出错误，则测试失败
      fail('应该抛出错误');
    } catch (error) {
      // 断言
      expect(error.message).toBe('获取市场物品失败');
    }
    
    expect(fetch).toHaveBeenCalledTimes(1);
  });
}); 