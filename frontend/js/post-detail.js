import { userAPI, contentAPI } from './api.js';

// 处理帖子对象，确保其可以安全发送到后端
function sanitizePostObject(post) {
    if (!post) return {};
    
    // 创建深拷贝以避免修改原始对象
    const sanitizedPost = {...post};
    
    // 处理coverImages字段
    if (sanitizedPost.coverImages) {
        if (!Array.isArray(sanitizedPost.coverImages) || sanitizedPost.coverImages.length === 0) {
            // 移除空数组或非数组的coverImages字段
            delete sanitizedPost.coverImages;
        } else {
            // 确保所有图片URL都是字符串类型并且格式正确
            sanitizedPost.coverImages = sanitizedPost.coverImages
                .filter(url => {
                    // 过滤非字符串、空字符串
                    if (typeof url !== 'string' || url.trim() === '') {
                        return false;
                    }
                    
                    // 检查是否包含HTML标记或其他可能导致错误的内容
                    if (url.includes('</') || url.includes('<div') || url.includes('<p') || 
                        url.includes('</p>') || url.includes('%0A') || url.includes('\\')) {
                        console.warn('检测到无效的图片URL格式:', url.substring(0, 50) + '...');
                        return false;
                    }
                    
                    // 验证data URL的基本格式 - 不再检查长度限制
                    if (url.startsWith('data:image/')) {
                        return true;
                    }
                    
                    // 验证常规URL
                    try {
                        new URL(url);
                        return true;
                    } catch (e) {
                        console.warn('非法URL:', url.substring(0, 50) + '...');
                        return false;
                    }
                })
                .map(url => url.trim())
                .slice(0, 3); // 限制最多3张图片
            
            // 如果过滤后为空数组，删除该字段
            if (sanitizedPost.coverImages.length === 0) {
                delete sanitizedPost.coverImages;
            }
        }
    }
    
    return sanitizedPost;
}

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

        // 开发阶段：每次访问都增加浏览量，不再检查是否已访问过
        post.views++;
        
        // 使用公共函数处理帖子对象
        const updatedPost = sanitizePostObject(post);
        
        // 安全处理：如果帖子内容过长或包含特殊字符，可能导致保存失败
        try {
            // 只更新必要的字段，减少数据量
            const minimalUpdateData = {
                id: updatedPost.id,
                views: updatedPost.views,
                likes: updatedPost.likes,
                favorites: updatedPost.favorites || 0
            };
            
            // 调用更新API并处理可能的错误 
            const updateResult = await contentAPI.updatePost(post.id, minimalUpdateData);
            if (updateResult && updateResult.error) {
                console.warn('更新浏览量失败:', updateResult.message);
                // 继续显示帖子，但不保存浏览量更新
            } else {
                // 浏览量更新成功，继续处理
                console.log('浏览量更新成功');
            }
        } catch (updateError) {
            console.error('更新帖子数据时出错:', updateError);
            // 继续显示帖子，但不保存更新
        }

        // 加载评论数据，用于显示评论数
        const comments = await loadCommentsData(postId);
        const commentCount = comments ? comments.length : 0;

        // 获取当前用户信息
        const userResponse = await userAPI.getStatus();
        let isFavorited = false;
        let isLiked = false;
        
        // 如果用户已登录，检查收藏和点赞状态
        if (userResponse && userResponse.isLoggedIn) {
            const userId = userResponse.userId || userResponse.username;
            
            // 检查收藏状态
            const favoritedPosts = JSON.parse(localStorage.getItem(`userFavorites_posts_${userId}`) || '[]');
            isFavorited = favoritedPosts.includes(postId.toString());
            
            // 检查点赞状态
            const likedPosts = JSON.parse(localStorage.getItem(`userLiked_posts_${userId}`) || '[]');
            isLiked = likedPosts.includes(postId.toString());
        }
        
        const favoriteIconClass = isFavorited ? 'bi-bookmark-fill' : 'bi-bookmark';
        const favoriteButtonClass = isFavorited ? 'favorited' : '';
        const likeIconClass = isLiked ? 'bi-heart-fill' : 'bi-heart';
        const likeButtonClass = isLiked ? 'liked' : '';
        
        // 封面图片轮播HTML
        let coverImagesHTML = '';
        if (post.coverImages && Array.isArray(post.coverImages) && post.coverImages.length > 0) {
            // 直接使用原始图片URLs，避免二次过滤
            try {
                // 复制一份图片URL数组
                const displayImages = [...post.coverImages];
                console.log("初始封面图片数组:", displayImages.length, "张图片");
                console.log("图片URL预览:", displayImages.map(url => url.substring(0, 30) + "..."));
                
                if (displayImages.length > 0) {
                    coverImagesHTML = `
                        <div class="post-cover-images mb-4">
                            <div id="coverImageCarousel" class="carousel slide manual-carousel" data-bs-interval="false" data-bs-pause="hover" data-bs-wrap="true">
                                <div class="carousel-inner">
                                    ${displayImages.map((image, index) => `
                                        <div class="carousel-item ${index === 0 ? 'active' : ''}" data-bs-slide-index="${index}">
                                            <img src="${image}" class="d-block w-100" alt="封面图片 ${index + 1}">
                                        </div>
                                    `).join('')}
                                </div>
                                ${displayImages.length > 1 ? `
                                    <button class="carousel-control-prev" type="button" data-custom-slide="prev" aria-label="上一张">
                                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                                        <span class="visually-hidden">上一张</span>
                                    </button>
                                    <button class="carousel-control-next" type="button" data-custom-slide="next" aria-label="下一张">
                                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                                        <span class="visually-hidden">下一张</span>
                                    </button>
                                    <div class="carousel-indicator">
                                        <span id="current-slide">1</span><span id="total-slides">${displayImages.length}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }
            } catch (e) {
                console.error('处理封面图片时出错:', e);
                // 出错时不显示封面
                coverImagesHTML = '';
            }
        }

        // 渲染帖子详情
        postContent.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h1 class="card-title">${post.title}</h1>
                    <div class="post-meta text-muted mb-3">
                        <span>作者：<a href="profile.html?username=${encodeURIComponent(post.author)}" class="author-link">${post.author}</a></span>
                        <span class="mx-2">|</span>
                        <span>日期：${post.date}</span>
                        <span class="mx-2">|</span>
                        <span>分类：${post.category}</span>
                    </div>
                    <div class="post-tags mb-3">
                        ${post.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('')}
                    </div>
                    
                    ${coverImagesHTML}
                    
                    <div class="post-content">
                        ${formatPostContent(post.content)}
                    </div>
                    <div class="post-actions mt-4">
                        <button type="button" class="like-btn ${likeButtonClass}" data-post-id="${post.id}" data-liked="${isLiked}">
                            <i class="bi ${likeIconClass}"></i> <span class="like-count">${post.likes}</span>
                        </button>
                        <button type="button" class="favorite-btn ${favoriteButtonClass}" data-post-id="${post.id}" data-favorited="${isFavorited}">
                            <i class="bi ${favoriteIconClass}"></i> <span class="favorite-count">${post.favorites || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 添加点赞事件监听
        addPostLikeEvent();
        
        // 添加收藏事件监听
        addPostFavoriteEvent();
        
        // 如果有封面图片轮播，使用自定义轮播逻辑
        if (post.coverImages && Array.isArray(post.coverImages) && post.coverImages.length > 0) {
            try {
                // 获取轮播元素
                const carouselElement = document.getElementById('coverImageCarousel');
                
                // 确保元素存在
                if (!carouselElement) {
                    console.warn('未找到轮播元素，跳过初始化');
                    return;
                }
                
                console.log("开始初始化自定义轮播控制 - 图片数量:", post.coverImages.length);
                
                // 禁用Bootstrap默认的轮播初始化
                carouselElement.setAttribute('data-bs-interval', 'false');
                
                // 轮播项目
                const carouselItems = carouselElement.querySelectorAll('.carousel-item');
                const totalSlides = carouselItems.length;
                
                console.log(`找到 ${totalSlides} 张轮播图片`);
                
                // 当前活动的轮播项索引
                let activeIndex = 0;
                
                // 记录原始图片顺序，用于调试
                const slideOrder = Array.from(carouselItems).map((item, index) => {
                    return {
                        index: index,
                        isActive: item.classList.contains('active'),
                        slideIndex: item.getAttribute('data-bs-slide-index')
                    };
                });
                
                console.log("轮播图初始状态:", slideOrder);
                
                // 自定义导航函数
                function showSlide(index) {
                    // 边界检查
                    if (index < 0) index = totalSlides - 1;
                    if (index >= totalSlides) index = 0;
                    
                    console.log(`切换轮播图：当前=${activeIndex}，目标=${index}，总数=${totalSlides}`);
                    
                    // 移除所有活动类
                    carouselItems.forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // 添加活动类到指定索引
                    carouselItems[index].classList.add('active');
                    
                    // 更新当前活动索引
                    activeIndex = index;
                    
                    // 更新指示器
                    const currentSlideIndicator = document.getElementById('current-slide');
                    if (currentSlideIndicator) {
                        currentSlideIndicator.textContent = (activeIndex + 1).toString();
                    }
                    
                    console.log(`轮播切换完成: 当前活动项=${activeIndex}`);
                }
                
                // 添加上一张/下一张按钮事件
                const prevButton = carouselElement.querySelector('[data-custom-slide="prev"]');
                const nextButton = carouselElement.querySelector('[data-custom-slide="next"]');
                
                if (prevButton) {
                    prevButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("点击了上一张按钮");
                        showSlide(activeIndex - 1);
                    });
                    console.log("已绑定上一张按钮事件");
                }
                
                if (nextButton) {
                    nextButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("点击了下一张按钮");
                        showSlide(activeIndex + 1);
                    });
                    console.log("已绑定下一张按钮事件");
                }
                
                console.log("自定义轮播控制初始化完成");
                
                // 禁用任何可能存在的Bootstrap轮播实例
                if (window.bootstrap && window.bootstrap.Carousel) {
                    try {
                        const bootstrapCarousel = window.bootstrap.Carousel.getInstance(carouselElement);
                        if (bootstrapCarousel) {
                            // 如果存在Bootstrap轮播实例，禁用它
                            console.log("禁用Bootstrap轮播实例");
                            bootstrapCarousel.pause();
                            // 移除data-bs-ride属性
                            carouselElement.removeAttribute('data-bs-ride');
                        }
                    } catch (e) {
                        console.log("没有找到Bootstrap轮播实例:", e);
                    }
                }
            } catch (e) {
                console.warn('初始化自定义轮播控制失败:', e);
            }
        }
    } catch (error) {
        console.error('加载帖子内容失败:', error);
        throw error;
    }
}

