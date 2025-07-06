document.addEventListener('DOMContentLoaded', function() {
    // 初始化工具提示
    initTooltips();
    
    // 初始化图片懒加载
    initLazyLoading();
    
    // 添加卡片点击事件
    initCardClick();

    // 初始化左侧导航栏
    initSideNav();
});

// 初始化工具提示
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            html: tooltipTriggerEl.getAttribute('data-html') === 'true'
        });
    });
}

// 初始化图片懒加载
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img.lazy');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    } else {
        // 降级处理：直接加载所有图片
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
        });
    }
}

// 初始化卡片点击事件
function initCardClick() {
    const cards = document.querySelectorAll('.url-card .card');
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            // 如果点击的是教程链接，不阻止默认行为
            if (e.target.closest('.togo')) {
                return;
            }
            
            const url = this.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank');
            }
        });
    });
}

// 初始化左侧导航栏
function initSideNav() {
    // 处理子菜单展开/收起
    const hasSubmenuItems = document.querySelectorAll('.side-nav-item.has-submenu');
    hasSubmenuItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('active');
            const submenu = this.nextElementSibling;
            if (submenu && submenu.classList.contains('side-nav-submenu')) {
                submenu.classList.toggle('show');
            }
        });
    });

    // 处理回到顶部
    const topButton = document.querySelector('.side-nav-item[data-target="top"]');
    topButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 处理子菜单项点击
    const subItems = document.querySelectorAll('.side-nav-subitem');
    subItems.forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            const targetElement = document.getElementById(target);

            if (targetElement) {
                // 计算目标位置，考虑顶部导航栏的高度
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // 更新激活状态
                subItems.forEach(subItem => subItem.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // 监听滚动事件，更新导航状态
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        let currentSection = null;
        let minDistance = Infinity;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const distance = Math.abs(rect.top - navHeight);

            if (distance < minDistance) {
                minDistance = distance;
                currentSection = section;
            }
        });

        if (currentSection) {
            // 更新子菜单项的激活状态
            subItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-target') === currentSection.id) {
                    item.classList.add('active');
                }
            });
        }
    });
}

// 添加暗色模式切换功能
function toggleDarkMode() {
    document.body.classList.toggle('io-grey-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('io-grey-mode'));
}

// 检查并应用保存的主题设置
function applySavedTheme() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('io-grey-mode');
    }
}

// 页面加载时应用保存的主题
applySavedTheme(); 