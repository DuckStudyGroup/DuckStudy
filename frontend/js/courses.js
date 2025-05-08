import { userAPI, contentAPI } from './api.js';

// 全局课程数据
let allCourses = [];
let filteredCourses = [];

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 更新用户状态
        await updateUserStatus();
        
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
        
        if (!userSection) {
            console.error('未找到用户区域元素');
            return;
        }
        
        if (response.isLoggedIn) {
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
                                <i class="bi bi-bookmark"></i> 我的收藏
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
                    <span class="username">${response.username}</span>
                </div>
            `;

            // 添加退出登录事件监听
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        await userAPI.logout();
                        window.location.reload();
                    } catch (error) {
                        console.error('退出登录失败:', error);
                        alert('退出登录失败，请重试');
                    }
                });
            }
            
            // 添加头像下拉菜单事件
            const avatarContainer = document.querySelector('.avatar-container');
            if (avatarContainer) {
                avatarContainer.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const dropdownMenu = avatarContainer.querySelector('.dropdown-menu');
                    if (dropdownMenu) {
                        dropdownMenu.classList.toggle('show');
                    }
                });
                
                // 点击其他地方关闭下拉菜单
                document.addEventListener('click', () => {
                    const dropdownMenu = avatarContainer.querySelector('.dropdown-menu');
                    if (dropdownMenu && dropdownMenu.classList.contains('show')) {
                        dropdownMenu.classList.remove('show');
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
        userSection.innerHTML = `
            <a href="login.html" class="btn btn-outline-primary me-2">登录</a>
            <a href="register.html" class="btn btn-primary">注册</a>
        `;
    }
}

// 加载课程数据
async function loadCourses() {
    try {
        // 模拟课程数据
        allCourses = [
            {
                id: 1,
                title: '高等数学(上)',
                teacher: '张明教授',
                rating: 4.8,
                reviewCount: 156,
                department: '数学学院',
                category: '必修',
                campus: '中心校区',
                credits: 4,
                hours: 64,
                semester: '2023-2024学年第一学期',
                location: '教学楼A-301',
                description: '本课程主要研究函数、极限、微积分学的基本概念和计算方法，培养学生的逻辑思维能力和运算能力。'
            },
            {
                id: 2,
                title: '数据结构与算法',
                teacher: '李华教授',
                rating: 4.9,
                reviewCount: 142,
                department: '计算机学院',
                category: '必修',
                campus: '东校区',
                credits: 3,
                hours: 48,
                semester: '2023-2024学年第一学期',
                location: '计算机楼B-201',
                description: '本课程介绍了常用的数据结构和算法设计与分析方法，包括数组、链表、栈、队列、树、图等数据结构，以及排序、搜索等算法。'
            },
            {
                id: 3,
                title: '大学英语(三)',
                teacher: '王丽副教授',
                rating: 4.5,
                reviewCount: 128,
                department: '外国语学院',
                category: '必修',
                campus: '南校区',
                credits: 2,
                hours: 32,
                semester: '2023-2024学年第一学期',
                location: '外语楼C-401',
                description: '本课程旨在进一步提高学生的英语听说读写能力，培养学生的跨文化交际能力，使学生能够用英语有效地进行交流。'
            },
            {
                id: 4,
                title: '人工智能导论',
                teacher: '刘强教授',
                rating: 4.7,
                reviewCount: 94,
                department: '计算机学院',
                category: '选修',
                campus: '中心校区',
                credits: 3,
                hours: 48,
                semester: '2023-2024学年第一学期',
                location: '计算机楼A-505',
                description: '本课程介绍人工智能的基本概念、历史发展、主要方法和应用领域，包括知识表示、搜索方法、机器学习、自然语言处理等。'
            },
            {
                id: 5,
                title: '大学物理(下)',
                teacher: '赵刚教授',
                rating: 4.6,
                reviewCount: 118,
                department: '物理学院',
                category: '必修',
                campus: '北校区',
                credits: 4,
                hours: 64,
                semester: '2023-2024学年第一学期',
                location: '物理楼D-101',
                description: '本课程主要介绍电磁学、光学和近代物理学的基本概念、理论和实验方法，培养学生的科学思维和实验能力。'
            },
            {
                id: 6,
                title: '市场营销学',
                teacher: '周明教授',
                rating: 4.4,
                reviewCount: 86,
                department: '商学院',
                category: '专业',
                campus: '东校区',
                credits: 3,
                hours: 48,
                semester: '2023-2024学年第一学期',
                location: '商学院楼A-201',
                description: '本课程介绍市场营销的基本概念、理论和方法，包括市场环境分析、消费者行为、市场细分、定位、营销组合策略等。'
            },
            {
                id: 7,
                title: '中国文学史',
                teacher: '孙红副教授',
                rating: 4.8,
                reviewCount: 76,
                department: '文学院',
                category: '通识',
                campus: '南校区',
                credits: 2,
                hours: 32,
                semester: '2023-2024学年第一学期',
                location: '人文楼B-301',
                description: '本课程系统介绍中国文学的发展历程，重点讲解各个时期的代表作家、作品及其艺术特色，培养学生的文学鉴赏能力。'
            }
        ];
        
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
        // 生成星级评分HTML
        const starsHtml = generateStars(course.rating);
        
        // 计算用户提交的额外评价数量
        const userReviewCount = localReviews.filter(r => r.courseId === course.id).length;
        const totalReviewCount = course.reviewCount + userReviewCount;
        
        // 如果有用户评价，重新计算平均评分
        let displayRating = course.rating;
        if (userReviewCount > 0) {
            const userReviews = localReviews.filter(r => r.courseId === course.id);
            const totalRating = userReviews.reduce((sum, review) => sum + review.rating, 0) + (course.rating * course.reviewCount);
            displayRating = (totalRating / totalReviewCount).toFixed(1);
        }
        
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