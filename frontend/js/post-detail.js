import { userAPI, contentAPI, uploadAPI } from './api.js';
import { initNavbar, isDefaultAvatar, renderAvatar } from './nav-utils.js';

// 处理头像URL
function getAvatarUrl(avatarPath) {
    if (!avatarPath) return 'https://placehold.jp/100x100.png';
    
    // 如果是BASE_URL变量未定义，则定义一个
    const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? `http://${window.location.hostname}:5000` 
    : window.location.origin;
    
    return avatarPath.startsWith('http') ? avatarPath : BASE_URL + avatarPath;
}

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
    
    // 确保点赞和收藏数组格式正确
    if (sanitizedPost.likedBy && !Array.isArray(sanitizedPost.likedBy)) {
        sanitizedPost.likedBy = [];
    }
    
    if (sanitizedPost.favoritedBy && !Array.isArray(sanitizedPost.favoritedBy)) {
        sanitizedPost.favoritedBy = [];
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

// 当前排序状态
let currentSortOrder = 'desc';

// 加载评论数据
async function loadCommentsData(postId) {
    try {
        // 使用API获取评论，添加排序参数
        const response = await fetch(`/api/comments/${postId}?sort=${currentSortOrder}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || '加载评论失败');
        }
        
        return data.comments;
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

// 记录浏览历史
function addToViewHistory(post) {
    try {
        // 从localStorage获取历史记录
        const history = JSON.parse(localStorage.getItem('viewHistory') || '[]');
        
        // 创建新的历史记录项
        const historyItem = {
            id: post.id,
            title: post.title,
            timestamp: Date.now()
        };
        
        // 检查是否已存在相同帖子的记录
        const existingIndex = history.findIndex(item => item.id === post.id);
        if (existingIndex !== -1) {
            // 如果存在，更新时间戳
            history[existingIndex].timestamp = historyItem.timestamp;
        } else {
            // 如果不存在，添加新记录
            history.push(historyItem);
        }
        
        // 限制历史记录数量为50条
        if (history.length > 50) {
            history.sort((a, b) => b.timestamp - a.timestamp);
            history.splice(50);
        }
        
        // 保存更新后的历史记录
        localStorage.setItem('viewHistory', JSON.stringify(history));
    } catch (error) {
        console.error('记录浏览历史失败:', error);
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

        // 记录浏览历史
        addToViewHistory(post);

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
            const username = userResponse.username;
            
            // 检查点赞状态 - 使用likedBy数组
            if (!post.likedBy) {
                post.likedBy = [];
            }
            isLiked = post.likedBy.includes(username);
            
            // 检查收藏状态 - 使用favoritedBy数组
            if (!post.favoritedBy) {
                post.favoritedBy = [];
            }
            isFavorited = post.favoritedBy.includes(username);
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
                                            <img src="${image.startsWith('http') ? image : (window.location.origin + image)}" class="d-block w-100" alt="封面图片 ${index + 1}">
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
                    <div class="post-header">
                        <div class="author-info">
                            <a href="profile.html?username=${encodeURIComponent(post.author)}" class="avatar">
                                ${renderAvatar(post.authorAvatar)}
                            </a>
                            <div class="author-meta">
                                <a href="profile.html?username=${encodeURIComponent(post.author)}" class="author-name">${post.author}</a>
                                <span class="post-time">${post.date}</span>
                            </div>
                        </div>
                        <h1 class="post-title">${post.title}</h1>
                    </div>
                    ${coverImagesHTML}
                    <div class="post-content">${formatPostContent(post.content)}</div>
                    <div class="post-footer" data-post-id="${post.id}">
                        <div class="post-stats">
                            <span class="views"><i class="bi bi-eye"></i> ${post.views || 0}</span>
                            <span class="likes"><i class="bi bi-heart${isLiked ? '-fill' : ''}" data-action="like"></i> ${post.likes || 0}</span>
                            <span class="comments"><i class="bi bi-chat"></i> ${commentCount}</span>
                            <span class="favorites"><i class="bi bi-bookmark${isFavorited ? '-fill' : ''}" data-action="favorite"></i> <span class="favorites-count">${post.favorites || 0}</span></span>
                        </div>
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
    const likeBtn = document.querySelector('.likes i[data-action="like"]');
    if (!likeBtn) return;

    likeBtn.addEventListener('click', async () => {
        try {
            const userResponse = await userAPI.getStatus();
            if (!userResponse.isLoggedIn) {
                alert('请先登录后再点赞');
                return;
            }

            const username = userResponse.username;
            const postFooter = likeBtn.closest('.post-footer');
            const postId = parseInt(postFooter.dataset.postId);
            const likeCount = postFooter.querySelector('.likes-count');
            
            // 获取帖子数据
            const post = window.mockPosts.find(p => p.id === postId);
            if (!post) {
                alert('无法获取帖子数据');
                return;
            }

            // 确保likedBy数组存在
            if (!post.likedBy) {
                post.likedBy = [];
            }

            // 检查用户是否已点赞
            const userIndex = post.likedBy.indexOf(username);
            const isLiked = userIndex !== -1;

            // 更新点赞数和likedBy数组
            if (isLiked) {
                // 取消点赞
                post.likes = Math.max(0, (post.likes || 0) - 1);
                post.likedBy.splice(userIndex, 1);
                
                // 更新UI
                likeCount.textContent = post.likes;
                likeBtn.classList.remove('bi-heart-fill');
                likeBtn.classList.add('bi-heart');
            } else {
                // 添加点赞
                post.likes = (post.likes || 0) + 1;
                post.likedBy.push(username);
                
                // 更新UI
                likeCount.textContent = post.likes;
                likeBtn.classList.remove('bi-heart');
                likeBtn.classList.add('bi-heart-fill');
            }

            // 更新帖子数据
            const sanitizedPost = sanitizePostObject(post);
            const updateResult = await contentAPI.updatePost(post.id, sanitizedPost);
            if (updateResult && updateResult.error) {
                console.error('更新点赞状态失败:', updateResult.message);
                await loadPostContent();
            }
        } catch (error) {
            console.error('点赞操作失败:', error);
            await loadPostContent();
        }
    });
}

// 添加帖子收藏事件
function addPostFavoriteEvent() {
    const favoriteBtn = document.querySelector('.favorites i[data-action="favorite"]');
    if (!favoriteBtn) return;

    favoriteBtn.addEventListener('click', async () => {
        try {
            const userResponse = await userAPI.getStatus();
            if (!userResponse.isLoggedIn) {
                alert('请先登录后再收藏');
                return;
            }

            const username = userResponse.username;
            const postFooter = favoriteBtn.closest('.post-footer');
            const postId = parseInt(postFooter.dataset.postId);
            const favoriteCount = postFooter.querySelector('.favorites-count');
            
            // 获取帖子数据
            const post = window.mockPosts.find(p => p.id === postId);
            if (!post) {
                alert('无法获取帖子数据');
                return;
            }

            // 确保favoritedBy数组存在
            if (!post.favoritedBy) {
                post.favoritedBy = [];
            }

            // 检查用户是否已收藏
            const userIndex = post.favoritedBy.indexOf(username);
            const isFavorited = userIndex !== -1;

            // 更新收藏数和favoritedBy数组
            if (isFavorited) {
                // 取消收藏
                post.favorites = Math.max(0, (post.favorites || 0) - 1);
                post.favoritedBy.splice(userIndex, 1);
                
                // 更新UI
                favoriteCount.textContent = post.favorites;
                favoriteBtn.classList.remove('bi-bookmark-fill');
                favoriteBtn.classList.add('bi-bookmark');
                
                // 更新本地存储
                const favoritedPostIds = JSON.parse(localStorage.getItem(`userFavorites_posts_${username}`) || '[]');
                const updatedFavorites = favoritedPostIds.filter(id => id !== post.id.toString());
                localStorage.setItem(`userFavorites_posts_${username}`, JSON.stringify(updatedFavorites));
                
                alert('已取消收藏');
            } else {
                // 添加收藏
                post.favorites = (post.favorites || 0) + 1;
                post.favoritedBy.push(username);
                
                // 更新UI
                favoriteCount.textContent = post.favorites;
                favoriteBtn.classList.remove('bi-bookmark');
                favoriteBtn.classList.add('bi-bookmark-fill');
                
                // 更新本地存储
                const favoritedPostIds = JSON.parse(localStorage.getItem(`userFavorites_posts_${username}`) || '[]');
                if (!favoritedPostIds.includes(post.id.toString())) {
                    favoritedPostIds.push(post.id.toString());
                    localStorage.setItem(`userFavorites_posts_${username}`, JSON.stringify(favoritedPostIds));
                }
                
                alert('收藏成功！');
            }

            // 更新帖子数据
            const sanitizedPost = sanitizePostObject(post);
            const updateResult = await contentAPI.updatePost(post.id, sanitizedPost);
            if (updateResult && updateResult.error) {
                console.error('更新收藏状态失败:', updateResult.message);
                await loadPostContent();
            }
        } catch (error) {
            console.error('收藏操作失败:', error);
            alert('收藏操作失败，请重试');
            await loadPostContent();
        }
    });
}

// 更新排序按钮状态
function updateSortButton() {
    const sortBtn = document.getElementById('sortCommentsBtn');
    if (sortBtn) {
        const icon = sortBtn.querySelector('i');
        if (currentSortOrder === 'desc') {
            sortBtn.innerHTML = '<i class="bi bi-sort-down"></i> 最新在前';
            icon.classList.remove('bi-sort-up');
            icon.classList.add('bi-sort-down');
        } else {
            sortBtn.innerHTML = '<i class="bi bi-sort-up"></i> 最早在前';
            icon.classList.remove('bi-sort-down');
            icon.classList.add('bi-sort-up');
        }
    }
}

// 添加排序按钮事件监听
function addSortButtonEvent() {
    const sortBtn = document.getElementById('sortCommentsBtn');
    if (sortBtn) {
        sortBtn.addEventListener('click', async () => {
            // 切换排序状态
            currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';
            // 更新按钮状态
            updateSortButton();
            // 重新加载评论
            await loadComments();
        });
    }
}

// 修改 loadComments 函数中的回复显示部分，处理没有 replyTo 的情况
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
        
        // 加载评论数据（使用当前排序状态）
        const comments = await loadCommentsData(postId);
        
        // 更新评论计数显示（只计算主评论数量）
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
        let currentUsername = userResponse && userResponse.isLoggedIn ? userResponse.username : null;
        
        // 渲染评论列表，包括回复
        commentsList.innerHTML = comments.map(comment => {
            // 检查当前用户是否点赞了该评论
            const likedBy = comment.likedBy || [];
            const isLiked = currentUsername && likedBy.includes(currentUsername);
            const likedClass = isLiked ? 'liked' : '';
            const likeIcon = isLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up';
            
            // 处理评论图片
            let imagesHTML = '';
            if (comment.images && comment.images.length > 0) {
                imagesHTML = `
                    <div class="comment-images">
                        ${comment.images.map(image => {
                            const imageUrl = typeof image === 'string' ? image : (image.url || '');
                            if (!imageUrl) return '';
                            return `<div class="comment-image"><img src="${imageUrl.startsWith('http') ? imageUrl : (window.location.origin + imageUrl)}" alt="评论图片"></div>`;
                        }).join('')}
                    </div>
                `;
            }
            
            // 生成回复HTML，确保回复数组存在
            let repliesHTML = '';
            const replies = comment.replies || [];
            if (replies.length > 0) {
                repliesHTML = `
                    <div class="replies">
                        ${replies.map(reply => {
                            // 检查当前用户是否点赞了该回复
                            const replyLikedBy = reply.likedBy || [];
                            const isReplyLiked = currentUsername && replyLikedBy.includes(currentUsername);
                            const replyLikedClass = isReplyLiked ? 'liked' : '';
                            const replyLikeIcon = isReplyLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up';
                            
                            // 处理回复对象信息，显示"xxx回复xxx"
                            // 对于没有replyTo字段的旧数据，默认显示为回复评论作者
                            const replyToUser = reply.replyTo || comment.author;
                            const replyToInfo = `<span class="reply-to-info">回复 <a href="profile.html?username=${encodeURIComponent(replyToUser)}">${replyToUser}</a></span>`;
                            
                            return `
                                <div class="reply-item" data-id="${reply.id}">
                                    <div class="reply-header">
                                        <div class="reply-author">
                                            <a href="profile.html?username=${encodeURIComponent(reply.author)}">
                                                ${renderAvatar(reply.authorAvatar)}
                                            </a>
                                            <a href="profile.html?username=${encodeURIComponent(reply.author)}" class="author-name">
                                                ${reply.author}
                                            </a>
                                            ${replyToInfo}
                                        </div>
                                        <div class="reply-header-right">
                                            <span class="reply-time">${reply.date}</span>
                                            ${currentUsername === reply.author ? `
                                                <button type="button" class="delete-btn" data-reply-id="${reply.id}" data-comment-id="${comment.id}">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                    <div class="reply-content">${reply.content}</div>
                                    <div class="reply-actions">
                                        <button type="button" class="reply-btn" data-reply-id="${reply.id}" data-comment-id="${comment.id}" data-author="${reply.author}">
                                            <i class="bi bi-reply"></i> 回复
                                        </button>
                                        <button type="button" class="like-btn ${replyLikedClass}" data-reply-id="${reply.id}" data-comment-id="${comment.id}">
                                            <i class="bi ${replyLikeIcon}"></i>
                                            <span class="like-count">${reply.likes || 0}</span>
                                        </button>
                                    </div>
                                    <div class="nested-reply-form" style="display: none;">
                                        <textarea placeholder="回复 ${reply.author}..."></textarea>
                                        <div class="reply-actions">
                                            <button type="button" class="submit-nested-reply btn btn-primary btn-sm">发表回复</button>
                                            <button type="button" class="cancel-nested-reply btn btn-light btn-sm">取消</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }
            
            return `
                <div class="comment-item" data-id="${comment.id}" data-liked="${isLiked}" data-author="${comment.author}">
                    <div class="comment-header">
                        <div class="comment-author">
                            <a href="profile.html?username=${encodeURIComponent(comment.author)}">
                                ${renderAvatar(comment.authorAvatar)}
                            </a>
                            <a href="profile.html?username=${encodeURIComponent(comment.author)}" class="author-name">
                                ${comment.author}
                            </a>
                        </div>
                        <div class="comment-header-right">
                            <span class="comment-time">${comment.date}</span>
                            ${currentUsername === comment.author ? `
                                <button type="button" class="delete-btn" data-comment-id="${comment.id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="comment-content">${comment.content}</div>
                    ${imagesHTML}
                    <div class="comment-actions">
                        <button type="button" class="reply-btn" data-comment-id="${comment.id}" data-author="${comment.author}">
                            <i class="bi bi-reply"></i> 回复
                        </button>
                        <button type="button" class="like-btn ${likedClass}" data-comment-id="${comment.id}">
                            <i class="bi ${likeIcon}"></i>
                            <span class="like-count">${comment.likes || 0}</span>
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

// 修改 addCommentActions 函数，添加对嵌套回复的处理
function addCommentActions() {
    // 评论点赞功能
    document.querySelectorAll('.comment-item > .comment-actions .like-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                const userResponse = await userAPI.getStatus();
                if (!userResponse.isLoggedIn) {
                    alert('请先登录后再点赞');
                    return;
                }

                const username = userResponse.username;
                const commentItem = btn.closest('.comment-item');
                if (!commentItem) return;
                
                const commentId = btn.dataset.commentId;
                const likeCount = btn.querySelector('.like-count');
                if (!likeCount) return;
                
                // 获取帖子ID
                const postId = new URLSearchParams(window.location.search).get('id');
                
                // 获取评论数据
                const comments = await loadCommentsData(postId);
                const comment = comments.find(c => c.id.toString() === commentId.toString());
                
                if (!comment) {
                    console.error('未找到评论:', commentId);
                    return;
                }
                
                // 确保 likedBy 数组存在
                if (!comment.likedBy) {
                    comment.likedBy = [];
                }
                
                // 检查用户是否已点赞
                const userIndex = comment.likedBy.indexOf(username);
                const isLiked = userIndex !== -1;
                
                // 更新点赞数和likedBy数组
                if (isLiked) {
                    // 取消点赞
                    comment.likes = Math.max(0, (comment.likes || 0) - 1);
                    comment.likedBy.splice(userIndex, 1);
                    
                    // 更新UI
                    likeCount.textContent = comment.likes;
                    commentItem.dataset.liked = 'false';
                    btn.classList.remove('liked');
                    btn.querySelector('i').classList.replace('bi-hand-thumbs-up-fill', 'bi-hand-thumbs-up');
                    
                    alert('已取消点赞');
                } else {
                    // 添加点赞
                    comment.likes = (comment.likes || 0) + 1;
                    comment.likedBy.push(username);
                    
                    // 更新UI
                    likeCount.textContent = comment.likes;
                    commentItem.dataset.liked = 'true';
                    btn.classList.add('liked');
                    btn.querySelector('i').classList.replace('bi-hand-thumbs-up', 'bi-hand-thumbs-up-fill');
                    
                    alert('点赞成功！');
                }
                
                // 保存更新后的评论数据到服务器
                const updateResult = await contentAPI.updateComment(postId, commentId, comment);
                
                if (updateResult && !updateResult.success) {
                    console.error('更新评论点赞状态失败:', updateResult.message);
                    alert('操作失败，请重试');
                    // 重新加载评论，以恢复正确状态
                    await loadComments();
                }
                
            } catch (error) {
                console.error('点赞失败:', error);
                alert('点赞失败，请重试');
                // 回滚UI状态
                await loadComments();
            }
        });
    });
    
    // 回复点赞功能
    document.querySelectorAll('.reply-item .like-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                const userResponse = await userAPI.getStatus();
                if (!userResponse.isLoggedIn) {
                    alert('请先登录后再点赞');
                    return;
                }

                const username = userResponse.username;
                const replyItem = btn.closest('.reply-item');
                if (!replyItem) return;
                
                const replyId = btn.dataset.replyId;
                const commentId = btn.dataset.commentId;
                const likeCount = btn.querySelector('.like-count');
                if (!likeCount) return;
                
                // 获取帖子ID
                const postId = new URLSearchParams(window.location.search).get('id');
                
                // 获取评论数据
                const comments = await loadCommentsData(postId);
                const comment = comments.find(c => c.id.toString() === commentId.toString());
                
                if (!comment || !comment.replies) {
                    console.error('未找到评论或回复:', commentId, replyId);
                    return;
                }
                
                // 找到对应的回复
                const reply = comment.replies.find(r => r.id.toString() === replyId.toString());
                if (!reply) {
                    console.error('未找到回复:', replyId);
                    return;
                }
                
                // 确保 likedBy 数组存在
                if (!reply.likedBy) {
                    reply.likedBy = [];
                }
                
                // 检查用户是否已点赞
                const userIndex = reply.likedBy.indexOf(username);
                const isLiked = userIndex !== -1;
                
                // 更新点赞数和likedBy数组
                if (isLiked) {
                    // 取消点赞
                    reply.likes = Math.max(0, (reply.likes || 0) - 1);
                    reply.likedBy.splice(userIndex, 1);
                    
                    // 更新UI
                    likeCount.textContent = reply.likes;
                    replyItem.dataset.liked = 'false';
                    btn.classList.remove('liked');
                    btn.querySelector('i').classList.replace('bi-hand-thumbs-up-fill', 'bi-hand-thumbs-up');
                    
                    alert('已取消点赞');
                } else {
                    // 添加点赞
                    reply.likes = (reply.likes || 0) + 1;
                    reply.likedBy.push(username);
                    
                    // 更新UI
                    likeCount.textContent = reply.likes;
                    replyItem.dataset.liked = 'true';
                    btn.classList.add('liked');
                    btn.querySelector('i').classList.replace('bi-hand-thumbs-up', 'bi-hand-thumbs-up-fill');
                    
                    alert('点赞成功！');
                }
                
                // 保存更新后的评论数据到服务器
                const updateResult = await contentAPI.updateComment(postId, commentId, comment);
                
                if (updateResult && !updateResult.success) {
                    console.error('更新回复点赞状态失败:', updateResult.message);
                    alert('操作失败，请重试');
                    // 重新加载评论，以恢复正确状态
                    await loadComments();
                }
                
            } catch (error) {
                console.error('点赞失败:', error);
                alert('点赞失败，请重试');
                // 回滚UI状态
                await loadComments();
            }
        });
    });

    // 评论回复功能
    document.querySelectorAll('.comment-item > .comment-actions .reply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const commentId = btn.dataset.commentId;
            const commentItem = btn.closest('.comment-item');
            if (!commentItem) return;
            
            const replyForm = commentItem.querySelector('.reply-form');
            if (replyForm) {
                replyForm.style.display = 'block';
                replyForm.querySelector('textarea').focus();
            }
        });
    });
    
    // 嵌套回复功能 - 回复回复
    document.querySelectorAll('.reply-item .reply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const replyItem = btn.closest('.reply-item');
            if (!replyItem) return;
            
            const nestedReplyForm = replyItem.querySelector('.nested-reply-form');
            if (nestedReplyForm) {
                nestedReplyForm.style.display = 'block';
                nestedReplyForm.querySelector('textarea').focus();
            }
        });
    });

    // 取消回复
    document.querySelectorAll('.cancel-reply').forEach(btn => {
        btn.addEventListener('click', () => {
            const replyForm = btn.closest('.reply-form');
            if (!replyForm) return;
            
            replyForm.style.display = 'none';
            replyForm.querySelector('textarea').value = '';
        });
    });
    
    // 取消嵌套回复
    document.querySelectorAll('.cancel-nested-reply').forEach(btn => {
        btn.addEventListener('click', () => {
            const nestedReplyForm = btn.closest('.nested-reply-form');
            if (!nestedReplyForm) return;
            
            nestedReplyForm.style.display = 'none';
            nestedReplyForm.querySelector('textarea').value = '';
        });
    });

    // 提交回复到评论
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
                
                // 获取评论ID和评论作者
                const commentItem = replyForm.closest('.comment-item');
                const commentId = commentItem.dataset.id;
                const commentAuthor = commentItem.dataset.author;
                
                if (!commentId) {
                    alert('评论ID无效');
                    return;
                }
                
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
                    }),
                    likes: 0,
                    likedBy: [],
                    replyTo: commentAuthor  // 添加回复对象信息 - 评论作者
                };

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
                    // 清空并隐藏回复框
                    textarea.value = '';
                    replyForm.style.display = 'none';
                    
                    // 重新加载评论以显示新回复
                    await loadComments();
                    
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
    
    // 提交嵌套回复 - 回复回复
    document.querySelectorAll('.submit-nested-reply').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                const userResponse = await userAPI.getStatus();
                if (!userResponse.isLoggedIn) {
                    alert('请先登录后再回复');
                    return;
                }

                const nestedReplyForm = btn.closest('.nested-reply-form');
                const textarea = nestedReplyForm.querySelector('textarea');
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
                
                // 获取评论ID和回复ID
                const replyItem = nestedReplyForm.closest('.reply-item');
                const replyId = replyItem.dataset.id;
                const commentId = replyItem.closest('.comment-item').dataset.id;
                if (!commentId || !replyId) {
                    alert('评论或回复ID无效');
                    return;
                }
                
                // 获取被回复的用户名
                const replyToAuthor = replyItem.querySelector('.reply-author .author-name').textContent.trim();
                
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
                    }),
                    likes: 0,
                    likedBy: [],
                    replyTo: replyToAuthor  // 添加回复对象信息
                };

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
                    // 清空并隐藏回复框
                    textarea.value = '';
                    nestedReplyForm.style.display = 'none';
                    
                    // 重新加载评论以显示新回复
                    await loadComments();
                    
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

    // 删除评论功能
    document.querySelectorAll('.comment-item .delete-btn').forEach(btn => {
        // 移除可能存在的旧事件监听器
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                const commentId = newBtn.dataset.commentId;
                const postId = new URLSearchParams(window.location.search).get('id');
                
                if (!confirm('确定要删除这条评论吗？')) {
                    return;
                }

                // 禁用删除按钮，防止重复点击
                newBtn.disabled = true;
                newBtn.style.opacity = '0.5';
                const originalText = newBtn.innerHTML;
                newBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>';

                try {
                    // 调用删除评论API
                    const result = await contentAPI.deleteComment(postId, commentId);
                    
                    // 删除成功，重新加载评论列表
                    await loadComments();
                    alert('评论已删除');
                } catch (error) {
                    console.error('删除评论失败:', error);
                    alert(error.message || '删除评论失败，请重试');
                    // 重新加载评论列表以恢复正确状态
                    await loadComments();
                } finally {
                    // 恢复按钮状态
                    newBtn.disabled = false;
                    newBtn.style.opacity = '1';
                    newBtn.innerHTML = originalText;
                }
            } catch (error) {
                console.error('删除评论失败:', error);
                alert('删除评论失败，请重试');
            }
        });
    });

    // 删除回复功能
    document.querySelectorAll('.reply-item .delete-btn').forEach(btn => {
        // 移除可能存在的旧事件监听器
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const replyItem = newBtn.closest('.reply-item');
            if (!replyItem) return;
            
            const replyId = newBtn.dataset.replyId;
            const commentId = newBtn.dataset.commentId;
            if (!replyId || !commentId) return;
            
            // 获取帖子ID
            const postId = new URLSearchParams(window.location.search).get('id');
            if (!postId) {
                alert('帖子ID无效');
                return;
            }

            // 确认删除
            if (!confirm('确定要删除这条回复吗？')) {
                return;
            }

            // 禁用删除按钮，防止重复点击
            newBtn.disabled = true;
            newBtn.style.opacity = '0.5';
            const originalText = newBtn.innerHTML;
            newBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>';

            try {
                // 调用删除回复API
                const result = await contentAPI.deleteReply(postId, commentId, replyId);
                
                // 删除成功，重新加载评论列表
                await loadComments();
                alert('回复已删除');
            } catch (error) {
                console.error('删除回复失败:', error);
                alert(error.message || '删除回复失败，请重试');
                // 重新加载评论列表以恢复正确状态
                await loadComments();
            } finally {
                // 恢复按钮状态
                newBtn.disabled = false;
                newBtn.style.opacity = '1';
                newBtn.innerHTML = originalText;
            }
        });
    });
}

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
    fileInput.addEventListener('change', async () => {
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
        
        try {
            // 生成文件名
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 8);
            const extension = file.name.split('.').pop();
            const filename = `comment_${timestamp}_${randomStr}.${extension}`;
            
            // 创建FormData对象
            const formData = new FormData();
            formData.append('image', file);
            formData.append('filename', filename);
            
            // 显示上传中提示
            const uploadingTip = document.createElement('div');
            uploadingTip.className = 'uploading-tip';
            uploadingTip.innerHTML = '<i class="bi bi-arrow-repeat"></i> 图片上传中...';
            imagePreview.innerHTML = '';
            imagePreview.appendChild(uploadingTip);
            
            try {
                // 使用 uploadAPI 上传图片
                const result = await uploadAPI.uploadCommentImage(formData);
                
                // 移除上传中提示
                imagePreview.innerHTML = '';
                
                if (result.success) {
                    console.log('图片上传成功:', result);
                    
                    // 创建预览元素
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${result.imageUrl}" alt="图片预览">
                        <div class="remove-image">×</div>
                        <input type="hidden" name="image-id" value="${result.imageId}">
                    `;
                    
                    // 添加移除图片事件
                    const removeButton = previewItem.querySelector('.remove-image');
                    removeButton.addEventListener('click', () => {
                        previewItem.remove();
                        fileInput.value = ''; // 清空文件输入
                    });
                    
                    // 添加新预览
                    imagePreview.appendChild(previewItem);
                } else {
                    throw new Error(result.message || '图片上传失败');
                }
            } catch (error) {
                console.error('图片上传失败:', error);
                alert('图片上传失败: ' + error.message);
                fileInput.value = ''; // 清空文件输入
                imagePreview.innerHTML = '';
            }
        } catch (error) {
            console.error('图片上传失败:', error);
            alert('图片上传失败: ' + error.message);
            fileInput.value = ''; // 清空文件输入
            imagePreview.innerHTML = '';
        }
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

// 替换评论提交事件函数
function addCommentSubmitEvent() {
    const submitBtn = document.getElementById('submitComment');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async () => {
        const textarea = document.querySelector('.comment-input textarea');
        const content = textarea.value.trim();
        const imagePreview = document.getElementById('commentImagePreview');
        const imageElement = imagePreview ? imagePreview.querySelector('img') : null;
        const imageIdElement = imagePreview ? imagePreview.querySelector('input[name="image-id"]') : null;
        
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

            // 准备评论内容
            let finalContent = content;
            let images = [];
            
            // 如果有图片，获取图片URL
            if (imageElement) {
                const imageUrl = imageElement.src;
                const imageId = imageIdElement ? imageIdElement.value : '';
                images.push({
                    id: imageId,
                    url: imageUrl
                });
                
                // 不再需要添加默认文本
                // 如果内容为空，就使用空字符串
                finalContent = content || '';
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
                replies: [], // 添加replies数组，用于存储回复
                images: images // 添加图片数组
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
        
        // 初始化导航栏
        await initNavbar();
        
        // 加载帖子内容
        await loadPostContent();
        
        // 加载评论列表
        await loadComments();
        
        // 添加评论提交事件
        addCommentSubmitEvent();

        // 添加排序按钮事件
        addSortButtonEvent();

        // 初始化评论图片上传功能
        initCommentImageUpload();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
}); 