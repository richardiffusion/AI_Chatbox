
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "@/entities/ChatMessage";
import { InvokeLLM } from "@/integrations/Core";
import ChatMessageComponent from "./Components/chat/ChatMessage";
import ChatInput from "./Components/chat/ChatInput";
import ChatHeader from "./Components/chat/ChatHeader";
import { Loader2 } from "lucide-react";


// 20251013：添加了参数{ initialMessage = "", onBackToHome }
export default function ChatPage({ initialMessage = "", onBackToHome }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("general");
  const [conversationId, setConversationId] = useState(generateConversationId());
  const messagesEndRef = useRef(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 20251013：添加 useRef 来跟踪是否已经自动发送过消息
  const hasAutoSent = useRef(false);

  function generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Memoize loadMessages to prevent unnecessary re-creations and fix useEffect dependency
  const loadMessages = useCallback(async () => {
    setIsInitialLoad(true);
    const loadedMessages = await ChatMessage.filter(
      { conversation_id: conversationId },
      "created_date",
      100
    );
    setMessages(loadedMessages);
    setIsInitialLoad(false);
  }, [conversationId]); // Dependency array includes conversationId

  useEffect(() => {
    loadMessages();
  }, [loadMessages]); // Now correctly depends on the memoized loadMessages

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

//20251013：修改内容，自动发送首页信息
  // 统一自动发送逻辑 - 替换原来的两个 useEffect
  useEffect(() => {
    // 只在消息列表为空且尚未自动发送时执行
    if (messages.length === 0 && !hasAutoSent.current) {
      const autoSendMessage = sessionStorage.getItem('autoSendMessage');
      
      // 优先使用 sessionStorage 中的消息
      if (autoSendMessage) {
        hasAutoSent.current = true; // 立即标记为已发送
        console.log('Auto-sending message from homepage:', autoSendMessage);
        sessionStorage.removeItem('autoSendMessage'); // 立即清除
        
        // 使用 setTimeout 确保状态更新完成
        setTimeout(() => {
          handleSend(autoSendMessage);
        }, 100);
      }
      // 如果没有 sessionStorage 消息，但有 initialMessage，也发送
      else if (initialMessage) {
        hasAutoSent.current = true; // 立即标记为已发送
        console.log('Auto-sending initial message:', initialMessage);
        
        // 使用 setTimeout 确保状态更新完成
        setTimeout(() => {
          handleSend(initialMessage);
        }, 100);
      }
    }
  }, [messages.length, initialMessage]); // 依赖项包括 messages.length 和 initialMessage


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

    //20251015修改，全部提示词逻辑都在后端处理
    try {
      // 注意：我们不再在前端构建提示词
      // 完整的提示词构建现在由后端处理
      const response = await InvokeLLM({
        prompt: content, // 只发送用户消息，提示词由后端添加
        model: selectedModel,
      });
    // 修改完毕

      const assistantMessage = {
        content: response,
        role: "assistant",
        conversation_id: conversationId,
        model: selectedModel,
      };

      const savedAssistantMessage = await ChatMessage.create(assistantMessage);
      setMessages((prev) => [...prev, savedAssistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = {
        content: "I apologize, but I encountered an error. Please try again.",
        role: "assistant",
        conversation_id: conversationId,
        model: selectedModel,
      };
      const savedErrorMessage = await ChatMessage.create(errorMessage);
      setMessages((prev) => [...prev, savedErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setConversationId(generateConversationId());
    setMessages([]);
    // 20251014：重置自动发送标记 - 但只在没有待发送消息时
    const autoSendMessage = sessionStorage.getItem('autoSendMessage');
    if (!autoSendMessage && !initialMessage) {
      hasAutoSent.current = false;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <ChatHeader
        selectedModel={selectedModel}
        onNewChat={handleNewChat}
        onBackToHome={onBackToHome} // 20251013：添加这个prop
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
                />
              ))}
              {isLoading && (
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
