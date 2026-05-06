/**
 * 梦境衣橱 · 后端服务
 * Node.js + Express
 *
 * 职责：
 *  1. 托管前端静态文件（public/）
 *  2. 代理 DeepSeek API 请求（保护 API Key 不暴露到前端）
 */

require('dotenv').config();
const express = require('express');
const fetch   = require('node-fetch');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL   = 'deepseek-chat';  // 切换 R1 改为 'deepseek-reasoner'

/* ── System Prompt ──────────────────────────────────────────────
   风格基调：专业直白 + 接地气 + 温暖
   核心世界观：情绪像衣服一样穿在身上，困境是可以脱下的，换一件才是重点
   所有 agent 文案都围绕"服装×情绪"的具体联结展开
*/
const SYSTEM_PROMPT = `你是"梦境衣橱"的情绪换装顾问，懂时尚，也懂心理。

【世界观】
情绪像衣服一样穿在身上。有些情绪越穿越沉——但衣服是可以换的。
你的工作不是"治愈"用户，而是帮他们看见自己现在穿着什么，
然后找到那件想换上的衣服，解释为什么值得换上它。

【语言风格】
- 直白接地气：用大白话，不用书面语和学术词汇
- 聚焦服装：每次解读都要落到具体的服装元素上——面料/颜色/剪裁/配件
- 身体感受优先：说"穿上它身体会感受到……"比说"它象征……"更有力量
- 温暖不煽情：像朋友发消息，不像励志演讲

【绝对禁止】
- 不说"踏上疗愈旅程""拥抱内心的光"这类空洞话语
- 不脱离服装泛谈情绪
- 不超过指定字数
- 只输出正文，不加任何标题、前缀或解释`;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: '缺少 prompt 参数' });

  //const apiKey = process.env.DEEPSEEK_API_KEY;
  //if (!apiKey || apiKey.startsWith('sk-xxx')) {
  //return res.status(500).json({ error: '请在 .env 中配置有效的 DEEPSEEK_API_KEY' });
  //}

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        max_tokens: 1024,
        temperature: 0.75,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API 错误：', errText);
      return res.status(response.status).json({ error: '上游 API 错误', detail: errText });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    res.json({ text });

  } catch (err) {
    console.error('服务器错误：', err);
    res.status(500).json({ error: '服务器内部错误', detail: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT,'0.0.0.0', () => {
  console.log(`\n✦ 梦境衣橱 已启动`);
  console.log(`  模型：${DEEPSEEK_MODEL}`);
  console.log(`  本地访问：http://localhost:${PORT}\n`);
});
