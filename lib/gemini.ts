import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const baseUrl = process.env.GEMINI_API_BASE_URL;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { baseUrl }) : null;

// Simple in-memory cache to avoid redundant API calls
const translationCache = new Map<string, { title: string; summary: string }>();

export async function translateNews(
  title: string,
  summary: string
): Promise<{ title: string; summary: string; isTranslated: boolean }> {
  // Return original if no API key or model
  if (!apiKey || !model) {
    // console.warn("Gemini API key not found, skipping translation.");
    return { title, summary, isTranslated: false };
  }

  const cacheKey = `${title}|${summary}`;
  if (translationCache.has(cacheKey)) {
    return { ...translationCache.get(cacheKey)!, isTranslated: true };
  }

  try {
    const prompt = `你是一个科技新闻翻译专家，请将以下 AI 科技新闻的标题和摘要翻译成专业、简洁的中文，保持术语准确（如 LLM、Transformer 等不翻译或括号保留）。

Title: ${title}
Summary: ${summary}

请严格以 JSON 格式返回，不要包含任何 Markdown 格式（如 \`\`\`json），只返回纯 JSON 字符串，包含 "title" 和 "summary" 两个字段。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up markdown code blocks if present (just in case)
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    
    let translated;
    try {
      translated = JSON.parse(cleanText);
    } catch {
      console.error("Failed to parse Gemini response:", text);
      return { title, summary, isTranslated: false };
    }
    
    const resultData = {
      title: translated.title || title,
      summary: translated.summary || summary
    };

    translationCache.set(cacheKey, resultData);
    return { ...resultData, isTranslated: true };
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    // Fallback to original content on error
    return { title, summary, isTranslated: false };
  }
}
