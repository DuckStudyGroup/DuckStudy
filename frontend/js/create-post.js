import { userAPI, contentAPI } from './api.js';
import { updateNavUserStatus } from './nav-utils.js';

// 字符限制常量
const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 5000;
const MAX_TAGS_COUNT = 5;
const MAX_TAG_LENGTH = 10;
const MAX_COVER_IMAGES = 3;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

// 初始化Quill编辑器
let quill;
let imageUploadCount = 0; // 追踪正在上传的图片数量
let coverImages = []; // 存储封面图片

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 检查用户登录状态
        const response = await userAPI.getStatus();
        if (!response.isLoggedIn) {
            alert('请先登录后再发帖');
            window.location.href = 'login.html';
            return;
        }

        // 更新用户状态
        await updateNavUserStatus();
        
        // 初始化富文本编辑器
        initQuillEditor();
        
        // 初始化封面图片上传
        initCoverImageUpload();
        
        // 添加表单提交事件
        addFormEvents();
    } catch (error) {
        console.error('初始化发帖页面失败:', error);
        alert('页面加载失败，请刷新页面重试');
    }
});

// 初始化Quill编辑器
function initQuillEditor() {
    quill = new Quill('#editor-container', {
        modules: {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }], // 标题
                    ['bold', 'italic', 'underline', 'strike'], // 文本格式
                    [{ 'color': [] }, { 'background': [] }], // 颜色
                    [{ 'align': [] }], // 对齐
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }], // 列表
                    ['link', 'image'], // 链接和图片
                    ['clean'] // 清除格式
                ],
                handlers: {
                    'image': imageHandler // 自定义图片处理
                }
            }
        },
        placeholder: '请输入帖子内容（最多5000字符）...',
        theme: 'snow'
    });

    // 字符计数与限制
    const charCounter = document.getElementById('charCount');
    
    quill.on('text-change', function() {
        // 计算纯文本字符数（不包括HTML标签）
        const text = quill.getText();
        const charCount = text.length - 1; // 减去Quill添加的额外换行符
        
        // 更新计数器显示
        charCounter.textContent = charCount;
        
        // 超出字符限制警告
        if (charCount > MAX_CONTENT_LENGTH) {
            charCounter.classList.add('text-danger');
            charCounter.classList.add('fw-bold');
        } else {
            charCounter.classList.remove('text-danger');
            charCounter.classList.remove('fw-bold');
        }
        
        // 将HTML内容存储到隐藏字段
        document.getElementById('content').value = quill.root.innerHTML;
    });
}

// 图片处理函数
function imageHandler() {
    // 如果有太多图片正在上传，阻止新的上传
    if (imageUploadCount >= 5) {
        alert('同时最多上传5张图片，请等待当前上传完成');
        return;
    }

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    
    input.onchange = async function() {
        const file = input.files[0];
        if (file) {
            // 检查文件大小（限制为2MB）
            if (file.size > 2 * 1024 * 1024) {
                alert('图片大小不能超过2MB');
                return;
            }
            
            // 检查文件类型
            if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
                alert('只支持JPG、PNG、GIF和WEBP格式的图片');
                return;
            }
            
            // 创建上传进度指示
            const range = quill.getSelection();
            const placeholderId = 'img-' + Date.now();
            
            // 插入上传中的提示和进度条占位符
            quill.insertText(range.index, '图片上传中...');
            const uploadingTextLength = '图片上传中...'.length;
            
            // 增加上传计数
            imageUploadCount++;
            
            try {
                // 生成文件名
                const timestamp = Date.now();
                const randomStr = Math.random().toString(36).substring(2, 8);
                const extension = file.name.split('.').pop();
                const filename = `post_${timestamp}_${randomStr}.${extension}`;
                
                // 创建FormData对象
                const formData = new FormData();
                formData.append('image', file);
                formData.append('filename', filename);
                
                // 发送到后端保存图片
                const response = await fetch('/api/upload-image', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('图片上传失败');
                }
                
                const data = await response.json();
                const imageUrl = data.imageUrl;
                
                // 上传成功后，删除"上传中"文本
                quill.deleteText(range.index, uploadingTextLength);
                
                // 插入图片
                quill.insertEmbed(range.index, 'image', imageUrl);
                
                // 添加一个换行
                quill.insertText(range.index + 1, '\n');
                
                // 更新编辑器内容到隐藏字段
                document.getElementById('content').value = quill.root.innerHTML;
            } catch (error) {
                console.error('图片上传失败:', error);
                
                // 删除"上传中"文本
                quill.deleteText(range.index, uploadingTextLength);
                
                // 在光标位置插入错误信息
                quill.insertText(range.index, '图片上传失败，请重试', {
                    'color': '#dc3545',
                    'italic': true
                });
            } finally {
                // 减少上传计数
                imageUploadCount--;
            }
        }
    };
}

