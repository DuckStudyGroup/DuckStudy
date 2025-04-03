import { userAPI, contentAPI } from './api.js';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 更新用户状态
        await updateUserStatus();
        
        // 添加视图切换事件
        addViewToggleEvents();
        
        // 添加筛选事件
        addFilterEvents();
        
        // 加载项目列表
        await loadProjects();
        
        // 添加加载更多事件
        addLoadMoreEvent();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
});

// 更新用户状态
async function updateUserStatus() {
    try {
        const response = await userAPI.getStatus();
        const userSection = document.getElementById('userSection');
        
        if (!userSection) {
            console.error('未找到用户区域元素');
            return;
        }
        
        if (response.isLoggedIn) {
            userSection.innerHTML = `
                <div class="user-profile">
                    <div class="avatar-container">
                        <div class="avatar">
                            <i class="bi bi-person-circle"></i>
                        </div>
                        <div class="dropdown-menu">
                            <a href="profile.html" class="dropdown-item">
                                <i class="bi bi-person"></i> 个人中心
                            </a>
                            <a href="favorites.html" class="dropdown-item">
                                <i class="bi bi-heart"></i> 我的收藏
                            </a>
                            <a href="history.html" class="dropdown-item">
                                <i class="bi bi-clock-history"></i> 历史观看
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="#" class="dropdown-item" id="logoutBtn">
                                <i class="bi bi-box-arrow-right"></i> 退出登录
                            </a>
                        </div>
                    </div>
                    <span class="username">${response.username}</span>
                </div>
            `;

            // 添加退出登录事件监听
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        await userAPI.logout();
                        window.location.href = '../index.html';
                    } catch (error) {
                        console.error('退出登录失败:', error);
                        alert('退出登录失败，请重试');
                    }
                });
            }
        } else {
            userSection.innerHTML = `
                <a href="login.html" class="btn btn-outline-primary me-2">登录</a>
                <a href="register.html" class="btn btn-primary">注册</a>
            `;
        }
    } catch (error) {
        console.error('获取用户状态失败:', error);
        window.location.href = 'login.html';
    }
}

// 加载项目列表
async function loadProjects(filters = {}) {
    try {
        const projectsGrid = document.getElementById('projectsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!projectsGrid) {
            console.error('未找到项目列表元素');
            return;
        }
        
        // 显示加载状态
        projectsGrid.innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
            </div>
        `;
        
        // 这里应该调用后端API获取项目列表
        // 目前使用模拟数据
        const mockProjects = [
            {
                id: 1,
                title: '在线学习平台',
                description: '基于Vue.js和Django的在线学习平台，支持课程管理、视频播放、作业提交等功能。',
                image: '../images/project1.jpg',
                author: '张老师',
                stars: 128,
                forks: 45,
                tags: ['Vue.js', 'Django', 'Python', 'Web开发'],
                difficulty: '中级',
                type: 'web',
                tech: ['frontend', 'backend']
            },
            {
                id: 2,
                title: '个人博客系统',
                description: '使用React和Node.js开发的个人博客系统，支持文章管理、评论系统、用户认证等功能。',
                image: '../images/project2.jpg',
                author: '李同学',
                stars: 96,
                forks: 32,
                tags: ['React', 'Node.js', 'MongoDB', 'Web开发'],
                difficulty: '入门级',
                type: 'web',
                tech: ['frontend', 'backend']
            },
            {
                id: 3,
                title: '移动端商城',
                description: '基于Flutter开发的跨平台移动商城应用，支持商品展示、购物车、订单管理等功能。',
                image: '../images/project3.jpg',
                author: '王工程师',
                stars: 156,
                forks: 67,
                tags: ['Flutter', 'Dart', '移动开发'],
                difficulty: '高级',
                type: 'mobile',
                tech: ['mobile']
            }
        ];
        
        // 应用筛选条件
        let filteredProjects = mockProjects;
        if (Object.keys(filters).length > 0) {
            filteredProjects = mockProjects.filter(project => {
                if (filters.tech && filters.tech.length > 0) {
                    if (!filters.tech.some(tech => project.tech.includes(tech))) {
                        return false;
                    }
                }
                if (filters.difficulty && filters.difficulty.length > 0) {
                    if (!filters.difficulty.includes(project.difficulty)) {
                        return false;
                    }
                }
                if (filters.type && filters.type.length > 0) {
                    if (!filters.type.includes(project.type)) {
                        return false;
                    }
                }
                return true;
            });
        }
        
        if (filteredProjects.length === 0) {
            projectsGrid.style.display = 'none';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }
        
        // 显示项目列表
        projectsGrid.style.display = 'grid';
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // 渲染项目列表
        projectsGrid.innerHTML = filteredProjects.map(project => `
            <div class="project-card">
                <img src="${project.image}" alt="${project.title}" class="project-image">
                <div class="project-info">
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-description">${project.description}</p>
                    <div class="project-meta">
                        <span>
                            <i class="bi bi-person"></i> ${project.author}
                        </span>
                        <span>
                            <i class="bi bi-star"></i> ${project.stars}
                        </span>
                        <span>
                            <i class="bi bi-git-fork"></i> ${project.forks}
                        </span>
                    </div>
                    <div class="project-tags">
                        ${project.tags.map(tag => `
                            <span class="project-tag">${tag}</span>
                        `).join('')}
                    </div>
                    <div class="project-actions">
                        <button class="btn btn-primary" onclick="viewProject(${project.id})">
                            <i class="bi bi-eye"></i> 查看详情
                        </button>
                        <button class="btn btn-outline-primary" onclick="forkProject(${project.id})">
                            <i class="bi bi-git-fork"></i> Fork
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('加载项目列表失败:', error);
        projectsGrid.innerHTML = `
            <div class="error-state">
                <i class="bi bi-exclamation-circle"></i>
                <p>加载失败，请重试</p>
            </div>
        `;
    }
}

