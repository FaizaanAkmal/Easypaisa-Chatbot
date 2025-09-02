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
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const messagesEndRef = useRef(null);

    const email = location.state?.email || 'guest';

    // Configuration
    const CHATFLOW_ID = "503ac61c-f2de-4964-9a7b-d485ae6d574b";
    const FLOWISE_API_HOST = "http://localhost:3000";
    const BACKEND_API_HOST = "http://localhost:8000"; // Your backend server

    const handleSignOut = async () => {
        try {
            // Save current state before signing out
            await saveToBackend(chats, messages);
        } catch (error) {
            console.error('Error saving before sign out:', error);
        }
        navigate("/");
    };

    // Backend API functions
    const saveToBackend = async (chatsData, messagesData) => {
        try {
            const response = await fetch(`${BACKEND_API_HOST}/api/chats/bulk-save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: email,
                    chats: chatsData,
                    messages: messagesData
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to save: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Data saved to backend:', result);
        } catch (error) {
            console.error('❌ Error saving to backend:', error);
            // Fallback to localStorage if backend fails
            localStorage.setItem(`flowise-chats-${email}`, JSON.stringify(chatsData));
            localStorage.setItem(`flowise-messages-${email}`, JSON.stringify(messagesData));
        }
    };

    const loadFromBackend = async () => {
        try {
            const response = await fetch(`${BACKEND_API_HOST}/api/chats/${encodeURIComponent(email)}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Error loading from backend:', error);
            // Fallback to localStorage if backend fails
            const savedChats = localStorage.getItem(`flowise-chats-${email}`);
            const savedMessages = localStorage.getItem(`flowise-messages-${email}`);
            return {
                chats: savedChats ? JSON.parse(savedChats) : [],
                messages: savedMessages ? JSON.parse(savedMessages) : {}
            };
        }
    };

    const saveSingleChat = async (chatData) => {
        try {
            await fetch(`${BACKEND_API_HOST}/api/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: email,
                    chatData: chatData
                })
            });
        } catch (error) {
            console.error('Error saving single chat:', error);
        }
    };

    const addMessageToBackend = async (chatId, messageData) => {
        try {
            await fetch(`${BACKEND_API_HOST}/api/chats/${encodeURIComponent(email)}/${chatId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messageData: messageData
                })
            });
        } catch (error) {
            console.error('Error adding message to backend:', error);
        }
    };

    const deleteChatFromBackend = async (chatId) => {
        try {
            await fetch(`${BACKEND_API_HOST}/api/chats/${encodeURIComponent(email)}/${chatId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error deleting chat from backend:', error);
        }
    };

    // Initialize data on component mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoadingChats(true);
            try {
                const { chats: savedChats, messages: savedMessages } = await loadFromBackend();
                
                if (savedChats.length > 0) {
                    setChats(savedChats);
                    setMessages(savedMessages);
                    setActiveChat(savedChats[0].id);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsLoadingChats(false);
            }
        };
        
        loadData();
    }, [email]);

    // Auto-save periodically (every 30 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            if (chats.length > 0) {
                saveToBackend(chats, messages);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [chats, messages, email]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, activeChat]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const createNewChat = async () => {
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

        // Save to backend
        await saveSingleChat(newChat);
    };

    const deleteChat = async (chatId, e) => {
        e.stopPropagation();
        
        // Delete from backend
        await deleteChatFromBackend(chatId);
        
        // Update local state
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
            }
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

        // Save user message to backend
        await addMessageToBackend(activeChat, userMessage);

        // Update chat title if it's the first message
        const currentMessages = messages[activeChat] || [];
        if (currentMessages.length === 0) {
            updateChatTitle(activeChat, inputValue);
        }

        const messageText = inputValue;
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch(`${FLOWISE_API_HOST}/api/v1/prediction/${CHATFLOW_ID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: messageText,
                    chatId: currentChat.sessionId,
                    history: currentMessages
                        .filter(msg => !msg.isUser || msg.text !== messageText)
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

            // Save bot message to backend
            await addMessageToBackend(activeChat, botMessage);

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

            // Save error message to backend
            await addMessageToBackend(activeChat, errorMessage);
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

    // Show loading screen while fetching chats
    if (isLoadingChats) {
        return (
            <div className="flex h-screen bg-gray-100 items-center justify-center">
                <div className="text-center">
                    <Loader size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
                    <p className="text-lg text-gray-600">Loading your chats...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white shadow-lg flex flex-col border-r border-gray-200`}>
                {sidebarOpen && (
                    <>
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800">Chat History</h2>
                                    <p className="text-sm text-gray-500">{email}</p>
                                </div>
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
                            {chats.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    <MessageCircle size={32} className="mx-auto mb-2 text-gray-300" />
                                    <p>No chats yet</p>
                                    <p className="text-sm">Create your first chat!</p>
                                </div>
                            ) : (
                                chats.map((chat) => (
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
                                ))
                            )}
                        </div>

                        {/* Sign Out Button */}
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
                            {activeChat ? chats.find(chat => chat.id === activeChat)?.title : 'No Chat Selected'}
                        </h1>
                        {/*activeChat && (
                            <p className="text-xs text-gray-500 mt-1">
                                💾 Auto-saves every 30 seconds
                            </p>
                        )*/}
                    </div>
                    <div className="w-10"></div>
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
                                <p className="text-lg">
                                    {chats.length === 0 ? 'Create your first chat!' : 'Select a chat to start messaging'}
                                </p>
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
                                Press Enter to send, Shift+Enter for new line • Auto-saved to cloud
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlowiseChatWithAPI;