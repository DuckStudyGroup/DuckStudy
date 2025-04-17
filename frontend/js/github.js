// 全局变量
let currentUsername = '';
let currentRepos = [];

// 搜索用户
async function searchUser() {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        alert('请输入GitHub用户名');
        return;
    }

    try {
        const response = await fetch(`/api/github/user/${username}/repos`);
        const data = await response.json();

        if (data.success) {
            currentUsername = username;
            currentRepos = data.data;
            displayRepos(currentRepos);
        } else {
            alert('获取仓库列表失败：' + data.message);
        }
    } catch (error) {
        alert('请求失败：' + error.message);
    }
}

// 显示仓库列表
function displayRepos(repos) {
    const container = document.getElementById('repos-container');
    const list = document.getElementById('repos-list');
    
    container.style.display = 'block';
    list.innerHTML = '';

    repos.forEach(repo => {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-3';
        card.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${repo.name}</h5>
                    <p class="card-text">${repo.description || '暂无描述'}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-primary">${repo.language || '未知'}</span>
                        <button class="btn btn-sm btn-outline-primary" 
                                onclick="showRepoDetails('${repo.owner.login}', '${repo.name}')">
                            查看详情
                        </button>
                    </div>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

// 显示仓库详情
async function showRepoDetails(owner, repo) {
    try {
        const response = await fetch(`/api/github/repo/${owner}/${repo}`);
        const data = await response.json();

        if (data.success) {
            const repoData = data.data;
            const modal = new bootstrap.Modal(document.getElementById('repoModal'));
            
            // 设置基本信息
            document.getElementById('repoModalTitle').textContent = repo;
            document.getElementById('repoDescription').textContent = repoData.info.description || '暂无描述';
            document.getElementById('repoCreated').textContent = new Date(repoData.info.created_at).toLocaleString();
            document.getElementById('repoUpdated').textContent = new Date(repoData.info.updated_at).toLocaleString();
            
            // 设置统计信息
            document.getElementById('repoStars').textContent = repoData.info.stargazers_count;
            document.getElementById('repoForks').textContent = repoData.info.forks_count;
            document.getElementById('repoWatchers').textContent = repoData.info.watchers_count;
            
            // 设置语言信息
            const languagesContainer = document.getElementById('repoLanguages');
            languagesContainer.innerHTML = '';
            const totalBytes = Object.values(repoData.languages).reduce((a, b) => a + b, 0);
            
            Object.entries(repoData.languages).forEach(([lang, bytes]) => {
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
            
            // 设置贡献者信息
            const contributorsContainer = document.getElementById('repoContributors');
            contributorsContainer.innerHTML = '';
            repoData.contributors.slice(0, 5).forEach(contributor => {
                contributorsContainer.innerHTML += `
                    <div class="d-flex align-items-center mb-2">
                        <img src="${contributor.avatar_url}" class="rounded-circle me-2" width="32" height="32">
                        <span>${contributor.login}</span>
                    </div>
                `;
            });
            
            modal.show();
        } else {
            alert('获取仓库详情失败：' + data.message);
        }
    } catch (error) {
        alert('请求失败：' + error.message);
    }
} 