// 在测试环境中设置全局变量和工具

// 模拟浏览器存储功能
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn(index => Object.keys(store)[index]),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// 模拟fetch API
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    status: 200
  })
);

// 模拟window对象的属性
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });
Object.defineProperty(window, 'location', {
  value: {
    href: "http://localhost:5000/",
    origin: "http://localhost:5000",
    hostname: "localhost",
    pathname: "/",
    reload: jest.fn()
  },
  writable: true
});

// 模拟文档操作
document.body.innerHTML = '<div id="root"></div>';

// 模拟控制台方法，使测试输出更清晰
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// 添加自定义断言
expect.extend({
  toBeValidPost(received) {
    const pass = 
      received && 
      typeof received.id === 'number' &&
      typeof received.title === 'string' && 
      typeof received.content === 'string' &&
      typeof received.author === 'string' &&
      typeof received.date === 'string' && 
      Array.isArray(received.tags) &&
      typeof received.views === 'number' &&
      typeof received.likes === 'number' &&
      typeof received.favorites === 'number' &&
      Array.isArray(received.likedBy) &&
      Array.isArray(received.favoritedBy);
    
    if (pass) {
      return {
        message: () => `预期 ${JSON.stringify(received)} 不是有效帖子，但实际是`,
        pass: true
      };
    } else {
      return {
        message: () => `预期 ${JSON.stringify(received)} 是有效帖子，但实际不是有效结构`,
        pass: false
      };
    }
  },
  
  toBeValidComment(received) {
    const pass = 
      received && 
      typeof received.id === 'number' &&
      typeof received.author === 'string' && 
      typeof received.content === 'string' &&
      typeof received.date === 'string' &&
      typeof received.likes === 'number' &&
      Array.isArray(received.likedBy);
    
    if (pass) {
      return {
        message: () => `预期 ${JSON.stringify(received)} 不是有效评论，但实际是`,
        pass: true
      };
    } else {
      return {
        message: () => `预期 ${JSON.stringify(received)} 是有效评论，但实际不是有效结构`,
        pass: false
      };
    }
  }
});

// 清除所有模拟的实现和实例
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  document.body.innerHTML = '<div id="root"></div>';
}); 