export const InvokeLLM = async ({ prompt, model = 'deepseek' }) => {
  try {
    const API_CONFIG = {
      deepseek: {
        url: 'https://api.deepseek.com/chat/completions',
        key: import.meta.env.VITE_DEEPSEEK_API_KEY
      },
      openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        key: import.meta.env.VITE_OPENAI_API_KEY
      }
    }

    const config = API_CONFIG[model]
    if (!config) {
      throw new Error(`Unsupported model: ${model}`)
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.key}`
      },
      body: JSON.stringify({
        model: model === 'deepseek' ? 'deepseek-chat' : 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content

  } catch (error) {
    console.error('API调用错误:', error)
    throw error
  }
}