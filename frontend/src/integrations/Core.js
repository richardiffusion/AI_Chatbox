// API base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Add streaming support in integrations/Core.js
export const InvokeLLMStream = async ({ prompt, model }) => {
  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model,
      }),
    });

    if (!response.ok) {
      throw new Error('Stream request failed');
    }

    return response; // Return the original response object for further processing
  } catch (error) {
    console.error('Stream API Error:', error);
    throw error;
  }
};



export const InvokeLLM = async ({ prompt, model = 'general' }) => {
  try {
    console.log(`Calling backend API for model: ${model}`);
    
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model
      })
    });

    // Log response status
    console.log('📨 Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Bad Response:', errorText);
      throw new Error(`API Require Fail: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API Response Success:', data);
    return data.response;

  } catch (error) {
    console.error('🔴 API Config Error:', error);
    throw error;
  }
};

// Get available models
export const GetAvailableModels = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/models`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch available models');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching models:', error);
    return { models: ['general'], prompts: {} };
  }
};