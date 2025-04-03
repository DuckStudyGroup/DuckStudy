// API基础URL
const API_BASE_URL = '/api';

// 用户相关API
export const userAPI = {
    // 获取用户状态
    getStatus: async () => {
        const response = await fetch(`${API_BASE_URL}/user/status`, {
            credentials: 'include'
        });
        return response.json();
    },

    // 登录
    login: async (username, password) => {
        const response = await fetch(`${API_BASE_URL}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
        });
        return response.json();
    },

    // 注册
    register: async (username, password) => {
        const response = await fetch(`${API_BASE_URL}/user/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
        });
        return response.json();
    },

    // 登出
    logout: async () => {
        const response = await fetch(`${API_BASE_URL}/user/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        return response.json();
    }
};

// 内容相关API
export const contentAPI = {
    // 获取课程评价
    getReviews: async () => {
        const response = await fetch(`${API_BASE_URL}/reviews`, {
            credentials: 'include'
        });
        return response.json();
    },

    // 获取二手市场商品
    getMarketItems: async () => {
        const response = await fetch(`${API_BASE_URL}/market`, {
            credentials: 'include'
        });
        return response.json();
    },

    // 获取热门帖子
    getHotPosts: async () => {
        const response = await fetch(`${API_BASE_URL}/posts/hot`, {
            credentials: 'include'
        });
        return response.json();
    },

    // 获取最近观看
    getRecentViews: async () => {
        const response = await fetch(`${API_BASE_URL}/history`, {
            credentials: 'include'
        });
        return response.json();
    },

    // 获取热门项目
    getHotProjects: async () => {
        const response = await fetch(`${API_BASE_URL}/projects/hot`, {
            credentials: 'include'
        });
        return response.json();
    }
}; 