// 添加表单提交事件
function addFormEvents() {
    const form = document.getElementById('createPostForm');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // 如果有图片正在上传，等待完成
            if (imageUploadCount > 0) {
                alert('请等待图片上传完成后再提交');
                return;
            }
            
            try {
                const title = document.getElementById('title').value.trim();
                const category = document.getElementById('category').value;
                const content = document.getElementById('content').value;
                const tagsInput = document.getElementById('tags').value.trim();
                
                // 标题验证
                if (!title) {
                    alert('请输入帖子标题');
        return;
    }

                // 分类验证
                if (!category) {
                    alert('请选择帖子分类');
                    return;
                }
                
                // 内容验证
                if (!content || quill.getText().trim().length <= 1) {
                    alert('请输入帖子内容');
                    return;
                }
                
                // 内容长度验证
                const textLength = quill.getText().length - 1;
                if (textLength > MAX_CONTENT_LENGTH) {
                    alert(`内容超出${MAX_CONTENT_LENGTH}字符限制，请精简内容`);
            return;
        }
        
                // 处理标签
                let tags = [];
                if (tagsInput) {
                    tags = tagsInput.split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0);
                    
                    // 验证标签数量
                    if (tags.length > MAX_TAGS_COUNT) {
                        alert(`最多添加${MAX_TAGS_COUNT}个标签`);
            return;
        }
        
                    // 验证标签长度
                    for (const tag of tags) {
                        if (tag.length > MAX_TAG_LENGTH) {
                            alert(`标签"${tag}"超出${MAX_TAG_LENGTH}个字符限制`);
                            return;
                        }
                    }
                }

                // 获取当前用户信息
                const userResponse = await userAPI.getStatus();
                
                // 创建帖子对象
                const post = {
                    id: Date.now(),
            title: title,
            author: userResponse.username,
                    category: category,
                    content: content,
            date: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
            }),
                    tags: tags,
            views: 0,
            likes: 0,
                    favorites: 0,
                    coverImages: coverImages.length > 0 ? coverImages.map(img => img.url) : []
                };
                
                // 发送API请求创建帖子
                const response = await contentAPI.createPost(post);
                
                if (response && response.success) {
                    alert('发布成功！');
                window.location.href = 'posts.html';
            } else {
                    alert(response.message || '发布失败，请重试');
            }
        } catch (error) {
                console.error('发布帖子失败:', error);
                alert('发布帖子失败，请重试');
        }
    });
}
}

