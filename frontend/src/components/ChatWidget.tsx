'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: number;
  sender: string;
  senderName?: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: number;
  customerId: number;
  customerName?: string;
  customerEmail?: string;
  status: string;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCustomer: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:54321';

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isCustomer = user?.role === 'CUSTOMER';

  useEffect(() => {
    if (isCustomer && user) {
      fetchConversations();
    }
  }, [isCustomer, user]);

  useEffect(() => {
    if (currentConversation) {
      fetchMessages();
    }
  }, [currentConversation]);

  useEffect(() => {
    if (isOpen && currentConversation) {
      fetchMessages();
    }
  }, [isOpen]);

  // Auto-refresh messages every 3 seconds when chat is open
  useEffect(() => {
    if (!isOpen || !currentConversation) return;
    
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, currentConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/customer/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !currentConversation) {
          setCurrentConversation(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const fetchMessages = async () => {
    if (!currentConversation) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/conversation/${currentConversation.id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        await fetch(`${API_URL}/api/chat/conversation/${currentConversation.id}/read`, { method: 'PUT' });
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setLoading(true);
    try {
      let conversationId = currentConversation?.id;
      
      const res = await fetch(`${API_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          customerId: user.id,
          customerName: user.name,
          content: newMessage
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentConversation(data.conversation);
        setNewMessage('');
        fetchMessages();
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
    setLoading(false);
  };

  const startNewChat = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: user.id,
          customerName: user.name,
          customerEmail: user.email
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentConversation(data);
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isCustomer) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 flex items-center justify-center"
        style={{ boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)' }}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chat
          </>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-[500px] bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200">
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Customer Support</h3>
              <p className="text-xs text-blue-100">We are here to help!</p>
            </div>
            {conversations.length === 0 && (
              <button
                onClick={startNewChat}
                className="text-xs bg-white text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
              >
                Start Chat
              </button>
            )}
          </div>

          {currentConversation ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.sender === 'customer'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'customer' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !newMessage.trim()}
                    className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 text-center">
              <div>
                <p className="text-gray-500 mb-4">Start a conversation with our support team</p>
                <button
                  onClick={startNewChat}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
