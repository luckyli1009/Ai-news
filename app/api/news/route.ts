import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { translateNews } from '@/lib/gemini';

export const revalidate = 3600;

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },
  timeout: 5000, // 5 seconds timeout
});

const FEED_URLS = [
  'https://techcrunch.com/category/artificial-intelligence/feed/',
  'https://www.theverge.com/rss/artificial-intelligence/index.xml',
];

// Fallback data in case of network issues
const MOCK_DATA = [
  {
    title: "OpenAI 发布具备增强推理能力的 GPT-5 模型（演示数据）",
    link: "https://openai.com",
    pubDate: new Date().toISOString(),
    summary: "这是一条演示数据，因无法连接实时 RSS 源而显示。OpenAI 宣布了其最新的语言模型，具备更强的逻辑推理能力...",
    source: "TechCrunch (演示)",
    category: "大模型发布"
  },
  {
    title: "Google DeepMind 攻克重大生物学难题（演示数据）",
    link: "https://deepmind.google",
    pubDate: new Date(Date.now() - 86400000).toISOString(),
    summary: "DeepMind 的 AlphaFold 3 成功预测了复杂的生物分子结构，将加速药物研发进程...",
    source: "The Verge (演示)",
    category: "行业资讯"
  },
  {
    title: "Anthropic 推出 Claude 3.5 Sonnet（演示数据）",
    link: "https://anthropic.com",
    pubDate: new Date(Date.now() - 172800000).toISOString(),
    summary: "新模型在编程和推理等多项基准测试中表现优异，超越了 GPT-4 的部分能力...",
    source: "TechCrunch (演示)",
    category: "大模型发布"
  },
  {
    title: "Meta 发布 Llama 4 开源模型（演示数据）",
    link: "https://ai.meta.com",
    pubDate: new Date(Date.now() - 259200000).toISOString(),
    summary: "Meta 继续推行开源策略，发布了拥有 4000 亿参数的 Llama 4，性能大幅提升...",
    source: "The Verge (演示)",
    category: "开发工具"
  }
];

// Helper function to assign random category to real news
function assignCategory(title: string, summary: string): string {
  const text = (title + summary).toLowerCase();
  if (text.includes('gpt') || text.includes('claude') || text.includes('gemini') || text.includes('llama') || text.includes('model')) {
    return '大模型发布';
  } else if (text.includes('tool') || text.includes('sdk') || text.includes('api') || text.includes('github') || text.includes('code')) {
    return '开发工具';
  } else {
    return '行业资讯';
  }
}

export async function GET() {
  try {
    const geminiEnabled = !!process.env.GEMINI_API_KEY;
    const feedPromises = FEED_URLS.map(async (url) => {
      try {
        const response = await fetch(url, { next: { revalidate: 3600 } });
        if (!response.ok) {
          throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
        }
        const xml = await response.text();
        const feed = await parser.parseString(xml);
        
        return feed.items.map((item) => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          summary: item.contentSnippet || item.content || '',
          source: feed.title?.includes('Verge') ? 'The Verge' : 'TechCrunch',
          category: assignCategory(item.title || '', item.contentSnippet || '')
        }));
      } catch (err) {
        console.error(`Failed to fetch feed ${url}:`, err);
        return []; // Return empty array on failure instead of throwing
      }
    });

    const results = await Promise.all(feedPromises);
    const allItems = results.flat();
    
    // Get current time as ISO string for last updated display
    const lastUpdated = new Date().toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });

    if (allItems.length === 0) {
      console.warn('No news items fetched, using mock data.');
      return NextResponse.json({ 
        success: true, 
        data: MOCK_DATA, 
        isMock: true,
        lastUpdated,
        geminiEnabled
      });
    }

    // Sort by publication date (newest first)
    allItems.sort((a, b) => {
      const dateA = new Date(a.pubDate || 0);
      const dateB = new Date(b.pubDate || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Translate items
    // Since Gemini free tier has rate limits, we'll process in batches
    // and only translate the top 20 items to ensure performance
    const itemsToTranslate = allItems.slice(0, 20);
    const remainingItems = allItems.slice(20);

    const translatedItems = [];
    const BATCH_SIZE = 3;

    for (let i = 0; i < itemsToTranslate.length; i += BATCH_SIZE) {
      const batch = itemsToTranslate.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (item) => {
        try {
          const { title, summary, isTranslated } = await translateNews(item.title, item.summary);
          return { ...item, title, summary, isTranslated };
        } catch {
          return { ...item, isTranslated: false };
        }
      });
      
      const results = await Promise.all(promises);
      translatedItems.push(...results);
      
      // Small delay between batches to be nice to the API
      if (i + BATCH_SIZE < itemsToTranslate.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const finalItems = [...translatedItems, ...remainingItems];

    return NextResponse.json({ 
      success: true, 
      data: finalItems,
      isMock: false,
      lastUpdated,
      geminiEnabled
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: true,
      data: MOCK_DATA,
      isMock: true,
      lastUpdated: new Date().toLocaleString('zh-CN'),
      geminiEnabled: !!process.env.GEMINI_API_KEY
    });
  }
}
