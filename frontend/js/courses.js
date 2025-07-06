import { userAPI, contentAPI } from './api.js';
import { initNavbar } from './nav-utils.js';

// 全局课程数据
let allCourses = [];
let filteredCourses = [];

// 页面加载完成后执行
import { BASE_URL } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 更新用户状态（使用共享的导航栏初始化函数）
        await initNavbar();
        
        // 加载课程数据
        await loadCourses();
        
        // 添加搜索和筛选事件
        addSearchEvents();
        addFilterEvents();

        // 检查URL中是否有搜索参数
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        if (searchQuery) {
            document.getElementById('courseSearch').value = searchQuery;
            filterCourses();
        }
        // 添加课程按钮和表单交互
        setupAddCourseFeature();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请刷新页面重试');
    }
});
// 添加课程功能
function setupAddCourseFeature() {
    const addBtn = document.getElementById('addCourseBtn');
    const modal = document.getElementById('addCourseModal');
    const form = document.getElementById('addCourseForm');
    const errorDiv = document.getElementById('addCourseError');
    let bsModal = null;
    if (window.bootstrap && window.bootstrap.Modal) {
        bsModal = window.bootstrap.Modal.getOrCreateInstance(modal);
    } else if (window.bootstrap && window.bootstrap.Modal) {
        bsModal = new window.bootstrap.Modal(modal);
    }
    if (addBtn && modal && form) {
        addBtn.addEventListener('click', () => {
            form.reset();
            errorDiv.style.display = 'none';
            if (bsModal) bsModal.show();
        });
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.style.display = 'none';
            const formData = new FormData(form);
            const courseData = {};
            for (const [key, value] of formData.entries()) {
                courseData[key] = value;
            }
            // 类型转换
            courseData.credits = Number(courseData.credits);
            courseData.hours = Number(courseData.hours);
            try {
                const res = await createCourse(courseData);
                if (res.success) {
                    if (bsModal) bsModal.hide();
                    // 重新加载课程数据
                    await loadCourses();
                } else {
                    errorDiv.textContent = res.message || '添加失败';
                    errorDiv.style.display = 'block';
                }
            } catch (err) {
                errorDiv.textContent = err.message || '添加失败';
                errorDiv.style.display = 'block';
            }
        });
    }
}

