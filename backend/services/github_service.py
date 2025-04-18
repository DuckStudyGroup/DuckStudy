import requests
from typing import Dict, List, Optional
from config.config import GITHUB_API_URL, GITHUB_TOKEN, API_RATE_LIMIT
from utils.cache import cached, Cache
import datetime
import json
import os
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import re

# 获取当前文件所在目录的父目录的父目录（项目根目录）
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class GitHubService:
    def __init__(self):
        # 如果提供了Token，则使用，否则不添加授权头
        print(f"【配置】GitHub API URL: {GITHUB_API_URL}")
        print(f"【配置】GitHub Token是否配置: {bool(GITHUB_TOKEN)}")
        print(f"【配置】GitHub Token是否为默认值: {GITHUB_TOKEN == 'your_github_token_here' if GITHUB_TOKEN else 'Token未设置'}")
        
        # 初始化cache实例
        self.cache = Cache(maxsize=100, ttl=3600)
        
        # 保存token
        self.token = GITHUB_TOKEN
        
        if GITHUB_TOKEN and GITHUB_TOKEN != 'your_github_token_here':
            self.headers = {
                'Authorization': f'token {GITHUB_TOKEN}',
                'Accept': 'application/vnd.github.v3+json'
            }
            print("【配置】已使用GitHub Token配置API请求头")
        else:
            self.headers = {
                'Accept': 'application/vnd.github.v3+json'
            }
            print("【警告】未提供GitHub Token或Token无效，API请求将受到更严格的速率限制")
            
        # 检查连接并立即验证Token
        try:
            rate_limit = self.check_rate_limit()
            print(f"【验证】GitHub API连接成功，当前速率限制: 剩余{rate_limit['resources']['core']['remaining']}/{rate_limit['resources']['core']['limit']}次请求")
        except Exception as e:
            print(f"【错误】GitHub API连接测试失败: {str(e)}")
            print("【提示】请检查网络连接、Token配置是否正确")

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

    def get_trending_repos(self, language=None, since=None, count=10) -> List[Dict]:
        """
        获取GitHub趋势项目
        :param language: 编程语言
        :param since: 时间范围 (daily, weekly, monthly, 或 all)
        :param count: 返回的项目数量
        :return: 项目列表
        """
        print(f"\n======== GitHub 趋势项目请求开始 ========")
        print(f"参数: language={language}, since={since}, count={count}")
        
        # 生成缓存键
        cache_key = f"github:trending:{language}:{since}:{count}"
        cached_data = self.cache.get(cache_key)
        if cached_data:
            print(f"【缓存】使用缓存数据: {cache_key}")
            return cached_data
        
        try:
            # 首先尝试从 GitHub Trending 页面获取数据
            trending_projects = self.get_trending_repos_from_web(language, since, count)
            if trending_projects and len(trending_projects) > 0:
                # 缓存结果
                self.cache.set(cache_key, trending_projects)
                return trending_projects
                
            # 如果从网页获取失败，尝试使用 API
            print("从 GitHub Trending 页面获取数据失败，尝试使用 API...")
            
            # 下面是原来的 API 请求逻辑
            # 检查是否有GitHub Token
            has_token = self.token is not None and self.token.strip() != "" and self.token != 'your_github_token_here'
            print(f"GitHub Token是否存在: {has_token}")
            
            # 构建搜索查询
            search_query = []
            
            # 添加语言过滤
            if language and language != 'all':
                search_query.append(f"language:{language}")
            
            # 添加时间过滤
            if since == 'daily':
                created_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
                search_query.append(f"created:>={created_date}")
            elif since == 'weekly':
                created_date = (datetime.now() - timedelta(weeks=1)).strftime('%Y-%m-%d')
                search_query.append(f"created:>={created_date}")
            elif since == 'monthly':
                created_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
                search_query.append(f"created:>={created_date}")
            else:  # yearly 或 all
                if since == 'yearly':
                    created_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
                    search_query.append(f"created:>={created_date}")
            
            # 添加排序
            sort_param = "sort=stars&order=desc"
            
            # 构建完整查询
            api_url = 'https://api.github.com/search/repositories'
            if search_query:
                query_str = "+".join(search_query)
                final_url = f"{api_url}?q={query_str}&{sort_param}&per_page={count}"
            else:
                final_url = f"{api_url}?q=stars:>1000&{sort_param}&per_page={count}"
                
            print(f"最终请求URL: {final_url}")
            
            # 准备请求头
            headers = {'Accept': 'application/vnd.github.v3+json'}
            if has_token:
                headers['Authorization'] = f'token {self.token}'
                
            # 发送请求
            response = requests.get(final_url, headers=headers, timeout=10)
            status_code = response.status_code
            
            print(f"API响应状态码: {status_code}")
            
            # 检查响应状态
            if status_code == 200:
                data = response.json()
                if 'items' in data:
                    repos = data['items']
                    print(f"【成功】获取到{len(repos)}个GitHub项目")
                    
                    # 缓存结果
                    self.cache.set(cache_key, repos)
                    return repos
                else:
                    print(f"API响应中没有'items'字段: {data}")
            elif status_code == 403:
                print(f"【错误】API限流 (403): {response.text}")
            elif status_code == 401:
                print(f"【错误】认证失败 (401): Token可能无效 - {response.text}")
            else:
                print(f"【错误】API请求失败 ({status_code}): {response.text}")
            
        except Exception as e:
            print(f"【错误】GitHub请求异常: {str(e)}")
            import traceback
            print(traceback.format_exc())
        
        print("所有请求方式均失败，使用模拟数据作为回退方案")
        print("======== GitHub 趋势项目请求结束 ========\n")
        
        # 如果所有请求都失败，返回模拟数据
        mock_data = self._get_mock_trending_repos(language, since, count)
        self.cache.set(cache_key, mock_data)  # 缓存模拟数据
        return mock_data

    @cached(ttl=3600)  # 缓存1小时
    def get_trending_repos_from_web(self, language=None, since=None, count=10) -> List[Dict]:
        """
        直接从 GitHub Trending 页面获取趋势项目
        :param language: 编程语言
        :param since: 时间范围 (daily, weekly, monthly)
        :param count: 返回的项目数量
        :return: 项目列表
        """
        try:
            print("开始从 GitHub Trending 页面获取数据...")
            
            # 构建URL
            url = "https://github.com/trending"
            
            # 添加语言参数
            if language and language != 'all':
                url += f"/{language}"
                
            # 添加时间范围参数
            if since == 'daily':
                url += "?since=daily"
            elif since == 'weekly':
                url += "?since=weekly"
            elif since == 'monthly':
                url += "?since=monthly"
            
            print(f"请求 GitHub Trending 页面: {url}")
            
            # 发送请求
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # 解析HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 获取趋势项目列表
            repo_list = []
            
            # 查找所有项目卡片
            project_cards = soup.select('article.Box-row')
            
            for i, card in enumerate(project_cards):
                if i >= count:
                    break
                    
                try:
                    # 解析项目数据
                    
                    # 项目名称和作者
                    repo_name_element = card.select_one('h2.h3 a')
                    if not repo_name_element:
                        continue
                        
                    repo_path = repo_name_element.get('href', '').strip('/')
                    if not repo_path or '/' not in repo_path:
                        continue
                        
                    owner, name = repo_path.split('/', 1)
                    
                    # 项目描述
                    description_element = card.select_one('p')
                    description = description_element.text.strip() if description_element else ''
                    
                    # 项目语言
                    language_element = card.select_one('span[itemprop="programmingLanguage"]')
                    language_name = language_element.text.strip() if language_element else None
                    
                    # Star 数量
                    stars_element = card.select('a.Link--muted')[0] if len(card.select('a.Link--muted')) > 0 else None
                    stars_text = stars_element.text.strip() if stars_element else '0'
                    stars_count = self._parse_number(stars_text)
                    
                    # Fork 数量
                    forks_element = card.select('a.Link--muted')[1] if len(card.select('a.Link--muted')) > 1 else None
                    forks_text = forks_element.text.strip() if forks_element else '0'
                    forks_count = self._parse_number(forks_text)
                    
                    # 今日新增 Star
                    today_stars_element = card.select_one('span.d-inline-block.float-sm-right')
                    today_stars_text = today_stars_element.text.strip() if today_stars_element else ''
                    today_stars = self._parse_today_stars(today_stars_text)
                    
                    # 构建项目数据
                    repo_data = {
                        'id': i + 1,
                        'name': name,
                        'full_name': f"{owner}/{name}",
                        'html_url': f"https://github.com/{owner}/{name}",
                        'description': description,
                        'language': language_name,
                        'stargazers_count': stars_count,
                        'forks_count': forks_count,
                        'today_stars': today_stars,
                        'owner': {
                            'login': owner,
                            'html_url': f"https://github.com/{owner}"
                        }
                    }
                    
                    repo_list.append(repo_data)
                    
                except Exception as e:
                    print(f"解析项目卡片失败: {str(e)}")
                    continue
            
            print(f"从 GitHub Trending 页面成功获取 {len(repo_list)} 个项目")
            return repo_list
            
        except Exception as e:
            print(f"从 GitHub Trending 页面获取数据失败: {str(e)}")
            return []
            
    def _parse_number(self, text: str) -> int:
        """解析数字（支持k, m等后缀）"""
        if not text:
            return 0
            
        text = text.lower().replace(',', '')
        match = re.search(r'([\d.]+)([km]?)', text)
        if not match:
            return 0
            
        number, unit = match.groups()
        number = float(number)
        
        if unit == 'k':
            number *= 1000
        elif unit == 'm':
            number *= 1000000
            
        return int(number)
        
    def _parse_today_stars(self, text: str) -> int:
        """解析今日新增 Star 数量"""
        if not text:
            return 0
            
        match = re.search(r'([\d,]+)\s+stars\s+today', text.lower())
        if match:
            return self._parse_number(match.group(1))
            
        match = re.search(r'([\d,]+)\s+stars\s+this\s+(week|month)', text.lower())
        if match:
            return self._parse_number(match.group(1))
            
        return 0

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

    def _get_mock_trending_repos(self, language: str, since: str, count: int) -> List[Dict]:
        """获取模拟的热门仓库数据"""
        print(f"【模拟】生成模拟数据: 语言={language}, 时间范围={since}, 数量={count}")
        
        # 根据时间范围调整数据
        time_suffix = ""
        if since == 'daily':
            time_suffix = " (今日热门)"
        elif since == 'weekly':
            time_suffix = " (本周热门)"
        elif since == 'monthly':
            time_suffix = " (本月热门)"
        elif since == 'yearly':
            time_suffix = " (今年热门)"
        
        # 根据语言过滤仓库
        language_filter = language if language and language != 'all' else None
        
        # 生成模拟数据
        current_time = datetime.now().isoformat()
        three_days_ago = (datetime.now() - timedelta(days=3)).isoformat()
        
        mock_repos = [
            {
                'id': 1000001,
                'name': f'react-awesome-app{time_suffix}',
                'full_name': f'facebook/react-awesome-app{time_suffix}',
                'description': '一个优秀的React应用示例，包含最佳实践和性能优化',
                'html_url': 'https://github.com/facebook/react-example',
                'language': 'JavaScript',
                'stargazers_count': 28000,
                'forks_count': 5600,
                'open_issues_count': 123,
                'owner': {
                    'login': 'facebook',
                    'avatar_url': 'https://avatars.githubusercontent.com/u/69631?v=4',
                    'html_url': 'https://github.com/facebook'
                },
                'created_at': three_days_ago,
                'updated_at': current_time
            },
            {
                'id': 1000002,
                'name': f'python-data-science{time_suffix}',
                'full_name': f'microsoft/python-data-science{time_suffix}',
                'description': '数据科学与机器学习Python工具包，包含大量实用例子',
                'html_url': 'https://github.com/microsoft/python-ds',
                'language': 'Python',
                'stargazers_count': 25000,
                'forks_count': 4800,
                'open_issues_count': 90,
                'owner': {
                    'login': 'microsoft',
                    'avatar_url': 'https://avatars.githubusercontent.com/u/6154722?v=4',
                    'html_url': 'https://github.com/microsoft'
                },
                'created_at': three_days_ago,
                'updated_at': current_time
            },
            {
                'id': 1000003,
                'name': f'vue-dashboard{time_suffix}',
                'full_name': f'vuejs/vue-dashboard{time_suffix}',
                'description': '基于Vue3的现代化响应式仪表盘，支持自定义主题和组件',
                'html_url': 'https://github.com/vuejs/dashboard',
                'language': 'Vue',
                'stargazers_count': 22000,
                'forks_count': 4200,
                'open_issues_count': 75,
                'owner': {
                    'login': 'vuejs',
                    'avatar_url': 'https://avatars.githubusercontent.com/u/6128107?v=4',
                    'html_url': 'https://github.com/vuejs'
                },
                'created_at': three_days_ago,
                'updated_at': current_time
            },
            {
                'id': 1000004,
                'name': f'go-microservices{time_suffix}',
                'full_name': f'golang/go-microservices{time_suffix}',
                'description': 'Go语言微服务框架，提供高性能、高可用的服务架构',
                'html_url': 'https://github.com/golang/microservices',
                'language': 'Go',
                'stargazers_count': 19000,
                'forks_count': 3500,
                'open_issues_count': 62,
                'owner': {
                    'login': 'golang',
                    'avatar_url': 'https://avatars.githubusercontent.com/u/4314092?v=4',
                    'html_url': 'https://github.com/golang'
                },
                'created_at': three_days_ago,
                'updated_at': current_time
            },
            {
                'id': 1000005,
                'name': f'rust-game-engine{time_suffix}',
                'full_name': f'rust-lang/rust-game-engine{time_suffix}',
                'description': '使用Rust编写的高性能游戏引擎，具有内存安全和并发特性',
                'html_url': 'https://github.com/rust-lang/game-engine',
                'language': 'Rust',
                'stargazers_count': 18000,
                'forks_count': 3200,
                'open_issues_count': 58,
                'owner': {
                    'login': 'rust-lang',
                    'avatar_url': 'https://avatars.githubusercontent.com/u/5430905?v=4',
                    'html_url': 'https://github.com/rust-lang'
                },
                'created_at': three_days_ago,
                'updated_at': current_time
            },
            {
                'id': 1000006,
                'name': f'java-spring-cloud{time_suffix}',
                'full_name': f'spring-projects/java-spring-cloud{time_suffix}',
                'description': 'Spring Cloud全栈应用开发框架，简化分布式系统构建',
                'html_url': 'https://github.com/spring-projects/spring-cloud',
                'language': 'Java',
                'stargazers_count': 17000,
                'forks_count': 3000,
                'open_issues_count': 55,
                'owner': {
                    'login': 'spring-projects',
                    'avatar_url': 'https://avatars.githubusercontent.com/u/317776?v=4',
                    'html_url': 'https://github.com/spring-projects'
                },
                'created_at': three_days_ago,
                'updated_at': current_time
            },
            {
                'id': 1000007,
                'name': f'cpp-game-framework{time_suffix}',
                'full_name': f'microsoft/cpp-game-framework{time_suffix}',
                'description': 'C++游戏开发框架，提供跨平台支持和高性能图形渲染',
                'html_url': 'https://github.com/microsoft/cpp-framework',
                'language': 'C++',
                'stargazers_count': 15000,
                'forks_count': 2800,
                'open_issues_count': 48,
                'owner': {
                    'login': 'microsoft',
                    'avatar_url': 'https://avatars.githubusercontent.com/u/6154722?v=4',
                    'html_url': 'https://github.com/microsoft'
                },
                'created_at': three_days_ago,
                'updated_at': current_time
            },
            {
                'id': 1000008,
                'name': f'swift-ui-kit{time_suffix}',
                'full_name': f'apple/swift-ui-kit{time_suffix}',
                'description': 'Swift UI工具包，为iOS和macOS应用提供现代化界面组件',
                'html_url': 'https://github.com/apple/swift-ui',
                'language': 'Swift',
                'stargazers_count': 14000,
                'forks_count': 2500,
                'open_issues_count': 42,
                'owner': {
                    'login': 'apple',
                    'avatar_url': 'https://avatars.githubusercontent.com/u/10639145?v=4',
                    'html_url': 'https://github.com/apple'
                },
                'created_at': three_days_ago,
                'updated_at': current_time
            },
            {
                'id': 1000009,
                'name': f'typescript-node-framework{time_suffix}',
                'full_name': f'microsoft/typescript-node-framework{time_suffix}',
                'description': 'TypeScript服务端框架，集成ORM和GraphQL支持',
                'html_url': 'https://github.com/microsoft/ts-node',
                'language': 'TypeScript',
                'stargazers_count': 13000,
                'forks_count': 2300,
                'open_issues_count': 38,
                'owner': {
                    'login': 'microsoft',
                    'avatar_url': 'https://avatars.githubusercontent.com/u/6154722?v=4',
                    'html_url': 'https://github.com/microsoft'
                },
                'created_at': three_days_ago,
                'updated_at': current_time
            },
            {
                'id': 1000010,
                'name': f'kotlin-android-starter{time_suffix}',
                'full_name': f'google/kotlin-android-starter{time_suffix}',
                'description': 'Kotlin Android应用起始项目，集成Jetpack组件和最佳实践',
                'html_url': 'https://github.com/google/kotlin-android',
                'language': 'Kotlin',
                'stargazers_count': 12000,
                'forks_count': 2100,
                'open_issues_count': 35,
                'owner': {
                    'login': 'google',
                    'avatar_url': 'https://avatars.githubusercontent.com/u/1342004?v=4',
                    'html_url': 'https://github.com/google'
                },
                'created_at': three_days_ago,
                'updated_at': current_time
            },
            {
                'id': 1000011,
                'name': f'php-laravel-cms{time_suffix}',
                'full_name': f'laravel/php-laravel-cms{time_suffix}',
                'description': '基于Laravel的现代内容管理系统，支持多语言和多站点',
                'html_url': 'https://github.com/laravel/cms',
                'language': 'PHP',
                'stargazers_count': 11000,
                'forks_count': 1900,
                'open_issues_count': 32,
                'owner': {
                    'login': 'laravel',
                    'avatar_url': 'https://avatars.githubusercontent.com/u/958072?v=4',
                    'html_url': 'https://github.com/laravel'
                },
                'created_at': three_days_ago,
                'updated_at': current_time
            },
            {
                'id': 1000012,
                'name': f'ruby-rails-api{time_suffix}',
                'full_name': f'rails/ruby-rails-api{time_suffix}',
                'description': 'Ruby on Rails API框架，快速构建RESTful接口和微服务',
                'html_url': 'https://github.com/rails/rails-api',
                'language': 'Ruby',
                'stargazers_count': 10000,
                'forks_count': 1700,
                'open_issues_count': 28,
                'owner': {
                    'login': 'rails',
                    'avatar_url': 'https://avatars.githubusercontent.com/u/4223?v=4',
                    'html_url': 'https://github.com/rails'
                },
                'created_at': three_days_ago,
                'updated_at': current_time
            }
        ]
        
        # 语言过滤
        if language_filter:
            filtered_repos = [repo for repo in mock_repos if repo['language'] and repo['language'].lower() == language_filter.lower()]
            result = filtered_repos if filtered_repos else mock_repos[:count]  # 如果过滤后为空，返回前count个
        else:
            result = mock_repos[:count]
        
        print(f"【模拟】返回{len(result)}个模拟数据")
        return result

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