import { userAPI, contentAPI } from './api.js';

// 全局变量
let currentPage = 1;
let currentView = 'grid';
let isLoading = false;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 更新用户状态
        await updateUserStatus();
        
        // 添加视图切换事件
        addViewToggleEvents();
        
        // 添加分类筛选事件
        addCategoryEvents();
        
        // 添加加载更多事件
        addLoadMoreEvent();
        
        // 加载项目列表
        await loadProjects();
        
        // 加载常用项目列表
        await loadCommonProjects();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
});

// 更新用户状态
async function updateUserStatus() {
    try {
        const response = await fetch('/api/user/status');
        const data = await response.json();
        const userSection = document.getElementById('userSection');
        
        if (data.isLoggedIn) {
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
                    <span class="username">${data.username}</span>
                </div>
            `;

            // 添加退出登录事件监听
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        await fetch('/api/user/logout', { method: 'POST' });
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
async function loadProjects() {
    if (isLoading) return;
    isLoading = true;

    try {
        const projectsGrid = document.getElementById('projectsGrid');
        const emptyState = document.getElementById('emptyState');
        
        // 显示加载状态
        if (currentPage === 1) {
            projectsGrid.innerHTML = `
                <div class="loading-placeholder">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">加载中...</span>
                    </div>
                    <p class="mt-2">加载项目中...</p>
                </div>
            `;
        }
        
        // 获取GitHub热门项目
        const response = await fetch(`/api/github/trending?page=${currentPage}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        const projects = data.data;
        
        if (projects.length === 0) {
            if (currentPage === 1) {
                projectsGrid.innerHTML = '';
                emptyState.style.display = 'block';
            }
            return;
        }
        
        // 隐藏空状态
        emptyState.style.display = 'none';
        
        // 渲染项目列表
        const projectsHTML = projects.map(project => `
            <div class="project-card">
                <div class="project-header">
                    <h3 class="project-title">${project.name}</h3>
                    <span class="project-author">${project.owner.login}</span>
                </div>
                <p class="project-description">${project.description || '暂无描述'}</p>
                <div class="project-meta">
                    <span class="project-stars">
                        <i class="bi bi-star"></i> ${project.stargazers_count}
                    </span>
                    <span class="project-forks">
                        <i class="bi bi-git-fork"></i> ${project.forks_count}
                    </span>
                    <span class="project-language">
                        <i class="bi bi-circle-fill"></i> ${project.language || '未知'}
                    </span>
                </div>
                <div class="project-actions">
                    <button class="btn btn-primary btn-sm" onclick="viewProjectDetails('${project.owner.login}', '${project.name}')">
                        <i class="bi bi-eye"></i> 查看详情
                    </button>
                    <a href="${project.html_url}" target="_blank" class="btn btn-outline-primary btn-sm">
                        <i class="bi bi-github"></i> 访问仓库
                    </a>
                </div>
            </div>
        `).join('');
        
        // 更新项目列表
        if (currentPage === 1) {
            projectsGrid.innerHTML = projectsHTML;
        } else {
            projectsGrid.insertAdjacentHTML('beforeend', projectsHTML);
        }
        
    } catch (error) {
        console.error('加载项目列表失败:', error);
        const projectsGrid = document.getElementById('projectsGrid');
        if (projectsGrid) {
            projectsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-exclamation-circle text-danger"></i>
                    <p>加载失败，请重试</p>
                    <button class="btn btn-primary mt-2" onclick="location.reload()">刷新页面</button>
                </div>
            `;
        }
    } finally {
        isLoading = false;
    }
}

// 加载常用项目
async function loadCommonProjects(tech = 'all', type = 'all') {
    try {
        const commonProjectsContainer = document.getElementById('commonProjects');
        
        // 显示加载状态
        commonProjectsContainer.innerHTML = `
            <div class="loading-placeholder">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
                <p class="mt-2">加载项目中...</p>
            </div>
        `;
        
        // 获取GitHub常用项目
        const response = await fetch(`/api/github/common?tech=${tech}&type=${type}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        const projects = data.data;
        
        if (projects.length === 0) {
            commonProjectsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-folder"></i>
                    <p>暂无符合条件的项目</p>
                </div>
            `;
            return;
        }
        
        // 渲染项目列表
        commonProjectsContainer.innerHTML = projects.map(project => `
            <div class="project-card">
                <div class="project-header">
                    <h3 class="project-title">${project.name}</h3>
                    <span class="project-author">${project.owner.login}</span>
                </div>
                <p class="project-description">${project.description || '暂无描述'}</p>
                <div class="project-meta">
                    <span class="project-stars">
                        <i class="bi bi-star"></i> ${project.stargazers_count}
                    </span>
                    <span class="project-forks">
                        <i class="bi bi-git-fork"></i> ${project.forks_count}
                    </span>
                    <span class="project-language">
                        <i class="bi bi-circle-fill"></i> ${project.language || '未知'}
                    </span>
                </div>
                <div class="project-actions">
                    <button class="btn btn-primary btn-sm" onclick="viewProjectDetails('${project.owner.login}', '${project.name}')">
                        <i class="bi bi-eye"></i> 查看详情
                    </button>
                    <a href="${project.html_url}" target="_blank" class="btn btn-outline-primary btn-sm">
                        <i class="bi bi-github"></i> 访问仓库
                    </a>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('加载常用项目列表失败:', error);
        const commonProjectsContainer = document.getElementById('commonProjects');
        commonProjectsContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-circle text-danger"></i>
                <p>加载失败，请重试</p>
                <button class="btn btn-primary mt-2" onclick="location.reload()">刷新页面</button>
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
            currentView = button.getAttribute('data-view');
            if (currentView === 'list') {
                projectsGrid.classList.add('list-view');
            } else {
                projectsGrid.classList.remove('list-view');
            }
        });
    });
}