// 格式化帖子内容，处理HTML内容
function formatPostContent(content) {
    if (!content) return '';
    
    // 检查内容是否来自富文本编辑器
    if (content.includes('<p>') || content.includes('<div>') || content.includes('<h1>') || content.includes('<h2>') || content.includes('<h3>')) {
        // 富文本内容，直接返回，已经是HTML格式
        return `<div class="rich-text-content">${content}</div>`;
    } else {
        // 旧版markdown格式的内容，需要处理换行和其他格式
        // 处理换行符
        let formattedContent = content.replace(/\n/g, '<br>');
        
        // 处理粗体 **text**
        formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // 处理斜体 *text*
        formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 处理链接 [text](url)
        formattedContent = formattedContent.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // 将处理后的内容包装在rich-text-content类中
        return `<div class="rich-text-content">${formattedContent}</div>`;
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

            const userId = userResponse.userId || userResponse.username;
            const postId = likeBtn.dataset.postId;
            const likeCount = likeBtn.querySelector('.like-count');
            
            // 检查是否已经点赞（使用用户特定的点赞列表）
            const likedPosts = JSON.parse(localStorage.getItem(`userLiked_posts_${userId}`) || '[]');
            const isLiked = likedPosts.includes(postId);
            
            // 更新点赞数
            const currentLikes = parseInt(likeCount.textContent);
            const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;
            likeCount.textContent = newLikes;
            
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
            
            // 保存点赞状态到后端
            const post = window.mockPosts.find(p => p.id === parseInt(postId));
            if (post) {
                post.likes = newLikes;
                
                // 使用公共函数处理帖子对象
                const sanitizedPost = sanitizePostObject(post);
                
                // 调用API并处理错误
                const updateResult = await contentAPI.updatePost(post.id, sanitizedPost);
                if (updateResult && updateResult.error) {
                    console.error('更新点赞状态失败:', updateResult.message);
                    // 由于UI已更新，这里不回滚UI以避免闪烁
                } else {
                    console.log('点赞状态更新成功');
                }
            }
            
            // 保存用户点赞状态（使用用户特定的键）
            if (isLiked) {
                // 移除点赞记录
                const index = likedPosts.indexOf(postId);
                if (index > -1) {
                    likedPosts.splice(index, 1);
                }
            } else {
                // 添加点赞记录
                if (!likedPosts.includes(postId)) {
                    likedPosts.push(postId);
                }
            }
            localStorage.setItem(`userLiked_posts_${userId}`, JSON.stringify(likedPosts));
            
        } catch (error) {
            console.error('点赞失败:', error);
            alert('点赞失败，请重试');
            // 回滚UI状态
            location.reload();
        }
    });
}

