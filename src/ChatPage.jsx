
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage } from "@/entities/ChatMessage";
import { InvokeLLM } from "@/integrations/Core";
import ChatMessageComponent from "./Components/chat/ChatMessage";
import ChatInput from "./Components/chat/ChatInput";
import ChatHeader from "./Components/chat/ChatHeader";
import { Loader2 } from "lucide-react";

const MODEL_PROMPTS = {
  deepseek: "You are DeepSeek, an AI assistant focused on deep reasoning and analytical thinking. Provide thorough, well-reasoned responses with clear logical steps.",
  creative: "You are a creative writing assistant. Be imaginative, expressive, and engaging in your responses. Use vivid language and storytelling.",
  technical: "You are a technical expert specializing in programming, engineering, and technology. Provide clear, practical solutions with code examples when relevant.",
  general: "You are a helpful, friendly AI assistant. Provide balanced, informative responses to any questions.",
};

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("general");
  const [conversationId, setConversationId] = useState(generateConversationId());
  const messagesEndRef = useRef(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
      const conversationHistory = messages
        .slice(-6)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      const systemPrompt = MODEL_PROMPTS[selectedModel] || MODEL_PROMPTS.general;
      
      const fullPrompt = conversationHistory
        ? `${systemPrompt}\n\nConversation history:\n${conversationHistory}\n\nUser: ${content}\n\nAssistant:`
        : `${systemPrompt}\n\nUser: ${content}\n\nAssistant:`;

      const response = await InvokeLLM({
        prompt: fullPrompt,
      });

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
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <ChatHeader
        selectedModel={selectedModel}
        onNewChat={handleNewChat}
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
