import { userAPI, contentAPI } from './api.js';

// 初始化全局帖子列表
async function initMockPosts() {
    try {
        // 使用API获取所有帖子
        const data = await contentAPI.getPosts();
        window.mockPosts = data.posts;
    } catch (error) {
        console.error('加载帖子数据失败:', error);
        window.mockPosts = [];
    }
}

// 保存帖子数据
async function savePostsToJson() {
    try {
        // 由于浏览器安全限制，这里只是模拟保存操作
        console.log('保存帖子数据:', window.mockPosts);
    } catch (error) {
        console.error('保存帖子数据失败:', error);
    }
}

// 加载评论数据
async function loadCommentsData(postId) {
    try {
        // 使用API获取评论
        return await contentAPI.getComments(postId);
    } catch (error) {
        console.error('加载评论数据失败:', error);
        return [];
    }
}

// 保存评论数据
async function saveCommentsData(postId, comment) {
    try {
        // 使用API保存评论
        return await contentAPI.addComment(postId, comment);
    } catch (error) {
        console.error('保存评论数据失败:', error);
        throw error;
    }
}

// 加载帖子内容
async function loadPostContent() {
    try {
        const postContent = document.getElementById('postContent');
        if (!postContent) {
            console.error('未找到帖子内容容器');
            return;
        }

        const postId = new URLSearchParams(window.location.search).get('id');
        
        if (!postId) {
            postContent.innerHTML = '<div class="alert alert-danger">未找到帖子</div>';
            return;
        }

        // 从全局帖子列表中查找帖子
        const post = window.mockPosts.find(p => p.id === parseInt(postId));
        if (!post) {
            postContent.innerHTML = '<div class="alert alert-danger">帖子不存在</div>';
            return;
        }

        // 检查是否已经增加过浏览量
        const viewedPosts = JSON.parse(localStorage.getItem('viewedPosts') || '[]');
        if (!viewedPosts.includes(postId)) {
            // 增加浏览量
            post.views++;
            // 记录已浏览的帖子
            viewedPosts.push(postId);
            localStorage.setItem('viewedPosts', JSON.stringify(viewedPosts));
            // 更新帖子数据
            await contentAPI.updatePost(post.id, post);
        }

        // 加载评论数据，用于显示评论数
        const comments = await loadCommentsData(postId);
        const commentCount = comments ? comments.length : 0;

        // 渲染帖子详情
        postContent.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h1 class="card-title">${post.title}</h1>
                    <div class="post-meta text-muted mb-3">
                        <span>作者：${post.author}</span>
                        <span class="mx-2">|</span>
                        <span>日期：${post.date}</span>
                        <span class="mx-2">|</span>
                        <span>分类：${post.category}</span>
                    </div>
                    <div class="post-tags mb-3">
                        ${post.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('')}
                    </div>
                    <div class="post-stats mb-3">
                        <span class="me-3"><i class="bi bi-eye"></i> ${post.views}</span>
                        <span class="me-3"><i class="bi bi-chat"></i> <span id="post-comment-count">${commentCount}</span></span>
                        <span><i class="bi bi-heart"></i> ${post.likes}</span>
                    </div>
                    <div class="post-content">
                        ${post.content}
                    </div>
                </div>
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
        const postCommentCount = document.getElementById('post-comment-count');
        
        if (!commentsList || !commentCount) {
            console.error('未找到评论列表或评论数量元素');
            return;
        }
        
        // 获取帖子ID
        const postId = new URLSearchParams(window.location.search).get('id');
        if (!postId) {
            commentsList.innerHTML = '<div class="text-center text-muted">未找到帖子</div>';
            return;
        }
        
        // 加载评论数据
        const comments = await loadCommentsData(postId);
        
        // 更新评论计数显示
        commentCount.textContent = `${comments.length} 条评论`;
        
        // 同时更新帖子详情中的评论计数
        if (postCommentCount) {
            postCommentCount.textContent = comments.length;
        }
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="text-center text-muted">暂无评论</div>';
            return;
        }
        
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item" data-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <img src="https://placehold.jp/32x32.png" alt="${comment.author}">
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
                                <img src="https://placehold.jp/32x32.png" alt="${newReply.author}">
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

            // 获取帖子ID
            const postId = new URLSearchParams(window.location.search).get('id');
            if (!postId) {
                alert('帖子ID无效');
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

            // 保存评论数据
            const response = await saveCommentsData(postId, newComment);
            
            if (response && response.success) {
                // 更新评论列表
                await loadComments();
                
                // 清空输入框
                textarea.value = '';
                
                // 更新帖子详情中的评论数量显示
                const postCommentCount = document.getElementById('post-comment-count');
                if (postCommentCount) {
                    // 获取最新的评论数据
                    const comments = await loadCommentsData(postId);
                    postCommentCount.textContent = comments.length;
                }
                
                alert('评论发表成功');
            } else {
                alert(response.message || '评论发表失败，请重试');
            }
        } catch (error) {
            console.error('发表评论失败:', error);
            alert('发表评论失败，请重试');
        }
    });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 初始化帖子数据
        await initMockPosts();
        
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