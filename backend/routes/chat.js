import express from 'express';
import axios from 'axios';

// 20251016 添加调入代码（移动到最上面可以使用）
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// AI API 配置
const AI_CONFIG = {
  deepseek: {
    url: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions',
    key: process.env.DEEPSEEK_API_KEY,
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  },
  openai: {
    url: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
    key: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
  },
  anthropic: {
    url: process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com/v1/messages',
    key: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229'
  },
  // 支持所有前端模型
  general: {
    url: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions',
    key: process.env.DEEPSEEK_API_KEY,
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  },
  creative: {
    url: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions',
    key: process.env.DEEPSEEK_API_KEY,
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  },
  technical: {
    url: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions',
    key: process.env.DEEPSEEK_API_KEY,
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
  }
};

// 从环境变量读取模型提示词，如果没有则使用默认值
const getModelPrompts = () => {
  // 从环境变量读取
  const envPrompts = {
    deepseek: process.env.DEEPSEEK_PROMPT,
    creative: process.env.CREATIVE_PROMPT,
    technical: process.env.TECHNICAL_PROMPT,
    general: process.env.GENERAL_PROMPT,
  };

  // 默认提示词（当环境变量没有设置时使用）
  const defaultPrompts = {
    deepseek: "You are a helpful AI assistant specializing in deep reasoning and analytical thinking.",
    creative: "You are a creative writing assistant. Be imaginative, expressive, and engaging.",
    technical: "You are a technical expert. Provide clear, practical solutions with code examples.",
    general: "You are a helpful, friendly AI assistant. Provide balanced, informative responses.",
  };

  // 合并：如果环境变量有值则使用，否则使用默认值
  const mergedPrompts = {};
  Object.keys(defaultPrompts).forEach(key => {
    mergedPrompts[key] = envPrompts[key] || defaultPrompts[key];
  });

  return mergedPrompts;
};

