import { userAPI, contentAPI } from './api.js';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 更新用户状态
        await updateUserStatus();
        
        // 加载帖子内容
        await loadPostContent();
        
        // 加载评论列表
        await loadComments();
        
        // 添加评论提交事件
        addCommentSubmitEvent();
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
        const commentInput = document.getElementById('commentInput');
        
        if (response.isLoggedIn) {
            userSection.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-link dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle"></i> ${response.username}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="profile.html">个人中心</a></li>
                        <li><a class="dropdown-item" href="favorites.html">我的收藏</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" id="logoutBtn">退出登录</a></li>
                    </ul>
                </div>
            `;

            // 添加退出登录事件
            document.getElementById('logoutBtn').addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await userAPI.logout();
                    window.location.reload();
                } catch (error) {
                    console.error('退出登录失败:', error);
                    alert('退出登录失败，请重试');
                }
            });
        } else {
            userSection.innerHTML = `
                <a href="login.html" class="btn btn-outline-primary me-2">登录</a>
                <a href="register.html" class="btn btn-primary">注册</a>
            `;
            // 未登录用户隐藏评论输入框
            if (commentInput) {
                commentInput.innerHTML = `
                    <div class="alert alert-info">
                        请<a href="login.html">登录</a>后发表评论
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('获取用户状态失败:', error);
    }
}

// 加载帖子内容
async function loadPostContent() {
    try {
        const postContent = document.getElementById('postContent');
        const postId = new URLSearchParams(window.location.search).get('id');
        
        if (!postId) {
            postContent.innerHTML = '<div class="alert alert-danger">未找到帖子</div>';
            return;
        }

        // 模拟获取帖子内容
        const post = {
            id: postId,
            title: 'Python学习经验分享',
            author: '张三',
            date: '2024-03-15',
            views: 256,
            likes: 0,
            likedBy: [],
            content: `
                <p>最近在学习Python，分享一下我的学习经验。</p>
                <p>首先，我建议从Python的基础语法开始学习，包括变量、数据类型、控制流等基本概念。</p>
                <p>然后可以学习函数、模块、面向对象编程等进阶内容。</p>
                <p>最后，通过实际项目来巩固所学知识，比如开发一个简单的Web应用或者数据分析项目。</p>
            `
        };

        postContent.innerHTML = `
            <div class="post-header">
                <h1 class="post-title">${post.title}</h1>
                <div class="post-meta">
                    <div class="post-author">
                        <img src="https://via.placeholder.com/32" alt="${post.author}">
                        <span>${post.author}</span>
                    </div>
                    <span>${post.date}</span>
                    <span><i class="bi bi-eye"></i> ${post.views}</span>
                </div>
            </div>
            <div class="post-body">
                ${post.content}
            </div>
            <div class="post-actions">
                <button type="button" class="like-btn" data-post-id="${post.id}">
                    <i class="bi bi-hand-thumbs-up"></i>
                    <span class="like-count">${post.likes}</span>
                    <span>点赞</span>
                </button>
                <button type="button">
                    <i class="bi bi-bookmark"></i>
                    <span>收藏</span>
                </button>
                <button type="button">
                    <i class="bi bi-share"></i>
                    <span>分享</span>
                </button>
            </div>
        `;

        // 添加点赞事件监听
        addPostLikeEvent();
    } catch (error) {
        console.error('加载帖子内容失败:', error);
        throw error;
    }
}

// 添加帖子点赞事件
function addPostLikeEvent() {
    const likeBtn = document.querySelector('.post-actions .like-btn');
    if (!likeBtn) return;

    likeBtn.addEventListener('click', async () => {
        try {
            const userResponse = await userAPI.getStatus();
            if (!userResponse.isLoggedIn) {
                alert('请先登录后再点赞');
                return;
            }

            const postId = likeBtn.dataset.postId;
            const likeCount = likeBtn.querySelector('.like-count');
            
            // 检查是否已经点赞
            const isLiked = likeBtn.dataset.liked === 'true';
            
            // 更新点赞数
            const currentLikes = parseInt(likeCount.textContent);
            likeCount.textContent = isLiked ? currentLikes - 1 : currentLikes + 1;
            
            // 切换点赞状态
            if (isLiked) {
                likeBtn.dataset.liked = 'false';
                likeBtn.classList.remove('liked');
                alert('已取消点赞');
            } else {
                likeBtn.dataset.liked = 'true';
                likeBtn.classList.add('liked');
                alert('点赞成功！');
            }
            
            // 模拟保存点赞状态
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('点赞失败:', error);
            alert('点赞失败，请重试');
        }
    });
}

