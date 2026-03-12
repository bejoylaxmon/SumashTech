'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import MessageRenderer from './chat/MessageRenderer';
import { ComponentMessage } from './chat/types';

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

interface FunnelAnswer {
  question: string;
  answer: string;
}

type FunnelStage = 'intent' | 'product_type' | 'budget' | 'order_issue' | 'contact' | 'complete' | 'chat';

const INTENT_OPTIONS = [
  { value: 'product', label: 'I have a question about a product' },
  { value: 'order', label: 'I need help with an order' },
  { value: 'pricing', label: 'I want to inquire about pricing' },
  { value: 'technical', label: 'Technical support' },
  { value: 'other', label: 'Other' },
];

const PRODUCT_TYPES = [
  { value: 'smartphone', label: 'Smartphone' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'smartwatch', label: 'Smart Watch' },
  { value: 'audio', label: 'Audio' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'gadgets', label: 'Gadgets' },
  { value: 'other', label: 'Other' },
];

const BUDGET_RANGES = [
  { value: 'under_20000', label: 'Under ৳20,000' },
  { value: '20000_50000', label: '৳20,000 - ৳50,000' },
  { value: '50000_100000', label: '৳50,000 - ৳100,000' },
  { value: 'above_100000', label: 'Above ৳100,000' },
];

const ORDER_ISSUES = [
  { value: 'status', label: 'Order status inquiry' },
  { value: 'modify', label: 'Modify order' },
  { value: 'cancel', label: 'Cancel order' },
  { value: 'payment', label: 'Payment issue' },
  { value: 'delivery', label: 'Delivery issue' },
  { value: 'other', label: 'Other' },
];