// 添加视图切换事件
function addViewToggleEvents() {
    const viewButtons = document.querySelectorAll('.view-options .btn');
    const projectsGrid = document.getElementById('projectsGrid');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有活动状态
            viewButtons.forEach(btn => btn.classList.remove('active'));
            
            // 添加当前活动状态
            button.classList.add('active');
            
            // 切换视图
            const view = button.getAttribute('data-view');
            if (view === 'list') {
                projectsGrid.classList.add('list-view');
            } else {
                projectsGrid.classList.remove('list-view');
            }
        });
    });
}

// 添加筛选事件
function addFilterEvents() {
    const applyButton = document.getElementById('applyFilters');
    if (!applyButton) return;
    
    applyButton.addEventListener('click', () => {
        const filters = {
            tech: getSelectedValues('技术栈'),
            difficulty: getSelectedValues('难度等级'),
            type: getSelectedValues('项目类型')
        };
        
        loadProjects(filters);
    });
}

// 获取选中值
function getSelectedValues(groupName) {
    const group = document.querySelector(`.filter-group h4:contains('${groupName}')`).nextElementSibling;
    const checkboxes = group.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

// 添加加载更多事件
function addLoadMoreEvent() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;
    
    loadMoreBtn.addEventListener('click', async () => {
        try {
            // 这里应该调用后端API加载更多项目
            // 目前只是模拟加载
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                加载中...
            `;
            
            // 模拟API调用延迟
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 恢复按钮状态
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = '加载更多';
            
            // 这里应该添加新加载的项目到列表中
            // 目前只是显示提示
            alert('没有更多项目了');
        } catch (error) {
            console.error('加载更多项目失败:', error);
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = '加载更多';
            alert('加载失败，请重试');
        }
    });
}

// 查看项目详情
function viewProject(projectId) {
    // 这里应该跳转到项目详情页面
    console.log('查看项目:', projectId);
    alert('项目详情功能正在开发中...');
}

// Fork项目
function forkProject(projectId) {
    // 这里应该调用后端API进行fork操作
    console.log('Fork项目:', projectId);
    alert('Fork功能正在开发中...');
} 