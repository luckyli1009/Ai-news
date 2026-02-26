'use client';

import { useEffect, useState } from 'react';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
  source: string;
  category?: string;
  isTranslated?: boolean;
}

const CATEGORIES = ['全部', '大模型发布', '开发工具', '行业资讯'];

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [geminiEnabled, setGeminiEnabled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    return false;
  });
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNews(data.data);
          if (data.isMock) {
            setIsMock(true);
          }
          if (data.lastUpdated) {
            setLastUpdated(data.lastUpdated);
          }
          if (typeof data.geminiEnabled === 'boolean') {
            setGeminiEnabled(data.geminiEnabled);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const filteredNews = selectedCategory === '全部' 
    ? news 
    : news.filter(item => item.category === selectedCategory || (!item.category && selectedCategory === '行业资讯'));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-500 ease-in-out">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-500 ease-in-out">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 transition-colors duration-500">
                AI 科技新闻
              </h1>
            </div>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-500"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? '🌞' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <header className="mb-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2 transition-colors duration-500">
            汇聚 TechCrunch 与 The Verge 最新动态
          </p>
          <div className="mb-4 flex justify-center">
            <div
              className={`inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full font-medium border transition-colors duration-500 ${
                geminiEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full ${
                    geminiEnabled ? 'bg-emerald-400 animate-ping opacity-75' : 'bg-gray-400 opacity-40'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    geminiEnabled ? 'bg-emerald-500' : 'bg-gray-500'
                  }`}
                ></span>
              </span>
              <span>
                {geminiEnabled ? 'Gemini 翻译已启用，部分内容已由 AI 翻译' : 'Gemini 翻译未启用，当前显示原文或演示数据'}
              </span>
            </div>
          </div>
          {lastUpdated && (
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono transition-colors duration-500 mb-6">
              最后更新于: {lastUpdated}
            </p>
          )}
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-500 ease-in-out ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {isMock && (
            <div className="inline-flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs px-4 py-2 rounded-full font-medium border border-yellow-200 dark:border-yellow-800 transition-colors duration-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
              </span>
              网络不可用 - 正在显示演示数据
            </div>
          )}
        </header>
        
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="text-gray-500 dark:text-gray-400 animate-pulse">正在加载最新资讯...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((item, index) => (
              <article 
                key={index} 
                className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-in-out overflow-hidden border border-gray-100 dark:border-gray-800"
              >
                <div className="p-6 flex-1 flex flex-col">
                  {/* Meta Header */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors duration-500 ${
                        item.source.includes('TechCrunch') 
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                          : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                      }`}>
                        {item.source}
                      </span>
                      {item.category && (
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded transition-colors duration-500">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <time className="text-xs text-gray-400 dark:text-gray-500 font-mono transition-colors duration-500">
                      {new Date(item.pubDate).toLocaleDateString('zh-CN', { 
                        month: 'numeric', 
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                  
                  {/* Title */}
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-500"
                  >
                    <h2 className="text-lg font-bold mb-3 leading-snug text-gray-900 dark:text-gray-100 transition-colors duration-500">
                      {item.title}
                    </h2>
                  </a>
                  
                  {/* Summary */}
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 leading-relaxed mb-6 flex-1 transition-colors duration-500">
                    {item.summary.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')}
                  </p>
                  
                  {/* Action Footer */}
                  <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center transition-colors duration-500">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500 transition-colors duration-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI 摘要生成
                      </span>
                      {item.isTranslated && (
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-1 font-medium bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded border border-purple-100 dark:border-purple-800 w-fit transition-colors duration-500">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                          AI 翻译
                        </span>
                      )}
                    </div>
                    <a 
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-500 px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      阅读原文
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
