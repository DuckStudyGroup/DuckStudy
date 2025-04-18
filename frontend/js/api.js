// API基础URL
// 请根据实际情况选择正确的URL
const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? `http://${window.location.hostname}:5000` 
    : 'http://localhost:5000';

// 用户相关API
export const userAPI = {
    // 获取用户状态
    getStatus: async () => {
        try {
            // 从localStorage获取用户信息
            const userData = JSON.parse(localStorage.getItem('userData'));
            if (userData) {
                return {
                    isLoggedIn: true,
                    username: userData.username,
                    role: userData.role || 'user',
                    avatar: userData.avatar || 'https://placehold.jp/40x40.png'
                };
            }
            return {
                isLoggedIn: false
            };
        } catch (error) {
            console.error('获取用户状态失败:', error);
            return {
                isLoggedIn: false
            };
        }
    },

    // 用户登录
    login: async (username, password) => {
        try {
            const response = await fetch(`${BASE_URL}/api/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '登录失败');
            }
            
            return await response.json();
        } catch (error) {
            console.error('登录失败:', error);
            throw error;
        }
    },

    // 用户注册
    register: async (username, password, email) => {
        try {
            const response = await fetch(`${BASE_URL}/api/user/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, email }),
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '注册失败');
            }
            
            return await response.json();
        } catch (error) {
            console.error('注册失败:', error);
            throw error;
        }
    },

    // 用户退出
    logout: async () => {
        try {
            // 清除本地存储的用户信息
            localStorage.removeItem('userData');
            
            return {
                success: true,
                message: '退出成功'
            };
        } catch (error) {
            console.error('退出失败:', error);
            throw error;
        }
    }
};

