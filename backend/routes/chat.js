const express = require('express');
const axios = require('axios');
const router = express.Router();

// AI API Config
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
  // Default: general
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

const getModelPrompts = () => {
  // from .env file
  const envPrompts = {
    deepseek: process.env.DEEPSEEK_PROMPT,
    creative: process.env.CREATIVE_PROMPT,
    technical: process.env.TECHNICAL_PROMPT,
    general: process.env.GENERAL_PROMPT,
  };

  // Default Prompts - when .env file is not available
  const defaultPrompts = {
    deepseek: "You are DeepSeek, an AI assistant focused on deep reasoning and analytical thinking. Provide thorough, well-reasoned responses with clear logical steps.",
    creative: "You are a creative writing assistant. Be imaginative, expressive, and engaging in your responses. Use vivid language and storytelling.",
    technical: "You are a technical expert specializing in programming, engineering, and technology. Provide clear, practical solutions with code examples when relevant.",
    general: "You are a helpful, friendly AI assistant. Provide balanced, informative responses to any questions.",
  };

  // Combine: when .env is present, use .env file; else use default.
  const mergedPrompts = {};
  Object.keys(defaultPrompts).forEach(key => {
    mergedPrompts[key] = envPrompts[key] || defaultPrompts[key];
  });

  return mergedPrompts;
};


// Chat Router
router.post('/', async (req, res) => {
  try {
    const { prompt, model: modelType = 'general' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const config = AI_CONFIG[modelType];
    if (!config) {
      return res.status(400).json({ error: `Unsupported model: ${modelType}` });
    }

    if (!config.key) {
      return res.status(500).json({ error: `API key for ${modelType} is not configured` });
    }

    // Dynamic Acquire of Prompts
    const MODEL_PROMPTS = getModelPrompts();
    const systemPrompt = MODEL_PROMPTS[modelType] || MODEL_PROMPTS.general;
    const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`;

    console.log(`📝 Use prompt (${modelType}):`, systemPrompt.substring(0, 100) + '...');

    let response;
    
    if (modelType === 'anthropic') {
      // Anthropic API 
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
      // OpenAI (DeepSeek, OpenAI)
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

// Acquire Available Model and Current Prompts
router.get('/models', (req, res) => {
  const availableModels = Object.keys(AI_CONFIG).filter(model => 
    AI_CONFIG[model].key && AI_CONFIG[model].key !== 'your_api_key_here'
  );
  
  // Acquire Available Prompts
  const MODEL_PROMPTS = getModelPrompts();

  res.json({ 
    models: availableModels,
    prompts: MODEL_PROMPTS
  });
});

module.exports = router;