import requests
from typing import Dict, List, Optional
from config.config import GITHUB_API_URL, GITHUB_TOKEN, API_RATE_LIMIT
from utils.cache import cached
import datetime
import json
import os

# 获取当前文件所在目录的父目录的父目录（项目根目录）
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class GitHubService:
    def __init__(self):
        # 如果提供了Token，则使用，否则不添加授权头
        if GITHUB_TOKEN and GITHUB_TOKEN != 'your_github_token_here':
            self.headers = {
                'Authorization': f'token {GITHUB_TOKEN}',
                'Accept': 'application/vnd.github.v3+json'
            }
        else:
            self.headers = {
                'Accept': 'application/vnd.github.v3+json'
            }
            print("警告：未提供GitHub Token或Token无效，API请求将受到更严格的速率限制")

    @cached(ttl=3600)
    def get_user_repos(self, username: str) -> List[Dict]:
        """获取用户的仓库列表"""
        try:
            url = f"{GITHUB_API_URL}/users/{username}/repos"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"获取用户仓库失败: {str(e)}")
            # 返回模拟数据
            return self._get_mock_user_repos(username)

    @cached(ttl=3600)
    def get_repo_info(self, owner: str, repo: str) -> Dict:
        """获取仓库详细信息"""
        try:
            url = f"{GITHUB_API_URL}/repos/{owner}/{repo}"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"获取仓库信息失败: {str(e)}")
            # 返回模拟数据
            return self._get_mock_repo_info(owner, repo)

    @cached(ttl=3600)
    def get_repo_languages(self, owner: str, repo: str) -> Dict:
        """获取仓库使用的编程语言"""
        try:
            url = f"{GITHUB_API_URL}/repos/{owner}/{repo}/languages"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"获取仓库语言失败: {str(e)}")
            # 返回模拟数据
            return {"JavaScript": 100000, "HTML": 50000, "CSS": 30000}

    @cached(ttl=3600)
    def get_repo_contributors(self, owner: str, repo: str) -> List[Dict]:
        """获取仓库贡献者列表"""
        try:
            url = f"{GITHUB_API_URL}/repos/{owner}/{repo}/contributors"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"获取仓库贡献者失败: {str(e)}")
            # 返回模拟数据
            return [
                {"login": "user1", "avatar_url": "https://placehold.jp/32x32.png", "contributions": 100},
                {"login": "user2", "avatar_url": "https://placehold.jp/32x32.png", "contributions": 50}
            ]

    @cached(ttl=1800)  # 缓存30分钟
    def get_trending_repos(self, time_range: str = 'all', language: str = None, page: int = 1) -> List[Dict]:
        """
        获取GitHub热门仓库
        
        Args:
            time_range: 时间范围，可选值: 'week', 'month', 'year', 'all'
            language: 编程语言过滤
            page: 页码，从1开始
            
        Returns:
            热门仓库列表
        """
        try:
            # 基础查询参数：按Star数量排序
            query_params = {
                'sort': 'stars',
                'order': 'desc',
                'per_page': 10,
                'page': page
            }
            
            # 根据时间范围设置查询条件
            if time_range != 'all':
                today = datetime.datetime.now()
                
                if time_range == 'week':
                    # 一周前的日期
                    date = today - datetime.timedelta(days=7)
                elif time_range == 'month':
                    # 一个月前的日期
                    date = today - datetime.timedelta(days=30)
                elif time_range == 'year':
                    # 一年前的日期
                    date = today - datetime.timedelta(days=365)
                else:
                    date = None
                    
                if date:
                    # 格式化日期为 YYYY-MM-DD
                    query_params['q'] = f'created:>{date.strftime("%Y-%m-%d")}'
            
            # 添加语言过滤
            if language:
                if 'q' in query_params:
                    query_params['q'] += f' language:{language}'
                else:
                    query_params['q'] = f'language:{language}'
            
            # 如果没有q参数，添加星星数大于100的条件
            if 'q' not in query_params:
                query_params['q'] = 'stars:>100'
            
            url = f"{GITHUB_API_URL}/search/repositories"
            response = requests.get(url, headers=self.headers, params=query_params)
            response.raise_for_status()
            
            result = response.json()
            return result.get('items', [])
            
        except Exception as e:
            print(f"获取热门仓库失败: {str(e)}")
            # 返回模拟数据
            return self._get_mock_trending_repos(time_range, language, page)

    def check_rate_limit(self) -> Dict:
        """检查API速率限制"""
        try:
            url = f"{GITHUB_API_URL}/rate_limit"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"检查API速率限制失败: {str(e)}")
            return {
                "resources": {
                    "core": {"limit": 60, "used": 0, "remaining": 60, "reset": 0},
                    "search": {"limit": 10, "used": 0, "remaining": 10, "reset": 0}
                },
                "rate": {"limit": 60, "used": 0, "remaining": 60, "reset": 0}
            }

    @cached(ttl=86400)  # 缓存24小时
    def get_common_projects(self, tech: str = 'all', project_type: str = 'all') -> List[Dict]:
        """
        获取特定技术栈和项目类型的常用GitHub项目
        
        Args:
            tech: 技术栈，例如 'python', 'javascript', 'java', 'c++'
            project_type: 项目类型，例如 'web', 'mobile', 'desktop', 'game'
            
        Returns:
            项目列表
        """
        try:
            # 构建查询参数
            query_parts = []
            
            # 添加技术栈筛选
            if tech != 'all':
                query_parts.append(f"language:{tech}")
            
            # 添加项目类型相关关键词
            if project_type != 'all':
                if project_type == 'web':
                    query_parts.append("topic:web OR web-app OR web-development")
                elif project_type == 'mobile':
                    query_parts.append("topic:mobile OR android OR ios OR flutter")
                elif project_type == 'desktop':
                    query_parts.append("topic:desktop OR electron OR qt")
                elif project_type == 'game':
                    query_parts.append("topic:game OR game-development OR game-engine")
            
            # 添加基础过滤条件：星星数 > 1000
            query_parts.append("stars:>1000")
            
            # 构建完整查询字符串
            query = " ".join(query_parts)
            
            # 准备请求参数
            params = {
                'q': query,
                'sort': 'stars',
                'order': 'desc',
                'per_page': 20
            }
            
            # 发送请求
            url = f"{GITHUB_API_URL}/search/repositories"
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            result = response.json()
            return result.get('items', [])
            
        except Exception as e:
            print(f"获取常用项目失败: {str(e)}")
            # 返回模拟数据
            return self._get_mock_common_projects(tech, project_type)

    def _get_mock_trending_repos(self, time_range: str, language: str = None, page: int = 1) -> List[Dict]:
        """获取模拟的热门仓库数据"""
        # 根据时间范围调整数据
        time_suffix = ""
        if time_range == 'week':
            time_suffix = " (本周热门)"
        elif time_range == 'month':
            time_suffix = " (本月热门)"
        elif time_range == 'year':
            time_suffix = " (今年热门)"
        
        # 尝试从JSON文件读取模拟数据
        try:
            mock_file = os.path.join(BASE_DIR, 'frontend', 'data', 'mock_repos.json')
            if os.path.exists(mock_file):
                with open(mock_file, 'r', encoding='utf-8') as f:
                    mock_data = json.load(f)
                
                # 实现分页
                page_size = 10
                start_idx = (page - 1) * page_size
                end_idx = start_idx + page_size
                return mock_data[start_idx:end_idx]
        except Exception as e:
            print(f"读取模拟仓库数据失败: {str(e)}")
        
        # 默认模拟数据 - 使用当前GitHub trending项目
        all_repos = [
            {
                "id": 1,
                "name": f"ai-hedge-fund{time_suffix}",
                "owner": {"login": "virattt"},
                "html_url": "https://github.com/virattt/ai-hedge-fund",
                "description": "一个AI对冲基金团队，专注于使用人工智能技术进行投资决策",
                "stargazers_count": 23308,
                "forks_count": 4088,
                "language": "Python"
            },
            {
                "id": 2,
                "name": f"Awesome-Dify-Workflow{time_suffix}",
                "owner": {"login": "svcvit"},
                "html_url": "https://github.com/svcvit/Awesome-Dify-Workflow",
                "description": "分享一些好用的 Dify DSL 工作流程，自用、学习两相宜。",
                "stargazers_count": 5841,
                "forks_count": 579,
                "language": "Markdown"
            },
            {
                "id": 3,
                "name": f"vanna{time_suffix}",
                "owner": {"login": "vanna-ai"},
                "html_url": "https://github.com/vanna-ai/vanna",
                "description": "🤖 与您的SQL数据库聊天 📊。通过RAG使用LLMs实现准确的文本到SQL生成",
                "stargazers_count": 15745,
                "forks_count": 1408,
                "language": "Python"
            },
            {
                "id": 4,
                "name": f"meeting-minutes{time_suffix}",
                "owner": {"login": "Zackriya-Solutions"},
                "html_url": "https://github.com/Zackriya-Solutions/meeting-minutes",
                "description": "一个免费开源的、自托管的基于AI的实时会议笔记记录器和会议纪要生成器",
                "stargazers_count": 3180,
                "forks_count": 219,
                "language": "C++"
            },
            {
                "id": 5,
                "name": f"og-equity-compensation{time_suffix}",
                "owner": {"login": "jlevy"},
                "html_url": "https://github.com/jlevy/og-equity-compensation",
                "description": "股票期权、RSU、税收 — 阅读最新版本",
                "stargazers_count": 10854,
                "forks_count": 516,
                "language": "Markdown"
            },
            {
                "id": 6,
                "name": f"cursor-free-vip{time_suffix}",
                "owner": {"login": "yeongpin"},
                "html_url": "https://github.com/yeongpin/cursor-free-vip",
                "description": "Cursor AI 机器ID重置和绕过更高的令牌限制",
                "stargazers_count": 17613,
                "forks_count": 2097,
                "language": "Python"
            },
            {
                "id": 7,
                "name": f"netdata{time_suffix}",
                "owner": {"login": "netdata"},
                "html_url": "https://github.com/netdata/netdata",
                "description": "为您的基础设施提供X射线视觉效果！",
                "stargazers_count": 74254,
                "forks_count": 6046,
                "language": "C"
            },
            {
                "id": 8,
                "name": f"fiber{time_suffix}",
                "owner": {"login": "gofiber"},
                "html_url": "https://github.com/gofiber/fiber",
                "description": "⚡️ Express风格的Go语言web框架",
                "stargazers_count": 36086,
                "forks_count": 1760,
                "language": "Go"
            },
            {
                "id": 9,
                "name": f"ai-agents-for-beginners{time_suffix}",
                "owner": {"login": "microsoft"},
                "html_url": "https://github.com/microsoft/ai-agents-for-beginners",
                "description": "10堂课程帮助您开始构建AI代理",
                "stargazers_count": 15117,
                "forks_count": 3625,
                "language": "Jupyter Notebook"
            },
            {
                "id": 10,
                "name": f"nautilus_trader{time_suffix}",
                "owner": {"login": "nautechsystems"},
                "html_url": "https://github.com/nautechsystems/nautilus_trader",
                "description": "高性能算法交易平台和事件驱动的回测器",
                "stargazers_count": 5482,
                "forks_count": 788,
                "language": "Python"
            },
            {
                "id": 11,
                "name": f"fumadocs{time_suffix}",
                "owner": {"login": "fuma-nama"},
                "html_url": "https://github.com/fuma-nama/fumadocs",
                "description": "漂亮的Next.js文档框架",
                "stargazers_count": 4641,
                "forks_count": 262,
                "language": "TypeScript"
            },
            {
                "id": 12,
                "name": f"KrillinAI{time_suffix}",
                "owner": {"login": "krillinai"},
                "html_url": "https://github.com/krillinai/KrillinAI",
                "description": "一个视频翻译和配音工具，由LLM提供支持，可生成适用于YouTube、TikTok和Shorts等平台的内容",
                "stargazers_count": 4702,
                "forks_count": 348,
                "language": "Go"
            },
            {
                "id": 13,
                "name": f"aoi{time_suffix}",
                "owner": {"login": "microsoft"},
                "html_url": "https://github.com/microsoft/aoi",
                "description": "使用AOI内容过滤系统保护应用程序",
                "stargazers_count": 4602,
                "forks_count": 348,
                "language": "Python"
            },
            {
                "id": 14,
                "name": f"ente{time_suffix}",
                "owner": {"login": "ente-io"},
                "html_url": "https://github.com/ente-io/ente",
                "description": "完全加密的照片和文件管理器",
                "stargazers_count": 3602,
                "forks_count": 248,
                "language": "Dart"
            },
            {
                "id": 15,
                "name": f"vue-terminal{time_suffix}",
                "owner": {"login": "dongsuo"},
                "html_url": "https://github.com/dongsuo/vue-terminal",
                "description": "基于Vue的网页终端模拟器",
                "stargazers_count": 562,
                "forks_count": 148,
                "language": "Vue"
            },
            {
                "id": 16,
                "name": f"terminal-copilot{time_suffix}",
                "owner": {"login": "nvim-jo"},
                "html_url": "https://github.com/nvim-jo/terminal-copilot",
                "description": "AI增强的终端助手",
                "stargazers_count": 1602,
                "forks_count": 88,
                "language": "Python"
            },
            {
                "id": 17,
                "name": f"pdfplumber{time_suffix}",
                "owner": {"login": "jsvine"},
                "html_url": "https://github.com/jsvine/pdfplumber",
                "description": "从PDF文件中提取信息的Python库",
                "stargazers_count": 4312,
                "forks_count": 438,
                "language": "Python"
            },
            {
                "id": 18,
                "name": f"playwright{time_suffix}",
                "owner": {"login": "microsoft"},
                "html_url": "https://github.com/microsoft/playwright",
                "description": "跨浏览器Web测试和自动化框架",
                "stargazers_count": 58312,
                "forks_count": 2438,
                "language": "TypeScript"
            },
            {
                "id": 19,
                "name": f"stable-diffusion-xl-demo{time_suffix}",
                "owner": {"login": "huggingface"},
                "html_url": "https://github.com/huggingface/stable-diffusion-xl-demo",
                "description": "Stable Diffusion XL演示和调整",
                "stargazers_count": 3312,
                "forks_count": 438,
                "language": "Python"
            },
            {
                "id": 20,
                "name": f"upscayl{time_suffix}",
                "owner": {"login": "upscayl"},
                "html_url": "https://github.com/upscayl/upscayl",
                "description": "使用AI轻松放大图像",
                "stargazers_count": 22312,
                "forks_count": 1438,
                "language": "TypeScript"
            }
        ]
        
        # 实现分页
        page_size = 10
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        # 如果请求的页码超出范围，返回空列表
        if start_idx >= len(all_repos):
            return []
            
        return all_repos[start_idx:end_idx]

    def _get_mock_common_projects(self, tech: str, project_type: str) -> List[Dict]:
        """获取模拟的常用项目数据"""
        # 基础项目列表
        all_projects = [
            # Python - Web
            {
                "id": 1, "name": "flask", "owner": {"login": "pallets"},
                "html_url": "https://github.com/pallets/flask",
                "description": "轻量级的Python Web框架",
                "stargazers_count": 60000, "forks_count": 15000, "language": "Python", 
                "topics": ["web", "framework", "python"]
            },
            {
                "id": 2, "name": "django", "owner": {"login": "django"},
                "html_url": "https://github.com/django/django",
                "description": "高级Python Web框架",
                "stargazers_count": 65000, "forks_count": 28000, "language": "Python",
                "topics": ["web", "framework", "python"]
            },
            {
                "id": 3, "name": "fastapi", "owner": {"login": "tiangolo"},
                "html_url": "https://github.com/tiangolo/fastapi",
                "description": "高性能的Python API框架，易于学习且快速开发",
                "stargazers_count": 58000, "forks_count": 4800, "language": "Python",
                "topics": ["web", "framework", "python", "api"]
            },
            # JavaScript - Web
            {
                "id": 4, "name": "react", "owner": {"login": "facebook"},
                "html_url": "https://github.com/facebook/react",
                "description": "用于构建用户界面的JavaScript库",
                "stargazers_count": 200000, "forks_count": 40000, "language": "JavaScript",
                "topics": ["web", "framework", "javascript", "frontend"]
            },
            {
                "id": 5, "name": "vue", "owner": {"login": "vuejs"},
                "html_url": "https://github.com/vuejs/vue",
                "description": "渐进式JavaScript框架",
                "stargazers_count": 200000, "forks_count": 32000, "language": "JavaScript",
                "topics": ["web", "framework", "javascript", "frontend"]
            },
            {
                "id": 6, "name": "next.js", "owner": {"login": "vercel"},
                "html_url": "https://github.com/vercel/next.js",
                "description": "React框架，用于生产环境的全栈Web应用",
                "stargazers_count": 106000, "forks_count": 23500, "language": "JavaScript",
                "topics": ["web", "framework", "javascript", "react"]
            },
            # Java - Web & Mobile
            {
                "id": 7, "name": "spring-boot", "owner": {"login": "spring-projects"},
                "html_url": "https://github.com/spring-projects/spring-boot",
                "description": "简化Spring应用开发的框架",
                "stargazers_count": 66000, "forks_count": 39000, "language": "Java",
                "topics": ["web", "framework", "java"]
            },
            {
                "id": 8, "name": "android", "owner": {"login": "android"},
                "html_url": "https://github.com/android/android-ktx",
                "description": "Android开发工具集",
                "stargazers_count": 10000, "forks_count": 2000, "language": "Java",
                "topics": ["mobile", "android", "java"]
            },
            # C++ - Desktop & Game
            {
                "id": 9, "name": "electron", "owner": {"login": "electron"},
                "html_url": "https://github.com/electron/electron",
                "description": "使用JavaScript构建跨平台桌面应用",
                "stargazers_count": 100000, "forks_count": 17000, "language": "C++",
                "topics": ["desktop", "javascript", "c++"]
            },
            {
                "id": 10, "name": "godot", "owner": {"login": "godotengine"},
                "html_url": "https://github.com/godotengine/godot",
                "description": "开源游戏引擎",
                "stargazers_count": 50000, "forks_count": 10000, "language": "C++",
                "topics": ["game", "engine", "c++"]
            },
            {
                "id": 11, "name": "UnrealEngine", "owner": {"login": "EpicGames"},
                "html_url": "https://github.com/EpicGames/UnrealEngine",
                "description": "虚幻引擎是一个完整的游戏开发工具套件",
                "stargazers_count": 68000, "forks_count": 18000, "language": "C++",
                "topics": ["game", "engine", "c++", "graphics"]
            },
            # Python - AI & ML
            {
                "id": 12, "name": "tensorflow", "owner": {"login": "tensorflow"},
                "html_url": "https://github.com/tensorflow/tensorflow",
                "description": "Google的开源机器学习框架",
                "stargazers_count": 170000, "forks_count": 87000, "language": "Python",
                "topics": ["ai", "machine-learning", "python"]
            },
            {
                "id": 13, "name": "pytorch", "owner": {"login": "pytorch"},
                "html_url": "https://github.com/pytorch/pytorch",
                "description": "PyTorch是一个开源机器学习框架",
                "stargazers_count": 61000, "forks_count": 17000, "language": "Python",
                "topics": ["ai", "machine-learning", "python", "deep-learning"]
            },
            # JavaScript - Mobile
            {
                "id": 14, "name": "react-native", "owner": {"login": "facebook"},
                "html_url": "https://github.com/facebook/react-native",
                "description": "使用React构建原生应用的框架",
                "stargazers_count": 105000, "forks_count": 23000, "language": "JavaScript",
                "topics": ["mobile", "react", "javascript"]
            },
            {
                "id": 15, "name": "flutter", "owner": {"login": "flutter"},
                "html_url": "https://github.com/flutter/flutter",
                "description": "Google的UI工具包，用于构建跨平台应用",
                "stargazers_count": 149000, "forks_count": 24000, "language": "Dart",
                "topics": ["mobile", "desktop", "web", "ui"]
            },
            # 工具类项目
            {
                "id": 16, "name": "joplin", "owner": {"login": "laurent22"},
                "html_url": "https://github.com/laurent22/joplin",
                "description": "开源笔记和待办事项应用，支持Markdown编辑和同步",
                "stargazers_count": 36000, "forks_count": 3800, "language": "TypeScript",
                "topics": ["notes", "tool", "productivity"]
            },
            {
                "id": 17, "name": "notable", "owner": {"login": "notable"},
                "html_url": "https://github.com/notable/notable",
                "description": "基于Markdown的笔记应用，专注于简单性和可扩展性",
                "stargazers_count": 20000, "forks_count": 1100, "language": "TypeScript",
                "topics": ["notes", "tool", "markdown"]
            },
            {
                "id": 18, "name": "excalidraw", "owner": {"login": "excalidraw"},
                "html_url": "https://github.com/excalidraw/excalidraw",
                "description": "手绘风格的图表和白板工具",
                "stargazers_count": 51000, "forks_count": 4700, "language": "TypeScript",
                "topics": ["drawing", "tool", "whiteboard"]
            },
            {
                "id": 19, "name": "drawio", "owner": {"login": "jgraph"},
                "html_url": "https://github.com/jgraph/drawio",
                "description": "专业的在线图表绘制工具",
                "stargazers_count": 34000, "forks_count": 7500, "language": "JavaScript",
                "topics": ["drawing", "tool", "diagram"]
            },
            {
                "id": 20, "name": "simplenote-electron", "owner": {"login": "Automattic"},
                "html_url": "https://github.com/Automattic/simplenote-electron",
                "description": "简单的跨平台便签应用",
                "stargazers_count": 3800, "forks_count": 610, "language": "JavaScript",
                "topics": ["notes", "tool", "electron"]
            },
            {
                "id": 21, "name": "marktext", "owner": {"login": "marktext"},
                "html_url": "https://github.com/marktext/marktext",
                "description": "下一代Markdown编辑器",
                "stargazers_count": 39000, "forks_count": 3000, "language": "JavaScript",
                "topics": ["markdown", "editor", "tool"]
            },
            # 游戏引擎和游戏开发
            {
                "id": 22, "name": "unity", "owner": {"login": "Unity-Technologies"},
                "html_url": "https://github.com/Unity-Technologies/UnityCsReference",
                "description": "Unity引擎C#参考代码",
                "stargazers_count": 9200, "forks_count": 2600, "language": "C#",
                "topics": ["game", "engine", "unity", "c-sharp"]
            },
            {
                "id": 23, "name": "phaser", "owner": {"login": "photonstorm"},
                "html_url": "https://github.com/photonstorm/phaser",
                "description": "快速、免费、有趣的HTML5游戏框架",
                "stargazers_count": 33000, "forks_count": 6800, "language": "JavaScript",
                "topics": ["game", "engine", "javascript", "html5"]
            },
            {
                "id": 24, "name": "cocos2d-x", "owner": {"login": "cocos2d"},
                "html_url": "https://github.com/cocos2d/cocos2d-x",
                "description": "跨平台游戏引擎",
                "stargazers_count": 15700, "forks_count": 7000, "language": "C++",
                "topics": ["game", "engine", "mobile", "desktop"]
            },
            # 数据分析和可视化
            {
                "id": 25, "name": "pandas", "owner": {"login": "pandas-dev"},
                "html_url": "https://github.com/pandas-dev/pandas",
                "description": "Python数据分析库",
                "stargazers_count": 38000, "forks_count": 16000, "language": "Python",
                "topics": ["data-analysis", "python", "tool"]
            },
            {
                "id": 26, "name": "d3", "owner": {"login": "d3"},
                "html_url": "https://github.com/d3/d3",
                "description": "用于数据可视化的JavaScript库",
                "stargazers_count": 103000, "forks_count": 22800, "language": "JavaScript",
                "topics": ["visualization", "javascript", "tool"]
            },
            # 其他工具
            {
                "id": 27, "name": "obsidian", "owner": {"login": "obsidianmd"},
                "html_url": "https://github.com/obsidianmd/obsidian-releases",
                "description": "知识库应用程序，处理本地Markdown文件",
                "stargazers_count": 16500, "forks_count": 800, "language": "JavaScript",
                "topics": ["notes", "knowledge-base", "tool"]
            },
            {
                "id": 28, "name": "vscode", "owner": {"login": "microsoft"},
                "html_url": "https://github.com/microsoft/vscode",
                "description": "微软开源代码编辑器",
                "stargazers_count": 142000, "forks_count": 24700, "language": "TypeScript",
                "topics": ["editor", "ide", "tool"]
            },
            {
                "id": 29, "name": "notion-clone", "owner": {"login": "notionblog"},
                "html_url": "https://github.com/notionblog/notion-clone",
                "description": "Notion风格的笔记应用开源复制品",
                "stargazers_count": 3200, "forks_count": 540, "language": "TypeScript",
                "topics": ["notes", "clone", "tool"]
            },
            {
                "id": 30, "name": "figma-linux", "owner": {"login": "Figma-Linux"},
                "html_url": "https://github.com/Figma-Linux/figma-linux",
                "description": "Linux的Figma桌面应用非官方版本",
                "stargazers_count": 4700, "forks_count": 260, "language": "TypeScript",
                "topics": ["design", "tool", "linux"]
            }
        ]
        
        # 根据技术栈和项目类型过滤
        filtered_projects = all_projects
        
        if tech != 'all':
            filtered_projects = [p for p in filtered_projects if p["language"].lower() == tech.lower()]
        
        if project_type != 'all':
            filtered_projects = [p for p in filtered_projects if project_type in [t.lower() for t in p.get("topics", [])]]
        
        return filtered_projects

    def _get_mock_user_repos(self, username: str) -> List[Dict]:
        """获取模拟的用户仓库数据"""
        return [
            {
                "id": 1,
                "name": "project1",
                "html_url": f"https://github.com/{username}/project1",
                "description": "A sample project",
                "stargazers_count": 10,
                "forks_count": 2,
                "language": "JavaScript"
            },
            {
                "id": 2,
                "name": "project2",
                "html_url": f"https://github.com/{username}/project2",
                "description": "Another sample project",
                "stargazers_count": 5,
                "forks_count": 1,
                "language": "Python"
            }
        ]

    def _get_mock_repo_info(self, owner: str, repo: str) -> Dict:
        """获取模拟的仓库信息"""
        return {
            "id": 1,
            "name": repo,
            "owner": {"login": owner},
            "html_url": f"https://github.com/{owner}/{repo}",
            "description": "This is a sample repository description.",
            "stargazers_count": 100,
            "forks_count": 20,
            "watchers_count": 100,
            "language": "JavaScript",
            "created_at": "2020-01-01T00:00:00Z",
            "updated_at": "2021-01-01T00:00:00Z"
        }

# 创建全局GitHub服务实例
github_service = GitHubService() 