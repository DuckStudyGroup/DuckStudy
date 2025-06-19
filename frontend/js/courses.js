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
        
        // 评分条件
        const matchesRating = course.rating >= minRating;
        
        return matchesSearch && matchesCategory && matchesCampus && matchesRating;
    });
    
    // 排序
    filteredCourses.sort((a, b) => {
        if (sortBy === 'rating') {
            return b.rating - a.rating;
        } else if (sortBy === 'reviews') {
            return b.reviewCount - a.reviewCount;
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
    
    // 获取本地保存的评价数据
    let savedReviews = localStorage.getItem('courseReviews');
    let localReviews = savedReviews ? JSON.parse(savedReviews) : [];
    
    coursesContainer.innerHTML = courses.map(course => {
        // 获取所有评价（本地+课程自带）
        let savedReviews = localStorage.getItem('courseReviews');
        let localReviews = savedReviews ? JSON.parse(savedReviews) : [];
        const userReviews = localReviews.filter(r => r.courseId === course.id);
        // 构造所有评价数组
        let allReviews = [];
        for (let i = 0; i < course.reviewCount; i++) {
            allReviews.push({ rating: course.rating });
        }
        allReviews = allReviews.concat(userReviews);
        // 动态计算平均分
        let displayRating = course.rating;
        if (allReviews.length > 0) {
            const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
            displayRating = (totalRating / allReviews.length).toFixed(1);
        }
        const totalReviewCount = allReviews.length;
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