import { userAPI, contentAPI } from './api.js';
import { initNavbar } from './nav-utils.js';

// 当前课程数据
let currentCourse = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 更新用户状态
        initNavbar();
        
        // 从URL获取课程ID
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('id');
        
        if (!courseId) {
            showError('未找到课程ID，请返回课程列表重新选择');
            return;
        }
        
        // 加载课程详情
        await loadCourseDetail(parseInt(courseId));
        
        // 添加按钮事件监听
        addButtonEvents();
    } catch (error) {
        console.error('加载数据失败:', error);
        showError('加载数据失败，请刷新页面重试');
    }
});

// 加载课程详情
async function loadCourseDetail(courseId) {
    try {
        // 优先从 JSON 文件加载课程数据
        let courses = [];
        try {
            const response = await fetch('/data/courses.json', {cache: 'no-store'});
            if (response.ok) {
                courses = await response.json();
            }
        } catch (err) {
            console.error('加载 courses.json 失败:', err);
        }
        // 兼容旧数据结构
        if (!Array.isArray(courses) || courses.length === 0) {
            courses = [];
        }
        // 查找当前课程
        currentCourse = courses.find(course => course.id === courseId);
        if (!currentCourse) {
            showError('未找到该课程信息');
            return;
        }
        // 更新课程详情
        updateCourseDetail(currentCourse);
        // 加载课程评价
        loadCourseReviews(courseId);
    } catch (error) {
        console.error('加载课程详情失败:', error);
        showError('加载课程详情失败，请刷新页面重试');
    }
}

// 更新课程详情
function updateCourseDetail(course) {
    // 更新标题和Meta信息
    document.getElementById('courseTitle').textContent = course.title;
    document.getElementById('courseRating').innerHTML = generateStars(course.rating);
    document.getElementById('ratingScore').textContent = course.rating.toFixed(1);
    document.getElementById('reviewsCount').textContent = course.reviewCount;
    
    // 更新课程信息
    document.getElementById('courseTeacher').textContent = course.teacher;
    document.getElementById('courseCampus').textContent = course.campus;
    document.getElementById('courseCategory').textContent = course.category;
    document.getElementById('courseDepartment').textContent = course.department;
    document.getElementById('courseHours').textContent = `${course.hours}学时`;
    document.getElementById('courseCredits').textContent = `${course.credits}学分`;
    document.getElementById('courseSemester').textContent = course.semester;
    document.getElementById('courseLocation').textContent = course.location;
    
    // 更新课程描述
    document.getElementById('courseDescription').textContent = course.description;
}

// 加载课程评价
function loadCourseReviews(courseId) {
    try {
        // 从本地存储中获取保存的评价
        let savedReviews = localStorage.getItem('courseReviews');
        let localReviews = savedReviews ? JSON.parse(savedReviews) : [];
        
        // 过滤出当前课程的评价
        const localCourseReviews = localReviews.filter(review => review.courseId === courseId);
        
        // 模拟评价数据
        const mockReviews = [
            {
                id: 1,
                courseId: 1,
                username: '学生A',
                date: '2024-04-01',
                rating: 5.0,
                content: '讲得很好，概念清晰，例题丰富，作业也很有针对性。张教授很耐心地解答问题，课堂氛围活跃。推荐这门课！',
                tags: ['内容充实', '讲解清晰', '推荐']
            },
            {
                id: 2,
                courseId: 1,
                username: '学生B',
                date: '2024-03-28',
                rating: 4.5,
                content: '课程内容充实，但难度较大，需要花很多时间自学和做习题。不过老师讲解得很清楚，课后辅导也很到位。',
                tags: ['内容充实', '讲解清晰']
            },
            {
                id: 3,
                courseId: 1,
                username: '学生C',
                date: '2024-03-15',
                rating: 5.0,
                content: '这是我上过的最好的数学课，张教授对教学非常认真负责，能够把抽象的概念讲得很通俗易懂。课件和讲义都很完善，很适合自学。强烈推荐！',
                tags: ['讲解清晰', '老师负责', '推荐']
            },
            {
                id: 4,
                courseId: 2,
                username: '学生D',
                date: '2024-04-10',
                rating: 5.0,
                content: '李教授的数据结构课非常棒，理论与实践结合得很好。每周的编程作业很有挑战性，但是收获也很大。',
                tags: ['内容充实', '实用性强']
            },
            {
                id: 5,
                courseId: 3,
                username: '学生E',
                date: '2024-03-20',
                rating: 4.0,
                content: '王老师的英语课很有趣，课堂活动丰富多样。但期中和期末考试难度较高，需要认真准备。',
                tags: ['有趣', '作业适量']
            }
        ];
        
        // 根据课程ID筛选评价，并合并本地保存的评价
        let courseReviews = mockReviews.filter(review => review.courseId === courseId);
        
        // 合并保存在本地的评价
        if (localCourseReviews.length > 0) {
            courseReviews = [...courseReviews, ...localCourseReviews];
        }
        
        // 更新评价统计
        updateReviewStats(courseReviews);
        
        // 渲染评价列表
        renderReviewList(courseReviews);
    } catch (error) {
        console.error('加载课程评价失败:', error);
        throw error;
    }
}