// 添加帖子收藏事件
function addPostFavoriteEvent() {
    const favoriteBtn = document.querySelector('.post-actions .favorite-btn');
    if (!favoriteBtn) return;

    favoriteBtn.addEventListener('click', async () => {
        try {
            const userResponse = await userAPI.getStatus();
            if (!userResponse.isLoggedIn) {
                alert('请先登录后再收藏');
                return;
            }

            const userId = userResponse.userId || userResponse.username;
            const postId = favoriteBtn.dataset.postId;
            const favoriteCount = favoriteBtn.querySelector('.favorite-count');
            
            // 检查是否已经收藏 - 使用用户特定的收藏列表
            const favoritedPosts = JSON.parse(localStorage.getItem(`userFavorites_posts_${userId}`) || '[]');
            const isFavorited = favoritedPosts.includes(postId);
            
            // 更新收藏数
            const currentFavorites = parseInt(favoriteCount.textContent);
            const newFavorites = isFavorited ? currentFavorites - 1 : currentFavorites + 1;
            favoriteCount.textContent = newFavorites;
            
            // 更新统计区域的收藏数
            const postFavoriteCount = document.getElementById('post-favorite-count');
            if (postFavoriteCount) {
                postFavoriteCount.textContent = newFavorites;
            }
            
            // 切换收藏状态
            if (isFavorited) {
                favoriteBtn.dataset.favorited = 'false';
                favoriteBtn.classList.remove('favorited');
                favoriteBtn.querySelector('i').classList.replace('bi-bookmark-fill', 'bi-bookmark');
                alert('已取消收藏');
            } else {
                favoriteBtn.dataset.favorited = 'true';
                favoriteBtn.classList.add('favorited');
                favoriteBtn.querySelector('i').classList.replace('bi-bookmark', 'bi-bookmark-fill');
                alert('收藏成功！');
            }
            
            // 保存收藏状态到后端
            const post = window.mockPosts.find(p => p.id === parseInt(postId));
            if (post) {
                post.favorites = newFavorites;
                
                // 使用公共函数处理帖子对象
                const sanitizedPost = sanitizePostObject(post);
                
                // 调用API并处理错误
                const updateResult = await contentAPI.updatePost(post.id, sanitizedPost);
                if (updateResult && updateResult.error) {
                    console.error('更新收藏状态失败:', updateResult.message);
                    // 由于UI已更新，这里不回滚UI以避免闪烁
                } else {
                    console.log('收藏状态更新成功');
                }
            }
            
            // 保存用户收藏状态 - 使用用户特定的键
            if (isFavorited) {
                // 移除收藏记录
                const index = favoritedPosts.indexOf(postId);
                if (index > -1) {
                    favoritedPosts.splice(index, 1);
                }
            } else {
                // 添加收藏记录
                if (!favoritedPosts.includes(postId)) {
                    favoritedPosts.push(postId);
                }
            }
            localStorage.setItem(`userFavorites_posts_${userId}`, JSON.stringify(favoritedPosts));
            
        } catch (error) {
            console.error('收藏操作失败:', error);
            alert('收藏操作失败，请重试');
            // 回滚UI状态
            location.reload();
        }
    });
}

