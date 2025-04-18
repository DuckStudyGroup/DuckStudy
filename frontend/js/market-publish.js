import { userAPI, contentAPI } from './api.js';

// 商品发布页面脚本
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 首先检查用户登录状态
    const userResponse = await userAPI.getStatus();
    if (!userResponse.isLoggedIn) {
      alert('请先登录后再发布商品');
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }
    
    // 初始化表单处理
    setupFormHandlers();
    
    // 初始化图片上传
    initImageUpload();
    
    // 更新用户状态显示
    updateUserStatus();
  } catch (error) {
    console.error('初始化页面失败:', error);
    alert('加载页面失败，请刷新重试');
  }
});

// 更新用户状态
async function updateUserStatus() {
  try {
    const userResponse = await userAPI.getStatus();
    const userSection = document.getElementById('userSection');
    
    if (!userSection) return;
    
    if (userResponse.isLoggedIn) {
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
          <span class="username">${userResponse.username}</span>
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
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
    }
  } catch (error) {
    console.error('获取用户状态失败:', error);
  }
}

// 设置表单处理程序
function setupFormHandlers() {
  const publishForm = document.getElementById('publishForm');
  const previewBtn = document.getElementById('previewBtn');
  const submitBtn = document.getElementById('submitBtn');
  const confirmPublishBtn = document.getElementById('confirmPublishBtn');
  
  // 预览按钮点击事件
  if (previewBtn) {
    previewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (validateForm()) {
        showPreview();
      }
    });
  }
  
  // 表单提交事件
  if (publishForm) {
    publishForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateForm()) {
        publishProduct();
      }
    });
  }
  
  // 确认发布按钮点击事件
  if (confirmPublishBtn) {
    confirmPublishBtn.addEventListener('click', () => {
      publishProduct();
    });
  }
}

// 验证表单
function validateForm() {
  const form = document.getElementById('publishForm');
  
  // 使用HTML5表单验证
  if (!form.checkValidity()) {
    // 触发浏览器的表单验证
    form.reportValidity();
    return false;
  }
  
  // 附加验证
  const price = parseFloat(document.getElementById('price').value);
  if (isNaN(price) || price <= 0) {
    alert('请输入有效的价格！');
    return false;
  }
  
  // 验证图片
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  if (imagePreviewContainer && imagePreviewContainer.children.length === 0) {
    alert('请至少上传一张商品图片！');
    return false;
  }
  
  return true;
}

// 初始化图片上传
function initImageUpload() {
  const imageInput = document.getElementById('imageInput');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  
  if (!imageInput || !imagePreviewContainer) return;
  
  // 图片选择后的处理
  imageInput.addEventListener('change', function() {
    const files = Array.from(this.files);
    
    // 限制最多上传3张图片
    const currentCount = imagePreviewContainer.children.length;
    if (currentCount + files.length > 3) {
      alert('最多只能上传3张图片！');
      return;
    }
    
    // 处理每个选择的文件
    files.forEach(file => {
      if (!file.type.match('image.*')) {
        alert('请选择图片文件！');
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = function(e) {
        // 创建预览元素
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = '商品图片';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.type = 'button';
        removeBtn.innerHTML = '<i class="bi bi-x-circle"></i>';
        removeBtn.addEventListener('click', function() {
          imagePreviewContainer.removeChild(previewItem);
        });
        
        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        imagePreviewContainer.appendChild(previewItem);
      };
      
      reader.readAsDataURL(file);
    });
    
    // 清空文件输入，以便可以再次选择相同的文件
    this.value = '';
  });
}

// 显示商品预览
function showPreview() {
  const modal = new bootstrap.Modal(document.getElementById('previewModal'));
  const previewBody = document.getElementById('previewBody');
  
  // 获取表单数据
  const title = document.getElementById('title').value;
  const category = document.getElementById('category').value;
  const price = document.getElementById('price').value;
  const condition = document.getElementById('condition').value;
  const location = document.getElementById('location').value;
  const contact = document.getElementById('contact').value;
  const description = document.getElementById('description').value;
  
  // 获取图片
  const images = [];
  const previewImages = document.querySelectorAll('#imagePreviewContainer img');
  previewImages.forEach(img => {
    images.push(img.src);
  });
  
  // 构建预览HTML
  let previewHTML = `
    <div class="preview-container">
      <div class="preview-images">
        ${images.map(src => `<img src="${src}" alt="商品图片">`).join('')}
      </div>
      <div class="preview-details">
        <h3>${title}</h3>
        <div class="preview-price">¥${price}</div>
        <div class="preview-info">
          <div><strong>分类：</strong>${getCategoryText(category)}</div>
          <div><strong>成色：</strong>${condition}</div>
          <div><strong>交易地点：</strong>${location}</div>
          <div><strong>联系方式：</strong>${contact}</div>
        </div>
        <div class="preview-description">
          <h4>商品描述</h4>
          <p>${description.replace(/\n/g, '<br>')}</p>
        </div>
      </div>
    </div>
  `;
  
  previewBody.innerHTML = previewHTML;
  modal.show();
}

// 获取分类文本
function getCategoryText(value) {
  const categoryMap = {
    'textbook': '教材教辅',
    'electronics': '电子产品',
    'study': '学习用品',
    'life': '生活用品',
    'others': '其他'
  };
  
  return categoryMap[value] || value;
}

// 发布商品
async function publishProduct() {
  try {
    // 获取用户信息
    const userResponse = await userAPI.getStatus();
    if (!userResponse.isLoggedIn) {
      alert('请先登录后再发布商品');
      window.location.href = 'login.html';
      return;
    }
    
    // 获取表单数据
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const price = parseFloat(document.getElementById('price').value);
    const condition = document.getElementById('condition').value;
    const location = document.getElementById('location').value;
    const contact = document.getElementById('contact').value;
    const description = document.getElementById('description').value;
    
    // 获取图片
    const images = [];
    const previewImages = document.querySelectorAll('#imagePreviewContainer img');
    previewImages.forEach(img => {
      images.push(img.src);
    });
    
    // 创建商品数据
    const itemData = {
      title,
      price,
      description,
      category,
      location,
      seller: userResponse.username,
      contact,
      date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/'),
      images,
      condition,
      views: 0,
      favorites: 0
    };
    
    // 调用API创建商品
    const response = await contentAPI.createMarketItem(itemData);
    
    if (response.success) {
      alert('商品发布成功！');
      window.location.href = 'market.html';
    } else {
      alert('发布失败：' + response.message);
    }
  } catch (error) {
    console.error('发布商品失败:', error);
    alert('发布失败，请稍后重试');
  }
} 