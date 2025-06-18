import { BASE_URL } from '../../../frontend/js/api.js';

describe('BASE_URL常量测试', () => {
  // 保存原始的window.location
  const originalLocation = window.location;

  beforeEach(() => {
    // 重置window.location
    delete window.location;
  });

  afterEach(() => {
    // 测试后恢复window.location
    window.location = originalLocation;
  });

  test('在localhost环境下应返回http://localhost:5000', () => {
    // 模拟localhost环境
    window.location = {
      hostname: 'localhost',
      origin: 'http://localhost'
    };

    // 重新导入模块以重新计算BASE_URL
    jest.resetModules();
    const { BASE_URL } = require('../../../frontend/js/api.js');

    // 断言
    expect(BASE_URL).toBe('http://localhost:5000');
  });

  test('在127.0.0.1环境下应返回http://127.0.0.1:5000', () => {
    // 模拟127.0.0.1环境
    window.location = {
      hostname: '127.0.0.1',
      origin: 'http://127.0.0.1'
    };

    // 重新导入模块以重新计算BASE_URL
    jest.resetModules();
    const { BASE_URL } = require('../../../frontend/js/api.js');

    // 断言
    expect(BASE_URL).toBe('http://127.0.0.1:5000');
  });

  test('在生产环境下应返回window.location.origin', () => {
    // 模拟生产环境
    window.location = {
      hostname: 'example.com',
      origin: 'https://example.com'
    };

    // 重新导入模块以重新计算BASE_URL
    jest.resetModules();
    const { BASE_URL } = require('../../../frontend/js/api.js');

    // 断言
    expect(BASE_URL).toBe('https://example.com');
  });
}); 