// 内容相关API
export const contentAPI = {
    // 获取所有帖子
    getPosts: async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/posts`);
            if (!response.ok) {
                throw new Error('获取帖子列表失败');
            }
            return await response.json();
        } catch (error) {
            console.error('获取帖子列表失败:', error);
            throw error;
        }
    },

    // 获取特定帖子
    getPost: async (postId) => {
        try {
            const response = await fetch(`${BASE_URL}/api/posts/${postId}`);
            if (!response.ok) {
                throw new Error('获取帖子详情失败');
            }
            return await response.json();
        } catch (error) {
            console.error('获取帖子详情失败:', error);
            throw error;
        }
    },

    // 创建新帖子
    createPost: async (postData) => {
        try {
            const response = await fetch(`${BASE_URL}/api/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });
            if (!response.ok) {
                throw new Error('创建帖子失败');
            }
            return await response.json();
        } catch (error) {
            console.error('创建帖子失败:', error);
            throw error;
        }
    },

    // 更新帖子
    updatePost: async (postId, postData) => {
        try {
            const response = await fetch(`${BASE_URL}/api/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });
            if (!response.ok) {
                throw new Error('更新帖子失败');
            }
            return await response.json();
        } catch (error) {
            console.error('更新帖子失败:', error);
            throw error;
        }
    },

    // 获取评论
    getComments: async (postId) => {
        try {
            const response = await fetch(`${BASE_URL}/api/comments/${postId}`);
            if (!response.ok) {
                throw new Error('获取评论列表失败');
            }
            const data = await response.json();
            return data.comments;
        } catch (error) {
            console.error('获取评论列表失败:', error);
            throw error;
        }
    },

    // 获取所有评论
    getAllComments: async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/comments`);
            if (!response.ok) {
                throw new Error('获取所有评论失败');
            }
            const data = await response.json();
            return data.comments;
        } catch (error) {
            console.error('获取所有评论失败:', error);
            throw error;
        }
    },

    // 添加评论
    addComment: async (postId, commentData) => {
        try {
            const response = await fetch(`${BASE_URL}/api/comments/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commentData)
            });
            if (!response.ok) {
                throw new Error('添加评论失败');
            }
            return await response.json();
        } catch (error) {
            console.error('添加评论失败:', error);
            throw error;
        }
    },

    // 获取课程评价
    getReviews: async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/reviews`);
            if (!response.ok) {
                throw new Error('获取课程评价失败');
            }
            return await response.json();
        } catch (error) {
            console.error('获取课程评价失败:', error);
            throw error;
        }
    },

    // 获取二手市场商品
    getMarketItems: async () => {
        try {
            // 在开发阶段，直接从本地JSON文件加载数据
            const response = await fetch('../data/market.json');
            if (!response.ok) {
                throw new Error('获取二手市场商品失败');
            }
            return await response.json();
        } catch (error) {
            console.error('获取二手市场商品失败:', error);
            throw error;
        }
    },

    // 获取单个市场物品详情
    getMarketItem: async (itemId) => {
        try {
            // 获取所有市场物品
            const response = await contentAPI.getMarketItems();
            if (response && response.items && response.items.length > 0) {
                // 查找特定ID的物品
                const item = response.items.find(item => item.id === parseInt(itemId));
                if (item) {
                    return { success: true, item };
                }
                return { success: false, message: '物品不存在' };
            }
            return { success: false, message: '获取物品失败' };
        } catch (error) {
            console.error('获取市场物品详情失败:', error);
            return { success: false, message: error.message };
        }
    },

    // 创建新的市场物品
    createMarketItem: async (itemData) => {
        try {
            // 在开发阶段，仅返回模拟成功响应
            // 实际场景中应该调用后端API保存数据
            return {
                success: true,
                message: '物品创建成功',
                item: {
                    id: Date.now(),  // 使用时间戳作为临时ID
                    ...itemData,
                    views: 0,
                    favorites: 0,
                    date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/'),
                }
            };
        } catch (error) {
            console.error('创建市场物品失败:', error);
            return { success: false, message: error.message };
        }
    },

    // 更新市场物品
    updateMarketItem: async (itemId, itemData) => {
        try {
            // 在开发阶段，仅返回模拟成功响应
            // 实际场景中应该调用后端API更新数据
            return {
                success: true,
                message: '物品更新成功'
            };
        } catch (error) {
            console.error('更新市场物品失败:', error);
            return { success: false, message: error.message };
        }
    },

    // 获取热门市场物品
    getHotMarketItems: async () => {
        try {
            // 获取所有市场物品
            const response = await contentAPI.getMarketItems();
            
            if (response && response.items && response.items.length > 0) {
                // 按浏览量和收藏数排序
                const items = response.items.sort((a, b) => {
                    // 计算热度分数：浏览量 + 收藏数 * 2
                    const scoreA = a.views + (a.favorites * 2);
                    const scoreB = b.views + (b.favorites * 2);
                    return scoreB - scoreA;
                });
                
                // 返回前3个热门物品
                return items.slice(0, 3);
            }
            
            return [];
        } catch (error) {
            console.error('获取热门市场物品失败:', error);
            return [];
        }
    },

    // 获取热门帖子
    getHotPosts: async () => {
        try {
            // 获取所有帖子
            const response = await contentAPI.getPosts();
            
            if (response && response.posts && response.posts.length > 0) {
                // 获取所有帖子并按照 views 和 likes 降序排序，提取最热门的帖子
                const posts = response.posts.sort((a, b) => {
                    // 计算热度分数：浏览量 + 点赞数 * 2（给点赞更高权重）
                    const scoreA = a.views + (a.likes * 2);
                    const scoreB = b.views + (b.likes * 2);
                    return scoreB - scoreA;
                });
                
                // 返回前3个热门帖子
                return posts.slice(0, 3);
            }
            
            return [];
        } catch (error) {
            console.error('获取热门帖子失败:', error);
            
            // 出错时返回空数组
            return [];
        }
    },

    // 获取最近观看
    getRecentViews: async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/history`);
            if (!response.ok) {
                throw new Error('获取最近观看失败');
            }
            return await response.json();
        } catch (error) {
            console.error('获取最近观看失败:', error);
            throw error;
        }
    },

    // 获取热门项目
    getHotProjects: async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/projects/hot`);
            if (!response.ok) {
                throw new Error('获取热门项目失败');
            }
            return await response.json();
        } catch (error) {
            console.error('获取热门项目失败:', error);
            throw error;
        }
    }
}; 