const AUTO_RESPONSES: Record<string, string> = {
  product: "Great! To help you better, I'd like to ask a few questions.",
  pricing: "I'd be happy to help with pricing! Could you tell me which product you're interested in?",
  technical: "I'll connect you with our technical support team. Please share more details about the issue.",
  order: "I'll help you with your order. Let me ask a few questions.",
  other: "No problem! I'll connect you with an agent. Please share what you need help with.",
  smartphone: "We have great smartphones from Apple, Samsung, Xiaomi, and more. What's your budget?",
  laptop: "We have laptops from top brands like MacBook, Dell, Asus, and more. What's your budget?",
  tablet: "We have tablets including iPad and Android tablets. What's your budget?",
  smartwatch: "We have smartwatches from Apple, Samsung, and more.",
  audio: "We have headphones and earbuds from top brands like Sony, Apple, and more.",
  gaming: "We have gaming laptops, consoles, and accessories.",
  gadgets: "We have various gadgets including cameras, drones, and smart home devices.",
  under_20000: "Great! We have some excellent options in this range. Let me connect you with an agent who can show you the best deals.",
  "20000_50000": "Excellent choice! We have many great products in this range. Let me connect you with an agent.",
  "50000_100000": "Premium products available! Let me connect you with an agent for personalized recommendations.",
  above_100000: "Top-of-the-line products await! Let me connect you with our premium product specialist.",
  status: "For order status, you can track your order at our website. Your order ID would help me check it for you.",
  modify: "I can help modify your order. Please share your order number.",
  cancel: "I understand you want to cancel. Let me help you with that. Please share your order number.",
  payment: "I'm sorry to hear about the payment issue. Let me help you resolve it.",
  delivery: "I can help with delivery concerns. Please share your order number and location.",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:54321';

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('intent');
  const [funnelAnswers, setFunnelAnswers] = useState<FunnelAnswer[]>([]);
  const [showFunnel, setShowFunnel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isCustomer = user?.role === 'CUSTOMER';

  useEffect(() => {
    if (isCustomer && user) {
      fetchConversations();
    }
  }, [isCustomer, user]);

  useEffect(() => {
    if (currentConversation && !showFunnel) {
      fetchMessages();
    }
  }, [currentConversation, showFunnel]);

  useEffect(() => {
    if (isOpen && currentConversation && !showFunnel) {
      fetchMessages();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !currentConversation || showFunnel) return;

    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, currentConversation, showFunnel]);

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
          if (data[0].messages && (data[0].messages as Message[]).length > 0) {
            setShowFunnel(false);
            setFunnelStage('chat');
          }
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

  const sendMessage = async (content?: string) => {
    const messageContent = content || newMessage;
    if (!messageContent.trim() || !user) return;
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
          content: messageContent
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
        setFunnelStage('intent');
        setFunnelAnswers([]);
        setShowFunnel(true);
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  const skipFunnel = async () => {
    setShowFunnel(false);
    setFunnelStage('chat');
  };

  const handleFunnelAnswer = async (question: string, answer: string, nextStage: FunnelStage) => {
    const newAnswers = [...funnelAnswers, { question, answer }];
    setFunnelAnswers(newAnswers);

    const fullContext = newAnswers
      .map(a => `${a.question}: ${a.answer}`)
      .join('\n');

    if (nextStage === 'complete') {
      await sendMessage(`Funnel Complete:\n${fullContext}\n\nPlease help me with: ${answer}`);
      setShowFunnel(false);
    } else if (nextStage === 'chat') {
      await sendMessage(answer);
      setShowFunnel(false);
    } else {
      setFunnelStage(nextStage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderFunnel = () => {
    switch (funnelStage) {
      case 'intent':
        return (
          <div className="p-4 space-y-3">
            <p className="text-sm font-medium text-gray-800 mb-3">Hi! How can we help you today?</p>
            {INTENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFunnelAnswer('Intent', option.value,
                  option.value === 'product' ? 'product_type' :
                    option.value === 'order' ? 'order_issue' : 'complete')}
                className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-blue-50 border rounded-lg transition-colors"
              >
                {option.label}
              </button>
            ))}
            <button
              onClick={skipFunnel}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2"
            >
              Skip and talk to agent →
            </button>
          </div>
        );

      case 'product_type':
        return (
          <div className="p-4 space-y-3">
            <p className="text-sm font-medium text-gray-800 mb-3">What type of product?</p>
            {PRODUCT_TYPES.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFunnelAnswer('Product Type', option.value, 'budget')}
                className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-blue-50 border rounded-lg transition-colors"
              >
                {option.label}
              </button>
            ))}
            <button
              onClick={skipFunnel}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2"
            >
              Skip →
            </button>
          </div>
        );

      case 'budget':
        return (
          <div className="p-4 space-y-3">
            <p className="text-sm font-medium text-gray-800 mb-3">What's your budget range?</p>
            {BUDGET_RANGES.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFunnelAnswer('Budget', option.value, 'complete')}
                className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-blue-50 border rounded-lg transition-colors"
              >
                {option.label}
              </button>
            ))}
            <button
              onClick={skipFunnel}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2"
            >
              Skip →
            </button>
          </div>
        );

      case 'order_issue':
        return (
          <div className="p-4 space-y-3">
            <p className="text-sm font-medium text-gray-800 mb-3">What seems to be the issue?</p>
            {ORDER_ISSUES.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFunnelAnswer('Order Issue', option.value, 'contact')}
                className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-blue-50 border rounded-lg transition-colors"
              >
                {option.label}
              </button>
            ))}
            <button
              onClick={skipFunnel}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2"
            >
              Skip →
            </button>
          </div>
        );

      case 'contact':
        return (
          <div className="p-4 space-y-3">
            <p className="text-sm font-medium text-gray-800 mb-3">Would you like to share your phone number for faster assistance?</p>
            <input
              type="tel"
              placeholder="+88 01XXXXXXXXX"
              className="w-full border rounded-lg px-4 py-2 text-sm mb-2"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleFunnelAnswer('Phone', (e.target as HTMLInputElement).value, 'complete');
                }
              }}
            />
            <button
              onClick={() => handleFunnelAnswer('Phone', 'Not provided', 'complete')}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              Continue without phone
            </button>
            <button
              onClick={skipFunnel}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2"
            >
              Talk to agent now →
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // We allow everyone to see the chat button, but only customers can chat
  // Admins also see it for testing/convenience
  const showWidget = true;

  if (!showWidget) return null;

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
              <p className="text-xs text-blue-100 italic">
                {currentConversation ? `Conversation #${currentConversation.id}` : (showFunnel ? 'Answer a few questions →' : 'We are here to help!')}
              </p>
            </div>
            {showFunnel && funnelStage !== 'intent' && (
              <button
                onClick={skipFunnel}
                className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30"
              >
                Skip
              </button>
            )}
          </div>

          {showFunnel ? (
            <div className="flex-1 overflow-y-auto">
              {renderFunnel()}
            </div>
          ) : currentConversation ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg) => {
                  let parsedMessage: ComponentMessage;
                  try {
                    parsedMessage = JSON.parse(msg.content);
                    if (!parsedMessage.type) {
                      throw new Error('Not a valid ComponentMessage');
                    }
                  } catch (e) {
                    // Fallback for legacy text messages
                    parsedMessage = {
                      type: 'text',
                      data: { message: msg.content }
                    };
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'customer'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 shadow-sm text-gray-800'
                          }`}
                      >
                        <MessageRenderer
                          message={parsedMessage}
                          onAction={(action, payload) => {
                            if (action === 'button_click') {
                              sendMessage(payload);
                            }
                          }}
                        />
                        <p className={`text-xs mt-1 text-right ${msg.sender === 'customer' ? 'text-blue-100' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
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
                    onClick={() => sendMessage()}
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
          ) : !user ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center bg-gray-50">
              <div className="space-y-4">
                <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="font-black text-secondary uppercase tracking-widest text-sm">Members Only</h4>
                <p className="text-xs text-gray-500 font-medium">Please login to start a conversation with our support team.</p>
                <Link
                  href="/login"
                  className="block w-full bg-primary text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:bg-orange-600 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  Login / Sign Up
                </Link>
              </div>
            </div>
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
