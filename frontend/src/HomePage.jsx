import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, MessageCircle } from "lucide-react";

export default function HomePage({ onStartChat }) {
  const [chatMessage, setChatMessage] = useState("");

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && chatMessage.trim()) {
      handleChatSend();
    }
  };

  const handleChatSend = () => {
    if (chatMessage.trim()) {
      onStartChat(chatMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Title Area */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-xl">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <Sparkles className="w-8 h-8 text-purple-500" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            AI Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Chat with advanced AI models to get intelligent responses and creative inspiration
          </p>
        </motion.div>

        {/* Feature Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4 mx-auto">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Multi-Model Support</h3>
            <p className="text-gray-600 text-sm">
              Support for DeepSeek, Creative Writing, Technical Expert and other AI models
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 mx-auto">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Smart Conversation</h3>
            <p className="text-gray-600 text-sm">
              Fluent natural language interaction that understands every question
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4 mx-auto">
              <Send className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Instant Response</h3>
            <p className="text-gray-600 text-sm">
              Get quick answers with real-time conversation and context understanding
            </p>
          </div>
        </motion.div>

        {/* Chat with AI Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mb-10"
        >
          <div className="max-w-md mx-auto">
            <p className="text-gray-600 mb-4 text-lg font-medium">
              Want to know more? Chat with me!
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter your question..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
              <Button 
                onClick={handleChatSend}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                disabled={!chatMessage.trim()}
              >
                <Send className="w-4 h-4" />
                Start Chat
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Click the button to start chatting with AI assistant
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}