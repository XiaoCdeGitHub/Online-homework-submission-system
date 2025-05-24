/**
 * markrare.js - 简单的文本标记工具
 * 用于对文本进行标记处理
 */

/**
 * 标记文本中的特殊单词
 * @param {string} text 需要处理的文本
 * @param {Array} words 需要标记的单词列表
 * @param {string} className 标记使用的CSS类名
 * @return {string} 处理后的文本
 */
export function markrare(text, words = [], className = 'marked') {
  if (!text || typeof text !== 'string') return text;
  if (!words || !Array.isArray(words) || words.length === 0) return text;

  let result = text;
  
  // 遍历需要标记的单词
  words.forEach(word => {
    if (!word || typeof word !== 'string') return;
    
    // 创建正则表达式，不区分大小写
    const regex = new RegExp(`(${word})`, 'gi');
    
    // 替换文本，给匹配的词添加标记
    result = result.replace(regex, `<span class="${className}">$1</span>`);
  });

  return result;
}

export default {
  markrare
}; 