// 修改loadComments函数
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
        
        // 获取当前用户信息以检查点赞状态
        const userResponse = await userAPI.getStatus();
        let likedComments = [];
        
        if (userResponse && userResponse.isLoggedIn) {
            const userId = userResponse.userId || userResponse.username;
            likedComments = JSON.parse(localStorage.getItem(`userLiked_comments_${userId}`) || '[]');
        }
        
        commentsList.innerHTML = comments.map(comment => {
            const isLiked = likedComments.includes(comment.id.toString());
            const likedClass = isLiked ? 'liked' : '';
            const likeIcon = isLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up';
            
            // 生成回复HTML
            let repliesHTML = '';
            if (comment.replies && comment.replies.length > 0) {
                repliesHTML = `
                    <div class="replies">
                        ${comment.replies.map(reply => `
                            <div class="reply-item">
                                <div class="reply-header">
                                    <div class="reply-author">
                                        <a href="profile.html?username=${encodeURIComponent(reply.author)}">
                                            <img src="https://placehold.jp/32x32.png" alt="${reply.author}">
                                        </a>
                                        <a href="profile.html?username=${encodeURIComponent(reply.author)}" class="author-name">
                                            ${reply.author}
                                        </a>
                                    </div>
                                    <span class="reply-time">${reply.date}</span>
                                </div>
                                <div class="reply-content">${reply.content}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            return `
                <div class="comment-item" data-id="${comment.id}" data-liked="${isLiked}">
                    <div class="comment-header">
                        <div class="comment-author">
                            <a href="profile.html?username=${encodeURIComponent(comment.author)}">
                                <img src="https://placehold.jp/32x32.png" alt="${comment.author}">
                            </a>
                            <a href="profile.html?username=${encodeURIComponent(comment.author)}" class="author-name">
                                ${comment.author}
                            </a>
                        </div>
                        <span class="comment-time">${comment.date}</span>
                    </div>
                    <div class="comment-content">${comment.content}</div>
                    <div class="comment-actions">
                        <button type="button" class="reply-btn" data-comment-id="${comment.id}">
                            <i class="bi bi-reply"></i> 回复
                        </button>
                        <button type="button" class="like-btn ${likedClass}" data-comment-id="${comment.id}">
                            <i class="bi ${likeIcon}"></i>
                            <span class="like-count">${comment.likes}</span>
                        </button>
                    </div>
                    <div class="reply-form" style="display: none;">
                        <textarea placeholder="回复 ${comment.author}..."></textarea>
                        <div class="reply-actions">
                            <button type="button" class="submit-reply btn btn-primary btn-sm">发表回复</button>
                            <button type="button" class="cancel-reply btn btn-light btn-sm">取消</button>
                        </div>
                    </div>
                    ${repliesHTML}
                </div>
            `;
        }).join('');

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

                const userId = userResponse.userId || userResponse.username;
                const commentItem = btn.closest('.comment-item');
                if (!commentItem) return;
                
                const commentId = btn.dataset.commentId;
                const likeCount = btn.querySelector('.like-count');
                if (!likeCount) return;
                
                // 使用用户特定的点赞记录
                const likedComments = JSON.parse(localStorage.getItem(`userLiked_comments_${userId}`) || '[]');
                const isLiked = likedComments.includes(commentId);
                
                // 更新点赞数
                const currentLikes = parseInt(likeCount.textContent);
                const newLikes = isLiked ? currentLikes - 1 : currentLikes + 1;
                likeCount.textContent = newLikes;
                
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
                
                // 保存点赞状态到后端
                const postId = new URLSearchParams(window.location.search).get('id');
                const post = window.mockPosts.find(p => p.id === parseInt(postId));
                if (post && post.comments) {
                    const comment = post.comments.find(c => c.id === parseInt(commentId));
                    if (comment) {
                        comment.likes = newLikes;
                        await contentAPI.updatePost(post.id, post);
                    }
                }
                
                // 保存用户点赞状态（使用用户特定的键）
                if (isLiked) {
                    // 移除点赞记录
                    const index = likedComments.indexOf(commentId);
                    if (index > -1) {
                        likedComments.splice(index, 1);
                    }
                } else {
                    // 添加点赞记录
                    if (!likedComments.includes(commentId)) {
                        likedComments.push(commentId);
                    }
                }
                localStorage.setItem(`userLiked_comments_${userId}`, JSON.stringify(likedComments));
                
            } catch (error) {
                console.error('点赞失败:', error);
                alert('点赞失败，请重试');
                // 回滚UI状态
                location.reload();
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

                // 获取帖子ID
                const postId = new URLSearchParams(window.location.search).get('id');
                if (!postId) {
                    alert('帖子ID无效');
                    return;
                }
                
                // 获取评论ID
                const commentItem = replyForm.closest('.comment-item');
                const commentId = commentItem.dataset.id;
                if (!commentId) {
                    alert('评论ID无效');
                    return;
                }
                
                // 准备回复内容
                const finalContent = content;
                
                // 创建新回复
                const newReply = {
                    id: Date.now(),
                    author: userResponse.username,
                    content: finalContent,
                    date: new Date().toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    likes: 0
                };

                // 获取当前帖子数据
                const post = window.mockPosts.find(p => p.id === parseInt(postId));
                if (!post) {
                    alert('无法获取帖子数据');
                    return;
                }
                
                // 获取评论数据
                let comments = await loadCommentsData(postId);
                const comment = comments.find(c => c.id.toString() === commentId.toString());
                
                if (!comment) {
                    alert('无法获取评论数据');
                    return;
                }
                
                // 将回复添加到评论的replies数组中
                if (!comment.replies) {
                    comment.replies = [];
                }
                comment.replies.push(newReply);
                
                // 更新评论数据
                const updateResult = await contentAPI.updateComment(postId, commentId, comment);
                
                if (updateResult && updateResult.success) {
                    // 添加回复到评论下方
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
                                    <a href="profile.html?username=${encodeURIComponent(newReply.author)}">
                                        <img src="https://placehold.jp/32x32.png" alt="${newReply.author}">
                                    </a>
                                    <a href="profile.html?username=${encodeURIComponent(newReply.author)}" class="author-name">
                                        ${newReply.author}
                                    </a>
                                </div>
                                <span class="reply-time">${newReply.date}</span>
                            </div>
                            <div class="reply-content">${newReply.content}</div>
                        </div>
                    `;

                    // 清空并隐藏回复框
                    textarea.value = '';
                    replyForm.style.display = 'none';
                    
                    alert('回复成功');
                } else {
                    alert(updateResult.message || '回复失败，请重试');
                }
            } catch (error) {
                console.error('回复失败:', error);
                alert('回复失败，请重试');
            }
        });
    });
}

// 替换评论提交事件函数
function addCommentSubmitEvent() {
    const submitBtn = document.getElementById('submitComment');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async () => {
        const textarea = document.querySelector('.comment-input textarea');
        const content = textarea.value.trim();
        const imagePreview = document.getElementById('commentImagePreview');
        const imageElement = imagePreview ? imagePreview.querySelector('img') : null;
        
        // 检查是否有内容或图片
        if (!content && !imageElement) {
            alert('请输入评论内容或上传图片');
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

            // 准备评论内容，如果有图片则添加到内容中
            let finalContent = content;
            if (imageElement) {
                const imageDataUrl = imageElement.src;
                // 在文本内容后添加图片HTML
                finalContent += `<div class="comment-image"><img src="${imageDataUrl}" alt="评论图片"></div>`;
            }

            // 创建新评论对象
            const newComment = {
                id: Date.now(),
                author: userResponse.username,
                content: finalContent,
                date: new Date().toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                likes: 0,
                likedBy: [],
                replies: [] // 添加replies数组，用于存储回复
            };

            // 保存评论数据
            const response = await saveCommentsData(postId, newComment);
            
            if (response && response.success) {
                // 更新评论列表
                await loadComments();
                
                // 清空输入框和图片预览
                textarea.value = '';
                if (imagePreview) {
                    imagePreview.innerHTML = '';
                }
                
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

        // 初始化评论图片上传功能
        initCommentImageUpload();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
});

// 初始化评论图片上传功能
function initCommentImageUpload() {
    const uploadButton = document.getElementById('uploadCommentImage');
    const fileInput = document.getElementById('commentImageUpload');
    const imagePreview = document.getElementById('commentImagePreview');
    
    if (!uploadButton || !fileInput || !imagePreview) {
        console.warn('未找到评论图片上传元素');
        return;
    }
    
    // 点击"添加图片"按钮时触发文件选择
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 选择文件后处理图片预览
    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }
        
        // 检查文件大小（限制为2MB）
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            alert('图片大小不能超过2MB');
            fileInput.value = ''; // 清空文件输入
            return;
        }
        
        // 读取文件并生成预览
        const reader = new FileReader();
        reader.onload = function(e) {
            // 创建预览元素
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="图片预览">
                <div class="remove-image">×</div>
            `;
            
            // 添加移除图片事件
            const removeButton = previewItem.querySelector('.remove-image');
            removeButton.addEventListener('click', () => {
                previewItem.remove();
                fileInput.value = ''; // 清空文件输入
            });
            
            // 清除之前的预览 (主评论每次只允许一张图片)
            imagePreview.innerHTML = '';
            
            // 添加新预览
            imagePreview.appendChild(previewItem);
        };
        
        reader.readAsDataURL(file);
    });
    
    // 处理图片移除事件（使用事件委托）
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-image') || 
            e.target.closest('.remove-image')) {
            const previewItem = e.target.closest('.preview-item');
            if (previewItem) {
                previewItem.remove();
                if (fileInput) {
                    fileInput.value = ''; // 清空文件输入
                }
            }
        }
    });
} 