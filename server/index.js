const express = require('express');
const fetch   = require('node-fetch');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL   = 'deepseek-chat';

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

// 启动时检查
const apiKey = process.env.DEEPSEEK_API_KEY;
console.log('=== 启动检查 ===');
console.log('DEEPSEEK_API_KEY:', apiKey ? `✅ 已读到（前4位：${apiKey.slice(0,4)}）` : '❌ 未找到');

fetch('https://api.deepseek.com/v1/chat/completions', { method: 'HEAD' })
  .then(r => console.log('DeepSeek 连通性：✅ 可以访问，状态码', r.status))
  .catch(e => console.log('DeepSeek 连通性：❌ 无法访问', e.message));

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: '缺少 prompt 参数' });

  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    return res.status(500).json({ error: '环境变量 DEEPSEEK_API_KEY 未配置' });
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✦ 梦境衣橱 已启动，端口 ${PORT}`);
});
