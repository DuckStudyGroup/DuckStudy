module.exports = {
  // 测试环境，使用jsdom模拟浏览器环境
  testEnvironment: "jsdom",
  
  // 测试文件匹配模式
  testMatch: [
    "**/tests/frontend/**/*.test.js"
  ],
  
  // 测试覆盖率收集目录
  collectCoverageFrom: [
    "frontend/js/**/*.js",
    "!frontend/js/lib/**/*.js", // 排除第三方库
  ],
  
  // 覆盖率报告配置
  coverageDirectory: "tests/coverage",
  coverageReporters: ["json", "lcov", "text", "clover", "html"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  
  // 设置模块路径映射
  moduleNameMapper: {
    "^/js/(.*)$": "<rootDir>/frontend/js/$1"
  },
  
  // 在测试前运行的脚本
  setupFilesAfterEnv: [
    "<rootDir>/tests/frontend/setup.js"
  ],
  
  // 转换器配置，处理不同类型的文件
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  
  // 根目录设置，确保相对路径正确
  rootDir: ".",
  
  // 测试超时时间
  testTimeout: 10000,
  
  // 是否在运行期间显示各个测试的状态
  verbose: true
}; 