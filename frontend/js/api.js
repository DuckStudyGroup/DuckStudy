// API基础URL
// 开发环境使用本地服务器，生产环境使用当前域名
export const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? `http://${window.location.hostname}:5000` 
    : window.location.origin; // 使用当前网站的完整URL（包含协议、域名和端口）

// 用户相关API
const userAPI = {
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
const contentAPI = {
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
            // 添加调试日志
            console.log('准备更新帖子:', postId, '数据:', postData);
            
            // 确保兼容性：如果后端API不支持coverImages字段，可以创建不包含该字段的数据副本
            const safePostData = {...postData};
            if (safePostData.coverImages && Array.isArray(safePostData.coverImages) && safePostData.coverImages.length === 0) {
                // 如果coverImages为空数组，将其设置为null或完全删除该字段
                delete safePostData.coverImages;
            }
            
            const response = await fetch(`${BASE_URL}/api/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(safePostData)
            });
            
            // 添加更详细的错误处理
            if (!response.ok) {
                // 尝试获取详细的错误信息
                let errorMessage = '更新帖子失败';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonError) {
                    // 如果无法解析JSON，使用HTTP状态文本
                    errorMessage = `更新帖子失败: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            
            return await response.json();
        } catch (error) {
            console.error('更新帖子失败:', error);
            // 为防止意外错误导致整个应用崩溃，返回错误对象而不是抛出异常
            return { 
                success: false, 
                error: true,
                message: error.message || '更新帖子时发生未知错误'
            };
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
                // 获取所有帖子并按热度排序
                // 热度计算公式: 浏览量 + 点赞数*2 + 收藏数*3 + 评论数*1.5
                const posts = response.posts.sort((a, b) => {
                    // 获取评论数量（如果有的话）
                    const commentsA = a.comments ? a.comments.length : 0;
                    const commentsB = b.comments ? b.comments.length : 0;
                    
                    // 计算热度分数
                    const scoreA = a.views + (a.likes * 2) + ((a.favorites || 0) * 3) + (commentsA * 1.5);
                    const scoreB = b.views + (b.likes * 2) + ((b.favorites || 0) * 3) + (commentsB * 1.5);
                    
                    return scoreB - scoreA;
                });
                
                // 返回前5个热门帖子
                return posts.slice(0, 5);
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
    },

    // 更新评论
    updateComment: async (postId, commentId, commentData) => {
        try {
            // 验证输入
            if (!postId || !commentId || !commentData) {
                throw new Error('缺少必要参数');
            }
            
            const response = await fetch(`${BASE_URL}/api/comments/${postId}/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commentData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '更新评论失败');
            }
            
            return await response.json();
        } catch (error) {
            console.error('更新评论失败:', error);
            return {
                success: false,
                message: error.message || '更新评论失败'
            };
        }
    }
};

// 图片上传接口
const uploadAPI = {
    // 上传图片（开发阶段模拟API）
    uploadImage: async function(imageData) {
        try {
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // 解析FormData
            const formData = imageData;
            const file = formData.get('image');
            const filename = formData.get('filename');
            const directory = formData.get('directory') || 'posts'; // 默认存储在posts目录
            
            // 生成图片URL
            const imageUrl = `/images/${directory}/${filename}`;
            
            return {
                success: true,
                imageId: filename,
                imageUrl: imageUrl,
                message: "图片上传成功"
            };
        } catch (error) {
            console.error('上传图片失败:', error);
            throw error;
        }
    },

    // 上传评论图片
    uploadCommentImage: async (formData) => {
        try {
            // 添加目录参数
            formData.append('directory', 'comments');
            
            const response = await fetch(`${BASE_URL}/api/upload-image`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || '上传失败');
            }
            
            return {
                success: true,
                imageId: data.imageId || data.filename || Date.now().toString(),
                imageUrl: data.imageUrl,
                message: data.message || '图片上传成功'
            };
        } catch (error) {
            console.error('评论图片上传失败:', error);
            return {
                success: false,
                message: error.message || '上传失败'
            };
        }
    }
};

// 导出API对象
export { userAPI, contentAPI, uploadAPI }; 