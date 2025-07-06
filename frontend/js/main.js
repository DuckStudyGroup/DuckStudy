import { userAPI, contentAPI } from './api.js';
import { initNavbar } from './nav-utils.js';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 首先初始化导航栏
        await initNavbar();
        
        // 然后加载其他内容
        await Promise.all([
            loadHotCourses(),
            loadHotPosts(),
            loadHotProjects()
        ]);

        // 添加首页搜索按钮事件
        addHomeSearchEvent();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
});

// 加载课程评价 - 已不再使用，由loadHotCourses替代
// 保留此函数是为了避免修改太多代码，但不再调用它
async function loadReviews() {
    try {
        // 检查reviewsGrid是否存在
        const reviewsGrid = document.getElementById('reviewsGrid');
        if (!reviewsGrid) {
            console.log('reviewsGrid元素不存在，跳过加载评价');
            return;
        }
        
        const reviews = await contentAPI.getReviews();
        
        if (!reviews || reviews.length === 0) {
            reviewsGrid.innerHTML = '<div class="text-center">暂无课程评价</div>';
            return;
        }
        
        reviewsGrid.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <h3>${review.title}</h3>
                    <div class="rating">
                        ${'★'.repeat(Math.floor(review.rating))}${'☆'.repeat(5-Math.floor(review.rating))}
                    </div>
                </div>
                <div class="review-text">${review.content}</div>
                <div class="review-footer">
                    <span>${review.author}</span>
                    <span>${review.date}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载课程评价失败:', error);
        // 不抛出错误，防止中断其他功能
        console.log('跳过加载评价，继续执行其他功能');
    }
}

