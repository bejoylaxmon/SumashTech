'use client';

import { useState } from 'react';

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-10 right-10 z-[100] font-sans">
            {/* Chat Window */}
            <div className={`absolute bottom-20 right-0 w-80 bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/20 overflow-hidden transition-all duration-500 origin-bottom-right ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-90 pointer-events-none'
                }`}>
                <div className="bg-secondary p-6 text-white relative">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                            <span className="text-xl">🤖</span>
                        </div>
                        <div>
                            <p className="font-black text-xs uppercase tracking-widest text-[#FFF5EB]">Sumash Tech</p>
                            <h3 className="font-black text-base uppercase tracking-tight leading-none mt-1 text-white">AI Assistant</h3>
                        </div>
                    </div>
                </div>

                <div className="p-6 h-80 overflow-y-auto space-y-4 bg-gray-50/50">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm max-w-[90%]">
                        <p className="text-sm font-bold text-secondary">
                            Hello! Sir, How can I help you today?
                        </p>
                        <span className="text-[10px] text-gray-400 mt-2 block font-black uppercase tracking-widest">Bot • Just now</span>
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-grow bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl px-4 py-3 outline-none text-sm font-bold text-secondary transition-all"
                    />
                    <button className="bg-primary text-white p-3 rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-primary/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group relative flex items-center gap-4 focus:outline-none"
            >
                <div className="absolute right-full mr-4 bg-white text-secondary px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 shadow-2xl shadow-secondary/20 border border-gray-100 whitespace-nowrap hidden md:block">
                    Sir, How can I help?
                </div>
                <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center shadow-2xl shadow-primary/40 border-4 border-white transition-all transform hover:scale-110 active:scale-95 group-hover:rounded-full">
                    <span className="text-2xl transition-transform group-hover:rotate-12 group-active:rotate-45">
                        {isOpen ? '✕' : '💬'}
                    </span>
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                </div>
            </button>
        </div>
    );
}