// 创建课程API
async function createCourse(courseData) {
    const response = await fetch(`${BASE_URL}/api/courses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
    });
    return await response.json();
}
// 加载课程数据
async function loadCourses() {
    try {
        // 只从 JSON 文件加载课程数据
        const response = await fetch('/data/courses.json', {cache: 'no-store'});
        let json = [];
        if (response.ok) {
            json = await response.json();
        }
        if (!Array.isArray(json)) {
            json = [];
        }
        allCourses = json;
        
        filteredCourses = [...allCourses];
        renderCoursesList(filteredCourses);
    } catch (error) {
        console.error('加载课程数据失败:', error);
        throw error;
    }
}

// 添加搜索事件
function addSearchEvents() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('courseSearch');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            filterCourses();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                filterCourses();
            }
        });
    }
}

// 添加筛选事件
function addFilterEvents() {
    const categoryFilter = document.getElementById('categoryFilter');
    const campusFilter = document.getElementById('campusFilter');
    const sortFilter = document.getElementById('sortFilter');
    const reviewFilter = document.getElementById('reviewFilter');
    const customFilterBtn = document.getElementById('customFilterBtn');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterCourses);
    }
    
    if (campusFilter) {
        campusFilter.addEventListener('change', filterCourses);
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', filterCourses);
    }
    
    if (reviewFilter) {
        reviewFilter.addEventListener('change', filterCourses);
    }
    
    if (customFilterBtn) {
        customFilterBtn.addEventListener('click', () => {
            // 模拟自定义筛选，这里只是清除所有筛选条件
            if (categoryFilter) categoryFilter.value = '';
            if (campusFilter) campusFilter.value = '';
            if (sortFilter) sortFilter.value = 'rating';
            if (reviewFilter) reviewFilter.value = '';
            
            filterCourses();
        });
    }
}

// 筛选课程
function filterCourses() {
    const searchInput = document.getElementById('courseSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const campusFilter = document.getElementById('campusFilter');
    const sortFilter = document.getElementById('sortFilter');
    const reviewFilter = document.getElementById('reviewFilter');
    
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const category = categoryFilter ? categoryFilter.value : '';
    const campus = campusFilter ? campusFilter.value : '';
    const sortBy = sortFilter ? sortFilter.value : 'rating';
    const minRating = reviewFilter ? parseFloat(reviewFilter.value) || 0 : 0;
    
    // 筛选
    filteredCourses = allCourses.filter(course => {
        // 搜索条件
        const matchesSearch = !searchTerm || 
            course.title.toLowerCase().includes(searchTerm) || 
            course.teacher.toLowerCase().includes(searchTerm);
            
        // 分类条件
        const matchesCategory = !category || course.category === category;
        
        // 校区条件
        const matchesCampus = !campus || course.campus === campus;
        
        // 评分条件 - 使用动态计算的评分
        const courseReviews = getCourseReviews(course.id);
        const { displayRating } = calculateCourseStats(courseReviews);
        const matchesRating = parseFloat(displayRating) >= minRating;
        
        return matchesSearch && matchesCategory && matchesCampus && matchesRating;
    });
    
    // 排序
    filteredCourses.sort((a, b) => {
        if (sortBy === 'rating') {
            // 使用动态计算的评分进行排序
            const aReviews = getCourseReviews(a.id);
            const bReviews = getCourseReviews(b.id);
            const { displayRating: aRating } = calculateCourseStats(aReviews);
            const { displayRating: bRating } = calculateCourseStats(bReviews);
            return parseFloat(bRating) - parseFloat(aRating);
        } else if (sortBy === 'reviews') {
            // 使用动态计算的评价数进行排序
            const aReviews = getCourseReviews(a.id);
            const bReviews = getCourseReviews(b.id);
            const { totalReviewCount: aCount } = calculateCourseStats(aReviews);
            const { totalReviewCount: bCount } = calculateCourseStats(bReviews);
            return bCount - aCount;
        } else if (sortBy === 'newest') {
            // 在实际应用中，这里应该比较日期
            // 这里简单地按照ID排序，假设ID越大越新
            return b.id - a.id;
        }
        return 0;
    });
    
    // 渲染列表
    renderCoursesList(filteredCourses);
}

// 渲染课程列表
function renderCoursesList(courses) {
    const coursesContainer = document.getElementById('coursesContainer');
    
    if (!coursesContainer) {
        return;
    }
    
    if (courses.length === 0) {
        coursesContainer.innerHTML = '<div class="no-results">没有找到符合条件的课程</div>';
        return;
    }
    
    coursesContainer.innerHTML = courses.map(course => {
        // 获取该课程的所有评价数据
        const courseReviews = getCourseReviews(course.id);
        
        // 动态计算评分和评价数
        const { displayRating, totalReviewCount } = calculateCourseStats(courseReviews);
        
        return `
        <div class="course-card" data-id="${course.id}">
            <div class="course-card-content">
                <div class="course-card-header">
                    <div>
                        <h3 class="course-title">${course.title}</h3>
                        <div class="course-teacher">${course.teacher}</div>
                    </div>
                    <div class="course-rating">
                        <div class="stars">${generateStars(displayRating)}</div>
                        <span class="rating-score">${displayRating}</span>
                    </div>
                </div>
                <div class="course-meta">
                    <span class="meta-item"><i class="bi bi-building"></i> ${course.department}</span>
                    <span class="meta-item"><i class="bi bi-geo-alt"></i> ${course.campus}</span>
                    <span class="meta-item"><i class="bi bi-tag"></i> ${course.category}</span>
                    <span class="meta-item"><i class="bi bi-chat-dots"></i> ${totalReviewCount}条评价</span>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    // 添加点击事件
    const courseCards = document.querySelectorAll('.course-card');
    courseCards.forEach(card => {
        card.addEventListener('click', () => {
            const courseId = card.dataset.id;
            window.location.href = `course-detail.html?id=${courseId}`;
        });
    });
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