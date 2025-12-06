import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chat history
    const loadChatHistory = async () => {
      if (!user) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/chat/history/${user.userId}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages.map((m: any) => ({
              id: m.id,
              text: m.text,
              sender: m.sender,
              timestamp: new Date(m.timestamp),
            })));
            return;
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }

      // Welcome message if no history
      setMessages([
        {
          id: '1',
          text: `Hi ${user.name}! 👋 I'm Vibe, your AI event assistant.\n\nI can help you:\n• Create events: "create dinner Friday 7pm with Alex"\n• RSVP to invites: "yes" or "no"\n• Check events: "what events do I have?"\n• Cancel events: "cancel the dinner event"\n\nWhat would you like to do?`,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    };

    loadChatHistory();
  }, [user]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: messageText,
            userId: user.userId,
            phoneNumber: user.phoneNumber,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || data.message || "I received your message!",
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error.message || "Sorry, I encountered an error. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-4 pt-24">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Chat with Vibe AI</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Your conversational event planning assistant powered by Claude AI
          </p>
        </div>

        <Card className="h-[600px] flex flex-col shadow-xl">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'bot'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {message.sender === 'bot' ? (
                    <Bot className="w-6 h-6" />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div
                  className={`max-w-[70%] rounded-2xl p-4 ${
                    message.sender === 'bot'
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
                  <span
                    className={`text-xs mt-2 block ${
                      message.sender === 'bot' ? 'text-gray-500' : 'text-blue-100'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Bot className="w-6 h-6 animate-pulse" />
                </div>
                <div className="bg-gray-100 rounded-2xl p-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4 bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message... (e.g., 'create dinner Friday 7pm')"
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Powered by Claude AI • {user?.name}
            </p>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("create dinner Friday 7pm")}
            disabled={isLoading}
          >
            Quick: Create Dinner
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("what events do I have?")}
            disabled={isLoading}
          >
            Quick: My Events
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("yes")}
            disabled={isLoading}
          >
            Quick: Accept Invite
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;

