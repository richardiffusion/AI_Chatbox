export class ChatMessage {
  static async create(messageData) {
    // 模拟保存到本地存储
    const message = {
      id: Date.now().toString(),
      created_date: new Date().toISOString(),
      ...messageData
    }
    
    const existingMessages = JSON.parse(localStorage.getItem('chatMessages') || '[]')
    existingMessages.push(message)
    localStorage.setItem('chatMessages', JSON.stringify(existingMessages))
    
    return message
  }

  static async filter(filters = {}, sortBy = 'created_date', limit = 100) {
    let messages = JSON.parse(localStorage.getItem('chatMessages') || '[]')
    
    // 应用过滤器
    if (filters.conversation_id) {
      messages = messages.filter(msg => msg.conversation_id === filters.conversation_id)
    }
    
    // 排序
    messages.sort((a, b) => new Date(b[sortBy]) - new Date(a[sortBy]))
    
    // 限制数量
    return messages.slice(0, limit)
  }
}