// 初始化封面图片上传
function initCoverImageUpload() {
    const coverImageUpload = document.getElementById('coverImageUpload');
    const coverImagesPreview = document.getElementById('coverImagesPreview');
    
    if (!coverImageUpload || !coverImagesPreview) {
        console.error('未找到封面图片上传元素');
        return;
    }

    // 监听文件选择变化
    coverImageUpload.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        
        // 检查已有图片数量
        if (coverImages.length + files.length > MAX_COVER_IMAGES) {
            alert(`最多只能上传${MAX_COVER_IMAGES}张封面图片`);
            return;
        }
        
        // 处理每个选择的文件
        for (const file of files) {
            // 检查文件大小
            if (file.size > MAX_IMAGE_SIZE) {
                alert(`图片 ${file.name} 太大，请选择小于2MB的图片`);
                continue;
            }
            
            // 检查文件类型
            if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
                alert(`不支持的图片格式: ${file.name}，请使用JPG或PNG格式`);
                continue;
            }
            
            try {
                // 读取文件并创建预览
                const imageUrl = await readFileAsDataURL(file);
                
                // 添加到封面图片数组
                const imageId = Date.now() + Math.random().toString(36).substring(2, 9);
                coverImages.push({
                    id: imageId,
                    file: file,
                    url: imageUrl
                });
                
                // 更新预览区域
                updateCoverImagePreview();
                
                // 更新隐藏输入字段
                updateCoverImagesInput();
            } catch (error) {
                console.error('读取封面图片失败:', error);
                alert('读取图片失败，请重试');
            }
        }
        
        // 清除文件输入，允许重新选择相同的文件
        coverImageUpload.value = '';
    });
}

// 更新封面图片预览
function updateCoverImagePreview() {
    const coverImagesPreview = document.getElementById('coverImagesPreview');
    
    if (!coverImagesPreview) return;
    
    // 清空预览区域
    coverImagesPreview.innerHTML = '';
    
    // 添加每个图片的预览
    coverImages.forEach(image => {
        if (!image || !image.url || typeof image.url !== 'string') {
            console.warn('跳过无效的图片数据');
            return;
        }
        
        // 确保URL是干净的字符串
        const safeUrl = image.url.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // 使用DOM API创建元素，避免HTML注入问题
        const imageItem = document.createElement('div');
        imageItem.className = 'cover-image-item';
        
        // 创建图片元素
        const imgElement = document.createElement('img');
        imgElement.src = safeUrl;
        imgElement.alt = "封面图片";
        imageItem.appendChild(imgElement);
        
        // 创建删除按钮
        const removeBtn = document.createElement('button');
        removeBtn.type = "button";
        removeBtn.className = "remove-btn";
        removeBtn.dataset.id = image.id;
        removeBtn.innerHTML = '<i class="bi bi-x"></i>';
        removeBtn.addEventListener('click', () => removeCoverImage(image.id));
        
        imageItem.appendChild(removeBtn);
        coverImagesPreview.appendChild(imageItem);
    });
    
    // 如果达到最大数量，隐藏上传按钮
    const addCoverImageBtn = document.getElementById('addCoverImageBtn');
    if (addCoverImageBtn) {
        addCoverImageBtn.style.display = coverImages.length >= MAX_COVER_IMAGES ? 'none' : 'inline-block';
    }
}

// 移除封面图片
function removeCoverImage(imageId) {
    // 从数组中移除图片
    coverImages = coverImages.filter(img => img.id !== imageId);
    
    // 更新预览
    updateCoverImagePreview();
    
    // 更新隐藏输入字段
    updateCoverImagesInput();
}

// 更新隐藏的封面图片输入字段
function updateCoverImagesInput() {
    const coverImagesInput = document.getElementById('coverImages');
    if (coverImagesInput) {
        // 确保只保存有效的图片URL
        const validUrls = coverImages
            .filter(img => img && typeof img.url === 'string' && img.url.trim() !== '')
            .map(img => img.url);
        coverImagesInput.value = JSON.stringify(validUrls);
    }
}

// 读取文件为Data URL
async function readFileAsDataURL(file) {
    try {
        // 生成文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop();
        const filename = `post_${timestamp}_${randomStr}.${extension}`;
        
        // 创建FormData对象
        const formData = new FormData();
        formData.append('image', file);
        formData.append('filename', filename);
        
        // 发送到后端保存图片
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('图片上传失败');
        }
        
        const data = await response.json();
        return data.imageUrl; // 返回图片URL
    } catch (error) {
        console.error('图片上传失败:', error);
        throw error;
    }
} 