// 加载热门帖子
async function loadHotPosts() {
    try {
        const postsList = document.getElementById('postsList');
        const posts = await contentAPI.getHotPosts();
        
        if (!posts || posts.length === 0) {
            postsList.innerHTML = '<div class="text-center">暂无热门帖子</div>';
            return;
        }
        
        // 获取所有分类信息，用于展示帖子分类
        const getCategoryInfo = (category) => {
            const categoryMap = {
                'study': { name: '学习交流', icon: 'bi-book' },
                'life': { name: '校园生活', icon: 'bi-emoji-smile' },
                'love': { name: '恋爱交友', icon: 'bi-heart' },
                'experience': { name: '经验分享', icon: 'bi-share' },
                'help': { name: '问题求助', icon: 'bi-question-circle' },
                'resource': { name: '二手闲置', icon: 'bi-link' }
            };
            return categoryMap[category] || { name: category, icon: 'bi-tag' };
        };
        
        postsList.innerHTML = posts.map(post => {
            const categoryInfo = getCategoryInfo(post.category);
            
            // 处理富文本内容
            const plainContent = stripHtmlTags(post.content);
            
            // 格式化帖子内容预览（最多显示50个字符）
            const contentPreview = plainContent.length > 50 
                ? plainContent.substring(0, 50) + '...' 
                : plainContent;
            
            // 计算帖子热度
            const hotScore = post.views + (post.likes * 2) + ((post.favorites || 0) * 3);
            // 创建热度标签
            const hotBadge = hotScore > 500 
                ? '<span class="hot-badge very-hot">HOT</span>' 
                : (hotScore > 300 
                    ? '<span class="hot-badge hot">热门</span>' 
                    : (hotScore > 150 
                        ? '<span class="hot-badge warm">推荐</span>' 
                        : ''));
            
            return `
                <a href="pages/post-detail.html?id=${post.id}" class="post-item">
                    <div class="post-item-content">
                        <div class="post-header">
                            <h3 class="post-title">${post.title} ${hotBadge}</h3>
                            <div class="post-category">
                                <i class="bi ${categoryInfo.icon}"></i>
                                <span>${categoryInfo.name}</span>
                            </div>
                        </div>
                        <p class="post-preview">${contentPreview}</p>
                        <div class="post-meta">
                            <div class="post-author">
                                <i class="bi bi-person"></i>
                                <span>${post.author}</span>
                            </div>
                            <div class="post-stats">
                                <span title="浏览量"><i class="bi bi-eye"></i> ${post.views}</span>
                                <span title="点赞数"><i class="bi bi-hand-thumbs-up"></i> ${post.likes}</span>
                                <span title="收藏数"><i class="bi bi-bookmark"></i> ${post.favorites || 0}</span>
                                <span title="发布日期"><i class="bi bi-calendar"></i> ${post.date}</span>
                            </div>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    } catch (error) {
        console.error('加载热门帖子失败:', error);
        const postsList = document.getElementById('postsList');
        if (postsList) {
            postsList.innerHTML = '<div class="text-center text-danger">加载热门帖子失败</div>';
        }
    }
}

// 加载热门项目
async function loadHotProjects() {
    // Implementation needed
}

// 处理富文本内容为纯文本
function stripHtmlTags(html) {
    if (!html) return '';
    
    // 创建临时元素
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // 获取纯文本内容
    return tempDiv.textContent || tempDiv.innerText || '';
}

// 添加首页课程搜索事件
function addHomeSearchEvent() {
    const searchBtn = document.getElementById('homeSearchBtn');
    const searchInput = document.getElementById('homeCourseSearch');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `pages/courses.html?search=${encodeURIComponent(query)}`;
            }
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `pages/courses.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}

// 加载热门课程
async function loadHotCourses() {
    try {
        const coursesGrid = document.getElementById('coursesGrid');
        if (!coursesGrid) return;
        
        // 获取课程数据
        const courses = await getCoursesData();
        
        // 选择前4个课程作为热门课程（这里可以根据实际需求调整选择逻辑）
        const hotCourses = courses.slice(0, 4);
        
        // 渲染课程卡片
        coursesGrid.innerHTML = hotCourses.map(course => {
            // 获取该课程的所有评价数据
            const courseReviews = getCourseReviews(course.id);
            
            // 动态计算评分和评价数
            const { displayRating, totalReviewCount } = calculateCourseStats(courseReviews);
            
            // 生成星级评分HTML
            const ratingStars = generateStars(displayRating);
            
            return `
            <div class="home-course-card" data-id="${course.id}">
                <div class="home-course-card-content">
                    <h3 class="home-course-title">${course.title}</h3>
                    <div class="home-course-teacher">${course.teacher}</div>
                    <div class="home-course-rating">
                        <div class="stars">${ratingStars}</div>
                        <span class="rating-score">${displayRating}</span>
                    </div>
                    <div class="course-meta">
                        <span class="meta-item"><i class="bi bi-building"></i> ${course.department}</span>
                        <span class="meta-item"><i class="bi bi-geo-alt"></i> ${course.campus}</span>
                        <span class="meta-item"><i class="bi bi-chat-dots"></i> ${totalReviewCount}条评价</span>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        // 添加点击事件
        const courseCards = document.querySelectorAll('.home-course-card');
        courseCards.forEach(card => {
            card.addEventListener('click', () => {
                const courseId = card.dataset.id;
                window.location.href = `pages/course-detail.html?id=${courseId}`;
            });
        });
    } catch (error) {
        console.error('加载热门课程失败:', error);
        throw error;
    }
}

// 获取课程数据
async function getCoursesData() {
    try {
        // 从 JSON 文件加载课程数据
        const response = await fetch('/data/courses.json', {cache: 'no-store'});
        let courses = [];
        if (response.ok) {
            courses = await response.json();
        }
        if (!Array.isArray(courses)) {
            courses = [];
        }
        return courses;
    } catch (error) {
        console.error('加载课程数据失败:', error);
        return [];
    }
}

// 获取课程的所有评价数据
function getCourseReviews(courseId) {
    // 从本地存储中获取保存的评价
    let savedReviews = localStorage.getItem('courseReviews');
    let localReviews = savedReviews ? JSON.parse(savedReviews) : [];
    
    // 过滤出当前课程的评价
    const localCourseReviews = localReviews.filter(review => review.courseId === courseId);
    
    // 模拟评价数据（与课程详情页面保持一致）
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
    
    return courseReviews;
}

// 计算课程的评分统计
function calculateCourseStats(reviews) {
    if (!reviews || reviews.length === 0) {
        return {
            displayRating: '0.0',
            totalReviewCount: 0
        };
    }
    
    // 计算平均评分
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    return {
        displayRating: averageRating.toFixed(1),
        totalReviewCount: reviews.length
    };
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