import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send, Bot, User, Sparkles } from 'lucide-react';

function ChatAi({ problem }) {
    const [messages, setMessages] = useState([
        { role: 'model', parts: [{ text: "Hello! I'm your DSA assistant. I can help you with hints, code review, and explanations for this problem. What would you like to know?" }] }
    ]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [typingMessage, setTypingMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingMessage]);

    // Typing effect function
    const typeMessage = (text, callback) => {
        setIsTyping(true);
        let index = 0;
        const speed = 15; // typing speed in ms
        
        const type = () => {
            if (index < text.length) {
                setTypingMessage(text.substring(0, index + 1));
                index++;
                setTimeout(type, speed);
            } else {
                setIsTyping(false);
                setTypingMessage("");
                callback();
            }
        };
        
        type();
    };

    const onSubmit = async (data) => {
        if (!data.message.trim()) return;
        
        const userMessage = { 
            role: 'user', 
            parts: [{ text: data.message }] 
        };
        
        setMessages(prev => [...prev, userMessage]);
        reset();
        setIsLoading(true);
        
        try {
            const messagesForApi = [...messages, userMessage];
            
            const response = await axiosClient.post("/ai/chat", {
                messages: messagesForApi,
                title: problem?.title || "Coding Problem",
                description: problem?.description || "",
                testCases: problem?.visibleTestCases || [],
                startCode: problem?.startCode || ""
            });
            
            // Use typing effect for AI response
            const aiResponse = response.data.message;
            typeMessage(aiResponse, () => {
                setMessages(prev => [...prev, { 
                    role: 'model', 
                    parts: [{ text: aiResponse }] 
                }]);
            });
            
        } catch (error) {
            console.error("API Error:", error);
            let errorMessage = "Sorry, I encountered an error. Please try again.";
            
            if (error.response) {
                errorMessage = `Error: ${error.response.data?.message || "Server error"}`;
            } else if (error.request) {
                errorMessage = "No response from server. Please check your connection.";
            }
            
            typeMessage(errorMessage, () => {
                setMessages(prev => [...prev, { 
                    role: 'model', 
                    parts: [{ text: errorMessage }]
                }]);
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-[80vh] min-h-[500px] bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#1a1f2e] relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 border-b border-gray-700/50 bg-[#1a1f2e]/80 backdrop-blur-xl p-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-75 animate-pulse-slow"></div>
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                            <Sparkles size={20} className="text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            DSA Assistant
                        </h2>
                        <p className="text-xs text-gray-400">Powered by AI</p>
                    </div>
                </div>
            </div>
            
            {/* Messages Container */}
            <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} message-enter`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            {msg.role === "model" && (
                                <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-md animate-pulse-slow"></div>
                            )}
                            <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110 ${
                                msg.role === "user" 
                                    ? "bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 hover:shadow-purple-500/50" 
                                    : "bg-gradient-to-br from-gray-700 to-gray-900 hover:shadow-blue-500/50 ring-2 ring-blue-500/20"
                            }`}>
                                {msg.role === "user" ? (
                                    <User size={18} className="text-white" />
                                ) : (
                                    <Bot size={18} className="text-blue-400" />
                                )}
                            </div>
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={`flex flex-col max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                            <span className="text-xs font-medium text-gray-400 mb-1.5 px-1">
                                {msg.role === "user" ? "You" : "AI Assistant"}
                            </span>
                            <div className={`group relative rounded-2xl px-5 py-3.5 shadow-xl transform transition-all duration-300 hover:scale-[1.02] ${
                                msg.role === "user" 
                                    ? "bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white rounded-tr-sm hover:shadow-purple-500/50" 
                                    : "bg-[#252b3d]/90 backdrop-blur-sm text-gray-100 border border-gray-700/50 rounded-tl-sm hover:border-blue-500/30 hover:shadow-blue-500/20"
                            }`}>
                                {msg.role === "user" && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl rounded-tr-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                )}
                                <div className="relative whitespace-pre-wrap break-words text-sm leading-relaxed">
                                    {msg.parts[0].text}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Typing Indicator with Message */}
                {isTyping && (
                    <div className="flex items-start gap-3 message-enter">
                        <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-md animate-pulse-slow"></div>
                            <div className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 shadow-lg ring-2 ring-blue-500/20">
                                <Bot size={18} className="text-blue-400" />
                            </div>
                        </div>
                        <div className="flex flex-col max-w-[75%]">
                            <span className="text-xs font-medium text-gray-400 mb-1.5 px-1">
                                AI Assistant
                            </span>
                            <div className="rounded-2xl rounded-tl-sm px-5 py-3.5 bg-[#252b3d]/90 backdrop-blur-sm border border-blue-500/30 shadow-xl shadow-blue-500/20">
                                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-100">
                                    {typingMessage}
                                    <span className="inline-block w-0.5 h-4 bg-gradient-to-b from-blue-400 to-purple-400 ml-1 animate-blink"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Loading indicator when waiting for response */}
                {isLoading && !isTyping && (
                    <div className="flex items-start gap-3 message-enter">
                        <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-md animate-pulse-slow"></div>
                            <div className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 shadow-lg ring-2 ring-blue-500/20">
                                <Bot size={18} className="text-blue-400" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-400 mb-1.5 px-1">
                                AI Assistant
                            </span>
                            <div className="rounded-2xl rounded-tl-sm px-5 py-3.5 bg-[#252b3d]/90 backdrop-blur-sm border border-blue-500/30 shadow-xl shadow-blue-500/20">
                                <div className="flex gap-1.5">
                                    <span className="w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce-smooth" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce-smooth" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2.5 h-2.5 bg-gradient-to-r from-pink-400 to-blue-400 rounded-full animate-bounce-smooth" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>
            
            {/* Input Form */}
            <div className="relative z-10 border-t border-gray-700/50 bg-[#1a1f2e]/80 backdrop-blur-xl p-4">
                <div onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                            <input 
                                placeholder="Ask me about the problem..." 
                                className="relative w-full bg-[#252b3d]/90 backdrop-blur-sm border border-gray-600/50 rounded-xl px-5 py-3.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 shadow-lg" 
                                {...register("message", { 
                                    required: "Message is required", 
                                    minLength: { 
                                        value: 2, 
                                        message: "Message must be at least 2 characters" 
                                    },
                                    maxLength: { 
                                        value: 1000, 
                                        message: "Message is too long (max 1000 characters)" 
                                    }
                                })}
                                disabled={isLoading}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(onSubmit)();
                                    }
                                }}
                            />
                        </div>
                        <button 
                            type="button"
                            onClick={handleSubmit(onSubmit)}
                            className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 overflow-hidden group ${
                                isLoading 
                                    ? "bg-gray-600 cursor-not-allowed" 
                                    : "bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 active:scale-95"
                            }`}
                            disabled={isLoading}
                        >
                            {!isLoading && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            )}
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin-smooth"></div>
                            ) : (
                                <Send size={20} className="text-white relative z-10 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                            )}
                        </button>
                    </div>
                    {errors.message && (
                        <p className="text-red-400 text-xs mt-2 ml-1 message-enter flex items-center gap-1">
                            <span className="inline-block w-1 h-1 bg-red-400 rounded-full animate-pulse"></span>
                            {errors.message.message}
                        </p>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes message-enter {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @keyframes blob {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    25% {
                        transform: translate(20px, -20px) scale(1.1);
                    }
                    50% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    75% {
                        transform: translate(20px, 20px) scale(1.05);
                    }
                }
                
                @keyframes pulse-slow {
                    0%, 100% {
                        opacity: 0.5;
                    }
                    50% {
                        opacity: 1;
                    }
                }
                
                @keyframes blink {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0;
                    }
                }
                
                @keyframes bounce-smooth {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-8px);
                    }
                }
                
                @keyframes spin-smooth {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                
                .message-enter {
                    animation: message-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .animate-blob {
                    animation: blob 7s infinite;
                }
                
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                
                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }
                
                .animate-blink {
                    animation: blink 1s step-end infinite;
                }
                
                .animate-bounce-smooth {
                    animation: bounce-smooth 1s ease-in-out infinite;
                }
                
                .animate-spin-smooth {
                    animation: spin-smooth 1s linear infinite;
                }
                
                /* Custom Scrollbar */
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: rgba(75, 85, 99, 0.5);
                    border-radius: 3px;
                }
                
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: rgba(75, 85, 99, 0.8);
                }
            `}</style>
        </div>
    );
}

export default ChatAi;