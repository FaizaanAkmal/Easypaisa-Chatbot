import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Plus, Trash2, Clock, Send, User, Bot, Loader } from 'lucide-react';
import { useLocation, useNavigate } from "react-router-dom";

const FlowiseChatWithAPI = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [messages, setMessages] = useState({});
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const email = location.state?.email || 'guest';

    const CHATFLOW_ID = "503ac61c-f2de-4964-9a7b-d485ae6d574b";
    const API_HOST = "http://localhost:3000";

    const handleSignOut = () => {
        // Clear saved chats/messages if needed
        //localStorage.removeItem(storageKeys.chats);
        //localStorage.removeItem(storageKeys.messages);

        // Redirect to login page
        navigate("/");
    };

    // 🔑 Use per-user storage keys
    const storageKeys = {
        chats: `flowise-chats-${email}`,
        messages: `flowise-messages-${email}`
    };

    // Persistence functions - replace with your preferred storage method
    const saveToStorage = (chats, messages) => {
        // Option 1: Save to your backend API
        // fetch('/api/save-chats', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ chats, messages })
        // });

        // Option 2: Use localStorage (uncomment when using in your environment)
        localStorage.setItem(storageKeys.chats, JSON.stringify(chats));
        localStorage.setItem(storageKeys.messages, JSON.stringify(messages));
        
        console.log('Chat data ready to save:', { chats, messages });
    };

    const loadFromStorage = () => {
        // Option 1: Load from your backend API
        // const response = await fetch('/api/get-chats');
        // const data = await response.json();
        // return data;

        // Option 2: Use localStorage (uncomment when using in your environment)
        const savedChats = localStorage.getItem(storageKeys.chats);
        const savedMessages = localStorage.getItem(storageKeys.messages);
        return {
            chats: savedChats ? JSON.parse(savedChats) : [],
            messages: savedMessages ? JSON.parse(savedMessages) : {}
        };

        // For now, return empty data
        return { chats: [], messages: {} };
    };

    // Initialize with first chat on component mount
    useEffect(() => {
        const loadData = async () => {
            const { chats: savedChats, messages: savedMessages } = loadFromStorage();
            
            if (savedChats.length > 0) {
                setChats(savedChats);
                setMessages(savedMessages);
                setActiveChat(savedChats[0].id);
            } //else {
                //createNewChat();
            //}
        };
        
        loadData();
    }, []);

    // Save data whenever chats or messages change
    useEffect(() => {
        if (chats.length > 0) {
            saveToStorage(chats, messages);
        }
    }, [chats, messages]);

    // Initialize with first chat on component mount
    /*useEffect(() => {
        if (chats.length === 0) {
            createNewChat();
        }
    }, []);*/

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, activeChat]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const createNewChat = () => {
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const sessionId = `session_${uniqueId}`;
        const newChat = {
            id: uniqueId,
            sessionId: sessionId,
            title: `New Chat`,
            createdAt: new Date(),
            lastMessage: null
        };
        setChats(prev => [newChat, ...prev]);
        setActiveChat(newChat.id);
        setMessages(prev => ({ ...prev, [newChat.id]: [] }));
    };

    const deleteChat = (chatId, e) => {
        e.stopPropagation();
        setChats(prev => prev.filter(chat => chat.id !== chatId));
        setMessages(prev => {
            const newMessages = { ...prev };
            delete newMessages[chatId];
            return newMessages;
        });
        
        if (activeChat === chatId) {
            const remainingChats = chats.filter(chat => chat.id !== chatId);
            if (remainingChats.length > 0) {
                setActiveChat(remainingChats[0].id);
            } //else {
                //createNewChat();
            //}
        }
    };

    const selectChat = (chatId) => {
        setActiveChat(chatId);
    };

    const updateChatTitle = (chatId, firstMessage) => {
        setChats(prev => prev.map(chat => 
            chat.id === chatId && chat.title === 'New Chat'
                ? { 
                    ...chat, 
                    title: firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : '')
                }
                : chat
        ));
    };

    const sendMessage = async () => {
        if (!inputValue.trim() || !activeChat || isLoading) return;

        const currentChat = chats.find(chat => chat.id === activeChat);
        if (!currentChat) return;

        const userMessage = {
            id: Date.now().toString(),
            text: inputValue,
            isUser: true,
            timestamp: new Date()
        };

        // Add user message immediately
        setMessages(prev => ({
            ...prev,
            [activeChat]: [...(prev[activeChat] || []), userMessage]
        }));

        // Update chat title if it's the first message
        const currentMessages = messages[activeChat] || [];
        if (currentMessages.length === 0) {
            updateChatTitle(activeChat, inputValue);
        }

        const messageText = inputValue;
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_HOST}/api/v1/prediction/${CHATFLOW_ID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: messageText,
                    chatId: currentChat.sessionId,
                    history: currentMessages
                        .filter(msg => !msg.isUser || msg.text !== messageText) // Exclude the current message
                        .map(msg => ({
                            role: msg.isUser ? 'user' : 'assistant',
                            content: msg.text
                        }))
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            
            const botMessage = {
                id: Date.now().toString() + '_bot',
                text: data.text || data.answer || 'Sorry, I could not process your request.',
                isUser: false,
                timestamp: new Date(),
                sourceDocuments: data.sourceDocuments || []
            };

            // Add bot response
            setMessages(prev => ({
                ...prev,
                [activeChat]: [...(prev[activeChat] || []), botMessage]
            }));

            // Update last message in chat list
            setChats(prev => prev.map(chat => 
                chat.id === activeChat 
                    ? { ...chat, lastMessage: botMessage.text.substring(0, 50) + (botMessage.text.length > 50 ? '...' : '') }
                    : chat
            ));

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                id: Date.now().toString() + '_error',
                text: 'Sorry, there was an error processing your message. Please try again.',
                isUser: false,
                timestamp: new Date(),
                isError: true
            };

            setMessages(prev => ({
                ...prev,
                [activeChat]: [...(prev[activeChat] || []), errorMessage]
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (date) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (d.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return d.toLocaleDateString();
        }
    };

    const currentMessages = messages[activeChat] || [];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white shadow-lg flex flex-col border-r border-gray-200`}>
                {sidebarOpen && (
                    <>
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Chat History</h2>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
                                >
                                    ←
                                </button>
                            </div>
                            <button
                                onClick={createNewChat}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus size={20} />
                                New Chat
                            </button>
                        </div>

                        {/* Chat List */}
                        <div className="flex-1 overflow-y-auto">
                            {chats.map((chat) => (
                                <div
                                    key={chat.id}
                                    onClick={() => selectChat(chat.id)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                        activeChat === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <MessageCircle size={16} className="text-gray-400 flex-shrink-0" />
                                                <h3 className="font-medium text-gray-900 truncate">
                                                    {chat.title}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Clock size={12} />
                                                <span>{formatDate(chat.createdAt)}</span>
                                                <span>•</span>
                                                <span>{formatTime(chat.createdAt)}</span>
                                            </div>
                                            {chat.lastMessage && (
                                                <p className="text-sm text-gray-600 mt-1 truncate">
                                                    {chat.lastMessage}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => deleteChat(chat.id, e)}
                                            className="ml-2 p-1 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* ✅ Sign Out Button */}
                        <div className="p-4 border-t border-gray-200">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                <Trash2 size={20} />
                                Sign Out
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between">
                    {!sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                        >
                            <MessageCircle size={20} />
                        </button>
                    )}
                    <div className="flex-1 text-center">
                        <h1 className="text-lg font-semibold text-gray-800">
                            {activeChat ? chats.find(chat => chat.id === activeChat)?.title : 'Select a Chat'}
                        </h1>
                    </div>
                    <div className="w-10"></div> {/* Spacer for centering */}
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeChat ? (
                        <>
                            {currentMessages.length === 0 && (
                                <div className="text-center text-gray-500 mt-8">
                                    <Bot size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg">Start a conversation!</p>
                                    <p className="text-sm">Type a message below to begin chatting.</p>
                                </div>
                            )}
                            
                            {currentMessages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    {!message.isUser && (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Bot size={16} className="text-blue-600" />
                                        </div>
                                    )}
                                    
                                    <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                                        message.isUser 
                                            ? 'bg-blue-600 text-white' 
                                            : message.isError 
                                                ? 'bg-red-100 text-red-800 border border-red-200'
                                                : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        <p className="whitespace-pre-wrap">{message.text}</p>
                                        <div className={`text-xs mt-1 ${
                                            message.isUser ? 'text-blue-100' : 'text-gray-500'
                                        }`}>
                                            {formatTime(message.timestamp)}
                                        </div>
                                        
                                        {/* Source Documents */}
                                        {message.sourceDocuments && message.sourceDocuments.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                <p className="text-xs text-gray-600 mb-1">Sources:</p>
                                                <div className="space-y-1">
                                                    {message.sourceDocuments.map((doc, idx) => (
                                                        <div key={idx} className="text-xs bg-white p-2 rounded border">
                                                            <p className="font-medium">{doc.metadata?.source || `Source ${idx + 1}`}</p>
                                                            <p className="text-gray-600 truncate">{doc.pageContent?.substring(0, 100)}...</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {message.isUser && (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                            <User size={16} className="text-gray-600" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {isLoading && (
                                <div className="flex gap-3 justify-start">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Bot size={16} className="text-blue-600" />
                                    </div>
                                    <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Loader size={16} className="animate-spin" />
                                            <span>Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-lg">Select a chat to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Message Input */}
                {activeChat && (
                    <div className="bg-white border-t border-gray-200 p-4">
                        <div className="flex gap-2 max-w-4xl mx-auto">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows="1"
                                style={{ minHeight: '40px', maxHeight: '120px' }}
                                disabled={isLoading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!inputValue.trim() || isLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader size={20} className="animate-spin" />
                                ) : (
                                    <Send size={20} />
                                )}
                            </button>
                        </div>
                        
                        <div className="text-center mt-2">
                            <p className="text-xs text-gray-500">
                                Press Enter to send, Shift+Enter for new line
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlowiseChatWithAPI;