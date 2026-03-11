import React, { useState, useRef, useEffect } from "react";
import { OmiaAvatar } from "./OmiaBot";
import { trpc } from "@/lib/trpc";
import { X, Send, MessageCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Hi! I'm Omia, your KCO Properties application assistant. How can I help you today?",
};

interface OmiaChatWidgetProps {
  context?: string;
}

export function OmiaChatWidget({ context }: OmiaChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = trpc.rental.chatbot.chat.useMutation({
    onSuccess: (data) => {
      const content = typeof data.message === "string" ? data.message : String(data.message);
      setMessages((prev) => [...prev, { role: "assistant", content }]);
      setIsTyping(false);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm sorry, I'm having trouble responding right now. Please continue with your application." },
      ]);
      setIsTyping(false);
    },
  });

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSend = () => {
    const message = inputValue.trim();
    if (!message) return;

    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    chatMutation.mutate({
      message,
      context,
      history: messages.slice(-6),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-2 sm:right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col animate-slide-in"
          style={{ width: 'min(calc(100vw - 1rem), 24rem)', maxHeight: '70vh' }}
          role="dialog"
          aria-label="Omia Chat Assistant"
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-t-2xl"
            style={{ background: "linear-gradient(135deg, #0099CC 0%, #007BA3 100%)" }}
          >
            <OmiaAvatar size={32} />
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Omia</p>
              <p className="text-white text-xs opacity-80">KCO Properties Assistant</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white opacity-80 hover:opacity-100 transition-opacity"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 200, maxHeight: 350 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
              >
                {msg.role === "assistant" && (
                  <OmiaAvatar size={24} />
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                  style={msg.role === "user" ? { backgroundColor: "#0099CC" } : {}}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start gap-2">
                <OmiaAvatar size={24} />
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Omia anything..."
                className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400"
                maxLength={500}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
                style={{ backgroundColor: "#0099CC" }}
                aria-label="Send message"
              >
                <Send size={13} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: isOpen
            ? "linear-gradient(135deg, #CC0000 0%, #AA0000 100%)"
            : "linear-gradient(135deg, #0099CC 0%, #007BA3 100%)",
        }}
        aria-label={isOpen ? "Close Omia chat" : "Open Omia chat"}
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-white" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            ?
          </span>
        )}
      </button>
    </>
  );
}