// 更新评价统计
function updateReviewStats(reviews) {
    if (!reviews || reviews.length === 0) {
        return;
    }
    
    // 计算平均评分
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    // 更新大评分显示
    document.getElementById('bigRatingScore').textContent = averageRating.toFixed(1);
    document.getElementById('bigStars').innerHTML = generateStars(averageRating);
    document.getElementById('totalReviewCount').textContent = reviews.length;
    
    // 计算各星级占比
    const ratings = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
    };
    
    reviews.forEach(review => {
        const roundedRating = Math.round(review.rating);
        if (ratings[roundedRating] !== undefined) {
            ratings[roundedRating]++;
        }
    });
    
    // 更新评分条
    const ratingBars = document.querySelectorAll('.rating-bar-item');
    ratingBars.forEach((bar, index) => {
        const starLevel = 5 - index; // 5, 4, 3, 2, 1
        const count = ratings[starLevel] || 0;
        const percent = reviews.length > 0 ? (count / reviews.length * 100) : 0;
        
        const fill = bar.querySelector('.rating-fill');
        const percentText = bar.querySelector('.rating-percent');
        
        if (fill) fill.style.width = `${percent}%`;
        if (percentText) percentText.textContent = `${Math.round(percent)}%`;
    });
}

// 渲染评价列表
function renderReviewList(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    
    if (!reviewsList) {
        return;
    }
    
    if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML = '<div class="no-reviews">暂无评价</div>';
        return;
    }
    
    reviewsList.innerHTML = reviews.map(review => {
        // 生成星级评分HTML
        const starsHtml = generateStars(review.rating);
        
        // 生成标签HTML
        const tagsHtml = review.tags && review.tags.length > 0 
            ? `<div class="review-tags">${review.tags.map(tag => `<span class="review-tag active">${tag}</span>`).join('')}</div>` 
            : '';
        
        return `
        <div class="review-item">
            <div class="reviewer">
                <div class="reviewer-avatar">
                    <i class="bi bi-person"></i>
                </div>
                <div class="reviewer-info">
                    <div class="reviewer-name">${review.username}</div>
                    <div class="review-date">${review.date}</div>
                </div>
            </div>
            <div class="review-rating">
                <div class="stars">${starsHtml}</div>
                <span class="rating-score">${review.rating.toFixed(1)}</span>
            </div>
            <div class="review-content">${review.content}</div>
            ${tagsHtml}
            <div class="review-actions">
                <div class="review-action" data-action="like" data-id="${review.id}">
                    <i class="bi bi-hand-thumbs-up"></i> 有用 (0)
                </div>
                <div class="review-action" data-action="reply" data-id="${review.id}">
                    <i class="bi bi-chat"></i> 回复
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    // 添加评价操作事件
    addReviewActionEvents();
}

// 添加评价操作事件
function addReviewActionEvents() {
    const reviewActions = document.querySelectorAll('.review-action');
    
    reviewActions.forEach(action => {
        action.addEventListener('click', () => {
            const actionType = action.dataset.action;
            const reviewId = action.dataset.id;
            
            if (actionType === 'like') {
                // 模拟点赞功能
                const likeCount = parseInt(action.textContent.match(/\d+/)[0]) + 1;
                action.innerHTML = `<i class="bi bi-hand-thumbs-up-fill"></i> 有用 (${likeCount})`;
                action.classList.add('active');
                action.style.pointerEvents = 'none'; // 禁用再次点击
            } else if (actionType === 'reply') {
                // 模拟回复功能
                alert('回复功能暂未实现');
            }
        });
    });
}

// 添加按钮事件
function addButtonEvents() {
    // 收藏按钮
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', () => {
            // 模拟收藏功能
            if (favoriteBtn.classList.contains('active')) {
                favoriteBtn.innerHTML = '<i class="bi bi-star"></i> 收藏';
                favoriteBtn.classList.remove('active');
                alert('已取消收藏');
            } else {
                favoriteBtn.innerHTML = '<i class="bi bi-star-fill"></i> 已收藏';
                favoriteBtn.classList.add('active');
                alert('收藏成功');
            }
        });
    }
    
    // 分享按钮
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            // 模拟分享功能
            alert('分享功能暂未实现');
        });
    }
    
    // 添加评价按钮 - 打开模态框
    const addReviewBtn = document.getElementById('addReviewBtn');
    if (addReviewBtn) {
        addReviewBtn.addEventListener('click', () => {
            openReviewModal();
        });
    }
    
    // 添加评价模态框中的事件
    setupReviewModal();
}

// 设置评价模态框
function setupReviewModal() {
    // 获取Bootstrap模态框实例
    const reviewModal = new bootstrap.Modal(document.getElementById('reviewModal'));
    
    // 设置星级评分选择事件
    const ratingStars = document.querySelectorAll('.rating-star');
    const ratingDisplay = document.getElementById('ratingDisplay');
    const ratingInput = document.getElementById('reviewRating');
    
    ratingStars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            ratingInput.value = rating;
            ratingDisplay.textContent = rating;
            
            // 更新星星显示
            ratingStars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.remove('bi-star');
                    s.classList.add('bi-star-fill', 'active');
                } else {
                    s.classList.remove('bi-star-fill', 'active');
                    s.classList.add('bi-star');
                }
            });
        });
    });
    
    // 设置标签选择事件
    const reviewTags = document.querySelectorAll('.review-tag');
    const tagsInput = document.getElementById('reviewTags');
    const selectedTags = [];
    
    reviewTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const tagValue = tag.dataset.tag;
            
            if (tag.classList.contains('active')) {
                // 取消选择
                tag.classList.remove('active');
                const index = selectedTags.indexOf(tagValue);
                if (index !== -1) {
                    selectedTags.splice(index, 1);
                }
            } else {
                // 选择标签
                tag.classList.add('active');
                selectedTags.push(tagValue);
            }
            
            // 更新隐藏输入值
            tagsInput.value = selectedTags.join(',');
        });
    });
    
    // 提交评价
    const submitReviewBtn = document.getElementById('submitReviewBtn');
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', submitReview);
    }
}

// 打开评价模态框
function openReviewModal() {
    // 检查用户是否登录
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        alert('请先登录后再评价课程');
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }
    
    // 重置表单
    resetReviewForm();
    
    // 填充课程信息
    if (currentCourse) {
        document.getElementById('reviewCourseTitle').value = currentCourse.title;
    }
    
    // 显示模态框
    const reviewModal = new bootstrap.Modal(document.getElementById('reviewModal'));
    reviewModal.show();
}

// 重置评价表单
function resetReviewForm() {
    // 重置评分
    const ratingStars = document.querySelectorAll('.rating-star');
    const ratingDisplay = document.getElementById('ratingDisplay');
    const ratingInput = document.getElementById('reviewRating');
    
    ratingStars.forEach(star => {
        star.classList.remove('bi-star-fill', 'active');
        star.classList.add('bi-star');
    });
    
    ratingInput.value = '0';
    ratingDisplay.textContent = '0';
    
    // 重置内容
    document.getElementById('reviewContent').value = '';
    
    // 重置匿名选项
    document.getElementById('reviewAnonymous').checked = false;
    
    // 重置标签
    const reviewTags = document.querySelectorAll('.review-tag');
    reviewTags.forEach(tag => {
        tag.classList.remove('active');
    });
    document.getElementById('reviewTags').value = '';
}

// 提交评价
async function submitReview() {
    try {
        // 获取表单数据
        const rating = parseInt(document.getElementById('reviewRating').value);
        const content = document.getElementById('reviewContent').value.trim();
        const isAnonymous = document.getElementById('reviewAnonymous').checked;
        const tags = document.getElementById('reviewTags').value;
        
        // 验证数据
        if (rating === 0) {
            alert('请选择评分星级');
            return;
        }
        
        if (content.length < 10) {
            alert('评价内容至少需要10个字符');
            return;
        }
        
        if (!currentCourse) {
            alert('课程信息不存在');
            return;
        }
        
        // 构建评价数据对象
        const reviewData = {
            courseId: currentCourse.id,
            rating: rating,
            content: content,
            isAnonymous: isAnonymous,
            tags: tags ? tags.split(',') : []
        };
        
        // 模拟提交评价
        // 在实际应用中，这里应该调用API发送数据到服务器
        console.log('提交评价:', reviewData);
        
        // 模拟评价ID和用户信息
        const userData = JSON.parse(localStorage.getItem('userData'));
        const mockReviewId = Math.floor(Math.random() * 10000);
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // 创建新的评价对象
        const newReview = {
            id: mockReviewId,
            courseId: currentCourse.id,
            username: isAnonymous ? '匿名用户' : (userData ? userData.username : '用户'),
            date: formattedDate,
            rating: rating,
            content: content,
            tags: tags ? tags.split(',') : []
        };
        
        // 添加到本地存储以便刷新后仍可见
        // 获取现有评价
        let savedReviews = localStorage.getItem('courseReviews');
        let reviewsArray = savedReviews ? JSON.parse(savedReviews) : [];
        
        // 添加新评价
        reviewsArray.push(newReview);
        
        // 保存回本地存储
        localStorage.setItem('courseReviews', JSON.stringify(reviewsArray));
        
        // 隐藏模态框
        const reviewModal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
        reviewModal.hide();
        
        // 刷新评价列表
        await loadCourseReviews(currentCourse.id);
        
        // 成功提示
        alert('评价提交成功！感谢您的反馈。');
    } catch (error) {
        console.error('提交评价失败:', error);
        alert('提交评价失败，请稍后重试');
    }
}

// 显示错误信息
function showError(message) {
    const courseDetailContainer = document.getElementById('courseDetailContainer');
    const reviewsSection = document.querySelector('.course-reviews-section');
    
    if (courseDetailContainer) {
        courseDetailContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle-fill"></i> ${message}
        </div>
        <div class="back-link">
            <a href="courses.html"><i class="bi bi-arrow-left"></i> 返回课程列表</a>
        </div>
        `;
    }
    
    if (reviewsSection) {
        reviewsSection.style.display = 'none';
    }
}

// 生成星级评分HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // 添加满星
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="bi bi-star-fill"></i>';
    }
    
    // 添加半星（如果有）
    if (hasHalfStar) {
        starsHtml += '<i class="bi bi-star-half"></i>';
    }
    
    // 添加空星
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="bi bi-star"></i>';
    }
    
    return starsHtml;
}