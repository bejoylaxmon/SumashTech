'use client';

import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: number;
  sender: string;
  senderName?: string;
  senderId?: number;
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
  unreadAdmin: number;
  createdAt: string;
}

export default function AdminChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const apiBase = API_BASE;

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-refresh conversations and messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
      fetchUnreadCount();
      if (selectedConversation) {
        fetchMessages();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`${apiBase}/api/admin/chat/conversations`, {
        headers: { 'x-user-email': userData.email }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`${apiBase}/api/admin/chat/unread`, {
        headers: { 'x-user-email': userData.email }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`${apiBase}/api/admin/chat/conversation/${selectedConversation.id}/messages`, {
        headers: { 'x-user-email': userData.email }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        fetchConversations();
        fetchUnreadCount();
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const sendReply = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`${apiBase}/api/admin/chat/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userData.email
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          adminId: user.id,
          adminName: user.name,
          content: newMessage
        })
      });

      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    }
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chat Management</h1>
          <p className="text-gray-600">Manage customer conversations</p>
        </div>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full">
            {unreadCount} unread
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
          <div className="bg-blue-600 text-white p-4">
            <h2 className="font-semibold">Conversations ({conversations.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No conversations yet</div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">
                        {conv.customerName || `Customer #${conv.customerId}`}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{conv.lastMessage || 'No messages'}</p>
                    </div>
                    {conv.unreadAdmin > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {conv.unreadAdmin}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(conv.lastMessageAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              <div className="bg-gray-100 p-4 border-b">
                <h3 className="font-semibold text-gray-800">
                  {selectedConversation.customerName || `Customer #${selectedConversation.customerId}`}
                </h3>
                {selectedConversation.customerEmail && (
                  <p className="text-sm text-gray-500">{selectedConversation.customerEmail}</p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.sender === 'admin'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <div className={`text-xs mt-1 flex items-center gap-2 ${
                        msg.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>{formatDate(msg.createdAt)}</span>
                        {msg.sender === 'admin' && (
                          <span>{msg.isRead ? '✓✓' : '✓'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your reply..."
                    className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                  <button
                    onClick={sendReply}
                    disabled={loading || !newMessage.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
