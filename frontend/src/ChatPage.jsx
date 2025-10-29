import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "@/entities/ChatMessage";
import { InvokeLLM } from "@/integrations/Core";
import ChatMessageComponent from "./Components/chat/ChatMessage";
import ChatInput from "./Components/chat/ChatInput";
import ChatHeader from "./Components/chat/ChatHeader";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ChatPage({ initialMessage = "", onBackToHome }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("general");
  const [conversationId, setConversationId] = useState(generateConversationId());
  const [streamingMessageId, setStreamingMessageId] = useState(null); // 新增：跟踪流式消息
  const messagesEndRef = useRef(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const hasAutoSent = useRef(false);

  // 20251029:新增：跟踪当前会话的初始消息
  const [currentInitialMessage, setCurrentInitialMessage] = useState(initialMessage);

  function generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const loadMessages = useCallback(async () => {
    setIsInitialLoad(true);
    const loadedMessages = await ChatMessage.filter(
      { conversation_id: conversationId },
      "created_date",
      100
    );
    setMessages(loadedMessages);
    setIsInitialLoad(false);
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNewChat = () => {
    // 重置所有状态
    const newConversationId = generateConversationId();
    setConversationId(newConversationId);
    setMessages([]);
    setStreamingMessageId(null);
    
    // 关键：重置初始消息状态
    setCurrentInitialMessage('');
    hasAutoSent.current = false;
    
    // 清除 sessionStorage 中的自动发送消息
    sessionStorage.removeItem('autoSendMessage');
    
    console.log('🆕 New chat started with clean state');
};

const handleStreamResponse = async (content, modelType) => {
  try {
    console.log('🚀 Start requesting...');
    
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: content,
        model: modelType,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // 创建初始消息
    const initialMessage = {
      content: '',
      role: 'assistant',
      conversation_id: conversationId,
      model: modelType,
    };

    console.log('📝 Creating initial message...');
    const savedMessage = await ChatMessage.create(initialMessage);
    setStreamingMessageId(savedMessage.id);
    setMessages(prev => [...prev, savedMessage]);

    let accumulatedContent = '';
    let buffer = '';
    let streamCompleted = false; // 新增：标记流是否正常完成

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Stream completed successfully');
          streamCompleted = true;
          break;
        }

        // 解码数据
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const dataStr = line.slice(6).trim();
              if (!dataStr) continue;
              
              const data = JSON.parse(dataStr);
              console.log('📨 Receive Data:', data);

              if (data.error) {
                console.error('❌ Stream error:', data.error);
                throw new Error(data.error); // 抛出错误让外层catch处理
              }

              if (data.content) {
                accumulatedContent += data.content;
                console.log('📝 Accumulated content:', accumulatedContent);
                
                // 更新UI
                setMessages(prev => prev.map(msg => 
                  msg.id === savedMessage.id 
                    ? { ...msg, content: accumulatedContent }
                    : msg
                ));
              }

              if (data.done) {
                console.log('🎯 Receive done signal, stream transmission ended');
                streamCompleted = true;
                
                // 立即更新数据库并返回
                try {
                  await ChatMessage.update(savedMessage.id, { 
                    content: accumulatedContent 
                  });
                  console.log('💾 Database updated successfully');
                } catch (dbError) {
                  console.error('❌ Database update failed:', dbError);
                  // 数据库错误不影响前端显示，只是不持久化
                }
                
                setStreamingMessageId(null);
                return; // 直接返回，不继续循环
              }
            } catch (e) {
              console.warn('⚠️ Warning:', e, 'Data:', line);
            }
          }
        }
      }

      // 如果循环正常结束（没有收到done标记），确保更新数据库
      if (streamCompleted && accumulatedContent) {
        try {
          await ChatMessage.update(savedMessage.id, { 
            content: accumulatedContent 
          });
          console.log('💾 Database updated successfully');
        } catch (dbError) {
          console.error('❌ Database update failed:', dbError);
        }
      }

    } catch (innerError) {
      console.error('❌ Stream reading internal error:', innerError);
      throw innerError; // 重新抛出让外层catch处理
    } finally {
      setStreamingMessageId(null);
    }

  } catch (error) {
    console.error('❌ Stream processing external error:', error);
    setStreamingMessageId(null);
    
    // 只有真正的网络错误才显示错误消息
    if (error.message.includes('HTTP error') || error.message.includes('Failed to fetch')) {
      const errorMessage = {
        content: "I apologize, but there was a network error while receiving the response. Please try again.",
        role: "assistant",
        conversation_id: conversationId,
        model: modelType,
      };
      const savedErrorMessage = await ChatMessage.create(errorMessage);
      setMessages(prev => [...prev, savedErrorMessage]);
    } else {
      // 其他错误（如API错误）已经在流式处理中显示了，不需要重复显示
      console.log('⚠️ Non-network error, already handled in streaming process');
    }
  }
};


  const handleSend = async (content) => {
    if (!content.trim()) return;

    const userMessage = {
      content,
      role: "user",
      conversation_id: conversationId,
      model: selectedModel,
    };

    const savedUserMessage = await ChatMessage.create(userMessage);
    setMessages((prev) => [...prev, savedUserMessage]);

    setIsLoading(true);

    try {
      // 使用流式接口替代原来的 InvokeLLM
      await handleStreamResponse(content, selectedModel);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = {
        content: "I apologize, but I encountered an error. Please try again.",
        role: "assistant",
        conversation_id: conversationId,
        model: selectedModel,
      };
      const savedErrorMessage = await ChatMessage.create(errorMessage);
      setMessages(prev => [...prev, savedErrorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  // 修改后的自动发送逻辑：使用 currentInitialMessage 而不是 props.initialMessage
  useEffect(() => {
    if (messages.length === 0 && !hasAutoSent.current) {
      const autoSendMessage = sessionStorage.getItem('autoSendMessage');
      
      if (autoSendMessage) {
        hasAutoSent.current = true;
        console.log('Auto-sending message from homepage:', autoSendMessage);
        sessionStorage.removeItem('autoSendMessage');
        
        setTimeout(() => {
          handleSend(autoSendMessage);
        }, 100);
      }
      else if (currentInitialMessage) {
        hasAutoSent.current = true;
        console.log('Auto-sending initial message:', currentInitialMessage);
        
        setTimeout(() => {
          handleSend(currentInitialMessage);
        }, 100);
      }
    }
  }, [messages.length, currentInitialMessage]);

  // 新增：当 props.initialMessage 变化时更新 currentInitialMessage
  useEffect(() => {
    if (initialMessage && initialMessage !== currentInitialMessage) {
      setCurrentInitialMessage(initialMessage);
      // 重置自动发送状态，允许新消息被自动发送
      hasAutoSent.current = false;
    }
  }, [initialMessage]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <ChatHeader
        selectedModel={selectedModel}
        onNewChat={handleNewChat}
        onBackToHome={onBackToHome}
        messageCount={messages.length}
      />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {isInitialLoad ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Start a Conversation
              </h2>
              <p className="text-gray-500 max-w-md">
                Choose an AI model and type your message below to begin chatting.
                Your conversation will be saved automatically.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  isLatest={index === messages.length - 1}
                  isStreaming={message.id === streamingMessageId} // 传递流式状态
                />
              ))}
              {isLoading && !streamingMessageId && (
                <div className="flex gap-4 mb-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg border border-gray-100">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </div>
  );
}