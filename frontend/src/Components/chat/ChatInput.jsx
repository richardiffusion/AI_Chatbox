import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

const AI_MODELS = [
  { id: "deepseek", name: "DeepSeek Reasoning", description: "Analytical" },
  { id: "creative", name: "Creative Writer", description: "Imaginative" },
  { id: "technical", name: "Technical Expert", description: "Engineering-focused" },
  { id: "general", name: "General Assistant", description: "Balanced" },
];

export default function ChatInput({ onSend, isLoading, selectedModel, onModelChange }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white/80 backdrop-blur-lg p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-2 rounded-xl">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Select your assistant</h3>
            </div>
          </div>

          <div className="relative group">
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl px-4 py-4 pr-12 text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer appearance-none font-semibold text-gray-700 group-hover:border-purple-400"
            >
              {AI_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            
            {/* Animation Arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
              <div className="transition-transform duration-300 group-hover:translate-y-0.5">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Model Features Tags */}
          <div className="mt-3 flex flex-wrap gap-2">
            {AI_MODELS.find(model => model.id === selectedModel)?.description.split(' ').map((word, index) => (
              <span 
                key={index}
                className="px-2.5 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-xs font-medium border border-purple-200"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
                
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="min-h-[60px] max-h-[200px] resize-none bg-white border-gray-200 shadow-sm focus:border-purple-400 focus:ring-purple-400"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-[60px] px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}