// 加载评论列表
async function loadComments() {
    try {
        const commentsList = document.getElementById('commentsList');
        const commentCount = document.getElementById('commentCount');
        
        // 模拟评论数据
        const comments = [
            {
                id: 1,
                author: '李四',
                content: '感谢分享，对我很有帮助！',
                date: '2024-03-15 14:30',
                likes: 5,
                likedBy: []
            },
            {
                id: 2,
                author: '王五',
                content: '我也在学习Python，可以一起交流。',
                date: '2024-03-15 15:45',
                likes: 3,
                likedBy: []
            }
        ];

        commentCount.textContent = `${comments.length} 条评论`;
        
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item" data-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <img src="https://via.placeholder.com/32" alt="${comment.author}">
                        <span>${comment.author}</span>
                    </div>
                    <span class="comment-time">${comment.date}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
                <div class="comment-actions">
                    <button type="button" class="reply-btn" data-comment-id="${comment.id}">
                        <i class="bi bi-reply"></i> 回复
                    </button>
                    <button type="button" class="like-btn" data-comment-id="${comment.id}">
                        <i class="bi bi-hand-thumbs-up"></i>
                        <span class="like-count">${comment.likes}</span>
                    </button>
                </div>
                <div class="reply-form" style="display: none;">
                    <textarea placeholder="回复 ${comment.author}..."></textarea>
                    <button type="button" class="submit-reply">发表回复</button>
                    <button type="button" class="cancel-reply">取消</button>
                </div>
            </div>
        `).join('');

        // 添加点赞和回复事件
        addCommentActions();
    } catch (error) {
        console.error('加载评论失败:', error);
        throw error;
    }
}

// 添加评论操作事件
function addCommentActions() {
    // 点赞功能
    document.querySelectorAll('.comment-item .like-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                const userResponse = await userAPI.getStatus();
                if (!userResponse.isLoggedIn) {
                    alert('请先登录后再点赞');
                    return;
                }

                const commentItem = btn.closest('.comment-item');
                if (!commentItem) return;

                const likeCount = btn.querySelector('.like-count');
                if (!likeCount) return;

                // 检查是否已经点赞
                const isLiked = commentItem.dataset.liked === 'true';
                
                // 更新点赞数
                const currentLikes = parseInt(likeCount.textContent);
                likeCount.textContent = isLiked ? currentLikes - 1 : currentLikes + 1;
                
                // 切换点赞状态
                if (isLiked) {
                    commentItem.dataset.liked = 'false';
                    btn.classList.remove('liked');
                    alert('已取消点赞');
                } else {
                    commentItem.dataset.liked = 'true';
                    btn.classList.add('liked');
                    alert('点赞成功！');
                }
                
                // 模拟保存点赞状态
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error('点赞失败:', error);
                alert('点赞失败，请重试');
            }
        });
    });

    // 回复功能
    document.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const commentId = btn.dataset.commentId;
            const replyForm = btn.closest('.comment-item').querySelector('.reply-form');
            replyForm.style.display = 'block';
        });
    });

    // 取消回复
    document.querySelectorAll('.cancel-reply').forEach(btn => {
        btn.addEventListener('click', () => {
            const replyForm = btn.closest('.reply-form');
            replyForm.style.display = 'none';
            replyForm.querySelector('textarea').value = '';
        });
    });

    // 提交回复
    document.querySelectorAll('.submit-reply').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                const userResponse = await userAPI.getStatus();
                if (!userResponse.isLoggedIn) {
                    alert('请先登录后再回复');
                    return;
                }

                const replyForm = btn.closest('.reply-form');
                const textarea = replyForm.querySelector('textarea');
                const content = textarea.value.trim();

                if (!content) {
                    alert('请输入回复内容');
                    return;
                }

                // 模拟提交回复
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // 创建新回复
                const newReply = {
                    id: Date.now(),
                    author: userResponse.username,
                    content: content,
                    date: new Date().toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                };

                // 添加回复到评论下方
                const commentItem = replyForm.closest('.comment-item');
                const repliesContainer = commentItem.querySelector('.replies') || 
                    (() => {
                        const container = document.createElement('div');
                        container.className = 'replies';
                        commentItem.appendChild(container);
                        return container;
                    })();

                repliesContainer.innerHTML += `
                    <div class="reply-item">
                        <div class="reply-header">
                            <div class="reply-author">
                                <img src="https://via.placeholder.com/32" alt="${newReply.author}">
                                <span>${newReply.author}</span>
                            </div>
                            <span class="reply-time">${newReply.date}</span>
                        </div>
                        <div class="reply-content">${newReply.content}</div>
                    </div>
                `;

                // 清空并隐藏回复框
                textarea.value = '';
                replyForm.style.display = 'none';
            } catch (error) {
                console.error('回复失败:', error);
                alert('回复失败，请重试');
            }
        });
    });
}

// 添加评论提交事件
function addCommentSubmitEvent() {
    const submitBtn = document.getElementById('submitComment');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async () => {
        const textarea = document.querySelector('.comment-input textarea');
        const content = textarea.value.trim();

        if (!content) {
            alert('请输入评论内容');
            return;
        }

        try {
            // 获取当前用户信息
            const userResponse = await userAPI.getStatus();
            if (!userResponse.isLoggedIn) {
                alert('请先登录');
                return;
            }

            // 创建新评论对象
            const newComment = {
                id: Date.now(),
                author: userResponse.username,
                content: content,
                date: new Date().toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                likes: 0,
                likedBy: []
            };

            // 获取现有评论列表
            const commentsList = document.getElementById('commentsList');
            const existingComments = Array.from(commentsList.children).map(comment => ({
                id: comment.dataset.id,
                author: comment.querySelector('.comment-author span').textContent,
                content: comment.querySelector('.comment-content').textContent,
                date: comment.querySelector('.comment-time').textContent,
                likes: parseInt(comment.querySelector('.like-count').textContent),
                likedBy: comment.dataset.liked === 'true' ? [userResponse.username] : []
            }));

            // 将新评论添加到列表开头
            existingComments.unshift(newComment);

            // 更新评论数量
            const commentCount = document.getElementById('commentCount');
            commentCount.textContent = existingComments.length;

            // 重新渲染评论列表
            commentsList.innerHTML = existingComments.map(comment => `
                <div class="comment-item" data-id="${comment.id}" ${comment.likedBy.includes(userResponse.username) ? 'data-liked="true"' : ''}>
                    <div class="comment-header">
                        <div class="comment-author">
                            <img src="https://via.placeholder.com/32" alt="${comment.author}">
                            <span>${comment.author}</span>
                        </div>
                        <span class="comment-time">${comment.date}</span>
                    </div>
                    <div class="comment-content">${comment.content}</div>
                    <div class="comment-actions">
                        <button type="button" class="reply-btn" data-comment-id="${comment.id}">
                            <i class="bi bi-reply"></i> 回复
                        </button>
                        <button type="button" class="like-btn ${comment.likedBy.includes(userResponse.username) ? 'liked' : ''}" data-comment-id="${comment.id}">
                            <i class="bi bi-hand-thumbs-up"></i>
                            <span class="like-count">${comment.likes}</span>
                        </button>
                    </div>
                    <div class="reply-form" style="display: none;">
                        <textarea placeholder="回复 ${comment.author}..."></textarea>
                        <button type="button" class="submit-reply">发表回复</button>
                        <button type="button" class="cancel-reply">取消</button>
                    </div>
                </div>
            `).join('');
            
            // 清空输入框
            textarea.value = '';
            
            // 重新添加事件监听
            addCommentActions();
            
            alert('评论发表成功');
        } catch (error) {
            console.error('发表评论失败:', error);
            alert('发表评论失败，请重试');
        }
    });
} 