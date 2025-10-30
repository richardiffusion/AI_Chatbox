import express from 'express';
import axios from 'axios';

import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// AI API configurations
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
  // supports all frontend models
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

// get model prompts from environment variables or use defaults
const getModelPrompts = () => {
  // Read from environment variables
  const envPrompts = {
    deepseek: process.env.DEEPSEEK_PROMPT,
    creative: process.env.CREATIVE_PROMPT,
    technical: process.env.TECHNICAL_PROMPT,
    general: process.env.GENERAL_PROMPT,
  };

  // Default prompts (when environment variables are not set)
  const defaultPrompts = {
    deepseek: "You are a helpful AI assistant specializing in deep reasoning and analytical thinking.",
    creative: "You are a creative writing assistant. Be imaginative, expressive, and engaging.",
    technical: "You are a technical expert. Provide clear, practical solutions with code examples.",
    general: "You are a helpful, friendly AI assistant. Provide balanced, informative responses.",
  };

  // Merge prompts, giving priority to environment variables
  const mergedPrompts = {};
  Object.keys(defaultPrompts).forEach(key => {
    mergedPrompts[key] = envPrompts[key] || defaultPrompts[key];
  });

  return mergedPrompts;
};

// 20251022: streaming chat endpoint
router.post('/stream', async (req, res) => {
  // Set SSE (Server-Sent Events) headers
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

    // Check if mock mode is enabled
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

      // Simulate word-by-word output
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 30));
        res.write(`data: ${JSON.stringify({ 
          content: words[i],
          done: false 
        })}\n\n`);
      }

      // Send completion signal
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

    // Get model prompts dynamically
    const MODEL_PROMPTS = getModelPrompts();
    const systemPrompt = MODEL_PROMPTS[modelType] || MODEL_PROMPTS.general;
    const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`;

    console.log(`📝 Stream Mode: Prompt Used (${modelType}):`, systemPrompt.substring(0, 100) + '...');

    // Make streaming request to AI API
    const response = await axios.post(config.url, {
      model: config.model,
      messages: [{ role: 'user', content: fullPrompt }],
      stream: true, 
      temperature: 0.7,
      max_tokens: 2000
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.key}`
      },
      responseType: 'stream' // Important for streaming
    });

    let buffer = '';
    
    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      
      // Process streaming data
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
            // Ignore parsing errors
          }
        }
      }
    });

    response.data.on('end', () => {
      // Send completion signal
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


// Standard chat endpoint
router.post('/', async (req, res) => {
  try {
    
    // 20251016 test logs
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
    // Test logs end

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check if mock mode is enabled
    const MOCK_MODE = process.env.MOCK_MODE === 'true';
    if (MOCK_MODE) {
      console.log(`🤖 Mock Mode: Using model ${modelType} to respond`);
      const mockResponses = {
        general: `This is a general response to "${prompt}". Currently using the general assistant mode.`,
        creative: `🎨 Creative mode response to "${prompt}": Let me answer this question in an imaginative way...`,
        technical: `⚙️ Technical mode response to "${prompt}": Analyzing this question from a technical perspective...`,
        deepseek: `🤔 DeepSeek analysis of "${prompt}": Let me answer this with logical reasoning...`
      };

      // Simulate processing time
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

    // 20251016: Modify this part - more lenient checks
    if (!config.key || config.key.includes('your_') || config.key === 'your_deepseek_api_key_here') {
      return res.status(500).json({ 
        error: `API key for ${modelType} is not configured`,
        message: 'Please set MOCK_MODE=true or configure API keys in .env file'
      });
    }

    // Get model prompts dynamically
    const MODEL_PROMPTS = getModelPrompts();
    const systemPrompt = MODEL_PROMPTS[modelType] || MODEL_PROMPTS.general;
    const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`;

    console.log(`📝 Using prompt (${modelType}):`, systemPrompt.substring(0, 100) + '...');

    let response;
    
    if (modelType === 'anthropic') {
      // Anthropic API format
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
      // OpenAI compatible format (DeepSeek, OpenAI)
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

// get available models and current prompts
router.get('/models', (req, res) => {
  const MOCK_MODE = process.env.MOCK_MODE === 'true';
  
  // all models in mock mode, only configured models in normal mode
  const availableModels = MOCK_MODE 
    ? Object.keys(AI_CONFIG)
    : Object.keys(AI_CONFIG).filter(model => 
        AI_CONFIG[model].key && AI_CONFIG[model].key !== 'your_deepseek_api_key_here'
      );

  // Get current prompts
  const MODEL_PROMPTS = getModelPrompts();
  
  res.json({ 
    models: availableModels,
    prompts: MODEL_PROMPTS,
    mockMode: MOCK_MODE
  });
});

// Add environment variable checks
console.log('🔧 Environment Variable Check:');
console.log('MOCK_MODE:', process.env.MOCK_MODE);
console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? 'Configured' : 'Not Configured');
console.log('NODE_ENV:', process.env.NODE_ENV);



export default router;