// 添加分类筛选事件
function addCategoryEvents() {
    // 技术栈筛选
    const techButtons = document.querySelectorAll('[data-tech]');
    techButtons.forEach(button => {
        button.addEventListener('click', () => {
            techButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const tech = button.getAttribute('data-tech');
            const type = document.querySelector('[data-type].active')?.getAttribute('data-type') || 'all';
            
            loadCommonProjects(tech, type);
        });
    });
    
    // 项目类型筛选
    const typeButtons = document.querySelectorAll('[data-type]');
    typeButtons.forEach(button => {
        button.addEventListener('click', () => {
            typeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const type = button.getAttribute('data-type');
            const tech = document.querySelector('[data-tech].active')?.getAttribute('data-tech') || 'all';
            
            loadCommonProjects(tech, type);
        });
    });
    
    // 默认激活"全部"筛选按钮
    document.querySelector('[data-tech="all"]')?.classList.add('active');
    document.querySelector('[data-type="all"]')?.classList.add('active');
}

// 添加加载更多事件
function addLoadMoreEvent() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;
    
    loadMoreBtn.addEventListener('click', async () => {
        try {
            currentPage++;
            await loadProjects();
        } catch (error) {
            console.error('加载更多项目失败:', error);
            alert('加载失败，请重试');
        }
    });
}

// 查看项目详情
window.viewProjectDetails = async function(owner, repo) {
    try {
        const response = await fetch(`/api/github/repo/${owner}/${repo}`);
        const data = await response.json();

        if (data.success) {
            const projectData = data.data;
            const modal = new bootstrap.Modal(document.getElementById('projectModal'));
            
            // 设置基本信息
            document.getElementById('projectModalTitle').textContent = repo;
            document.getElementById('projectDescription').textContent = projectData.info.description || '暂无描述';
            document.getElementById('projectCreated').textContent = new Date(projectData.info.created_at).toLocaleString();
            document.getElementById('projectUpdated').textContent = new Date(projectData.info.updated_at).toLocaleString();
            
            // 设置统计信息
            document.getElementById('projectStars').textContent = projectData.info.stargazers_count;
            document.getElementById('projectForks').textContent = projectData.info.forks_count;
            document.getElementById('projectWatchers').textContent = projectData.info.watchers_count;
            
            // 设置语言信息
            const languagesContainer = document.getElementById('projectLanguages');
            languagesContainer.innerHTML = '';
            
            if (Object.keys(projectData.languages).length === 0) {
                languagesContainer.innerHTML = '<p class="text-muted">暂无语言信息</p>';
            } else {
                const totalBytes = Object.values(projectData.languages).reduce((a, b) => a + b, 0);
                
                Object.entries(projectData.languages).forEach(([lang, bytes]) => {
                    const percentage = ((bytes / totalBytes) * 100).toFixed(1);
                    languagesContainer.innerHTML += `
                        <div class="mb-2">
                            <div class="d-flex justify-content-between">
                                <span>${lang}</span>
                                <span>${percentage}%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar" role="progressbar" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    `;
                });
            }
            
            // 设置贡献者信息
            const contributorsContainer = document.getElementById('projectContributors');
            contributorsContainer.innerHTML = '';
            
            if (projectData.contributors.length === 0) {
                contributorsContainer.innerHTML = '<p class="text-muted">暂无贡献者信息</p>';
            } else {
                projectData.contributors.slice(0, 5).forEach(contributor => {
                    contributorsContainer.innerHTML += `
                        <div class="d-flex align-items-center mb-2">
                            <img src="${contributor.avatar_url}" class="contributor-avatar" alt="${contributor.login}">
                            <span>${contributor.login}</span>
                        </div>
                    `;
                });
            }
            
            modal.show();
        } else {
            alert('获取项目详情失败：' + data.message);
        }
    } catch (error) {
        alert('请求失败：' + error.message);
    }
};