// 20251022新增：流式聊天接口
router.post('/stream', async (req, res) => {
  // 设置 SSE (Server-Sent Events) 头部
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  try {
    const { prompt, model: modelType = 'general' } = req.body;

    if (!prompt) {
      res.write(`data: ${JSON.stringify({ error: 'Prompt is required' })}\n\n`);
      res.end();
      return;
    }

    // 检查是否启用模拟模式
    const MOCK_MODE = process.env.MOCK_MODE === 'true';
    if (MOCK_MODE) {
      console.log(`🤖 Mock Stream Mode: Using model ${modelType} to respond`);
      
      const mockResponses = {
        general: `This is a general response to "${prompt}". Currently using the general assistant mode.`,
        creative: `🎨 Creative mode response to "${prompt}": Let me answer this question in an imaginative way...`,
        technical: `⚙️ Technical mode response to "${prompt}": Analyzing this question from a technical perspective...`,
        deepseek: `🤔 DeepSeek analysis of "${prompt}": Let me answer this with logical reasoning...`
      };
      
      const response = mockResponses[modelType] || mockResponses.general;
      const words = response.split('');
      
      // 模拟逐字输出
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 30));
        res.write(`data: ${JSON.stringify({ 
          content: words[i],
          done: false 
        })}\n\n`);
      }
      
      // 发送完成信号
      res.write(`data: ${JSON.stringify({ 
        done: true,
        model: modelType,
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.end();
      return;
    }

    const config = AI_CONFIG[modelType];
    if (!config) {
      res.write(`data: ${JSON.stringify({ error: `Unsupported model: ${modelType}` })}\n\n`);
      res.end();
      return;
    }

    if (!config.key || config.key.includes('your_') || config.key === 'your_deepseek_api_key_here') {
      res.write(`data: ${JSON.stringify({ 
        error: `API key for ${modelType} is not configured`,
        message: 'Please set MOCK_MODE=true or configure API keys in .env file'
      })}\n\n`);
      res.end();
      return;
    }

    // 动态获取提示词
    const MODEL_PROMPTS = getModelPrompts();
    const systemPrompt = MODEL_PROMPTS[modelType] || MODEL_PROMPTS.general;
    const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`;

    console.log(`📝 Stream Mode: Prompt Used (${modelType}):`, systemPrompt.substring(0, 100) + '...');

    // 流式请求
    const response = await axios.post(config.url, {
      model: config.model,
      messages: [{ role: 'user', content: fullPrompt }],
      stream: true,  // 关键：启用流式
      temperature: 0.7,
      max_tokens: 2000
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.key}`
      },
      responseType: 'stream'  // 关键：接收流式响应
    });

    let buffer = '';
    
    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      
      // 处理流式数据
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices?.[0]?.delta?.content || '';
            
            if (content) {
              res.write(`data: ${JSON.stringify({ 
                content: content,
                done: false 
              })}\n\n`);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    });

    response.data.on('end', () => {
      // 发送完成信号
      res.write(`data: ${JSON.stringify({ 
        done: true,
        model: modelType,
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.end();
    });

    response.data.on('error', (error) => {
      console.error('Stream Error:', error);
      res.write(`data: ${JSON.stringify({ 
        error: 'Stream connection failed',
        details: error.message 
      })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('AI API Stream Error:', error.response?.data || error.message);
    res.write(`data: ${JSON.stringify({ 
      error: 'Failed to get stream response',
      details: error.message 
    })}\n\n`);
    res.end();
  }
});


// 非流式聊天接口
router.post('/', async (req, res) => {
  try {
    
    // 20251016测试代码
    console.log('🔧 Receive Chat Request:', req.body);
    console.log('🔧 MOCK_MODE:', process.env.MOCK_MODE);
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
    
    const { prompt, model: modelType = 'general' } = req.body;

    console.log('🔧 Request Model:', modelType);
    console.log('🔧 AI_CONFIG Check:', {
      general: {
        hasKey: !!AI_CONFIG.general.key,
        key: AI_CONFIG.general.key ? 'Configured' : 'not configured',
        keyValue: AI_CONFIG.general.key ? AI_CONFIG.general.key.substring(0, 10) + '...' : 'empty'
      }
    });
    // 测试代码止

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 检查是否启用模拟模式
    const MOCK_MODE = process.env.MOCK_MODE === 'true';
    if (MOCK_MODE) {
      console.log(`🤖 Mock Mode: Using model ${modelType} to respond`);
      const mockResponses = {
        general: `This is a general response to "${prompt}". Currently using the general assistant mode.`,
        creative: `🎨 Creative mode response to "${prompt}": Let me answer this question in an imaginative way...`,
        technical: `⚙️ Technical mode response to "${prompt}": Analyzing this question from a technical perspective...`,
        deepseek: `🤔 DeepSeek analysis of "${prompt}": Let me answer this with logical reasoning...`
      };
      
      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return res.json({ 
        response: mockResponses[modelType] || mockResponses.general,
        model: modelType,
        timestamp: new Date().toISOString(),
        mock: true
      });
    }

    const config = AI_CONFIG[modelType];
    if (!config) {
      return res.status(400).json({ error: `Unsupported model: ${modelType}` });
    }

    // 20251016：修改这部分代码 - 更宽松的检查
    if (!config.key || config.key.includes('your_') || config.key === 'your_deepseek_api_key_here') {
      return res.status(500).json({ 
        error: `API key for ${modelType} is not configured`,
        message: 'Please set MOCK_MODE=true or configure API keys in .env file'
      });
    }

    // 动态获取提示词
    const MODEL_PROMPTS = getModelPrompts();
    const systemPrompt = MODEL_PROMPTS[modelType] || MODEL_PROMPTS.general;
    const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`;

    console.log(`📝 Using prompt (${modelType}):`, systemPrompt.substring(0, 100) + '...');

    let response;
    
    if (modelType === 'anthropic') {
      // Anthropic API 格式
      response = await axios.post(config.url, {
        model: config.model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: fullPrompt }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.key,
          'anthropic-version': '2023-06-01'
        }
      });
    } else {
      // OpenAI 兼容格式 (DeepSeek, OpenAI)
      response = await axios.post(config.url, {
        model: config.model,
        messages: [{ role: 'user', content: fullPrompt }],
        stream: false
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.key}`
        }
      });
    }

    let aiResponse;
    
    if (modelType === 'anthropic') {
      aiResponse = response.data.content[0].text;
    } else {
      aiResponse = response.data.choices[0].message.content;
    }

    res.json({ 
      response: aiResponse,
      model: modelType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI API Error:', error.response?.data || error.message);
    
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || 'Failed to get response from AI service';
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'production' ? undefined : error.response?.data
    });
  }
});


// 20251016修改
// 获取可用模型
router.get('/models', (req, res) => {
  const MOCK_MODE = process.env.MOCK_MODE === 'true';
  
  // 在模拟模式下，所有模型都可用
  const availableModels = MOCK_MODE 
    ? Object.keys(AI_CONFIG)
    : Object.keys(AI_CONFIG).filter(model => 
        AI_CONFIG[model].key && AI_CONFIG[model].key !== 'your_deepseek_api_key_here'
      );
  
  // 获取当前使用的提示词
  const MODEL_PROMPTS = getModelPrompts();
  
  res.json({ 
    models: availableModels,
    prompts: MODEL_PROMPTS,
    mockMode: MOCK_MODE
  });
});

// // 获取可用模型和当前提示词
// router.get('/models', (req, res) => {
//   const availableModels = Object.keys(AI_CONFIG).filter(model => 
//     AI_CONFIG[model].key && AI_CONFIG[model].key !== 'your_api_key_here'
//   );
  
//   // 获取当前使用的提示词
//   const MODEL_PROMPTS = getModelPrompts();
  
//   res.json({ 
//     models: availableModels,
//     prompts: MODEL_PROMPTS
//   });
// });


// 添加环境变量检查
console.log('🔧 Environment Variable Check:');
console.log('MOCK_MODE:', process.env.MOCK_MODE);
console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? 'Configured' : 'Not Configured');
console.log('NODE_ENV:', process.env.NODE_ENV);



export default router;