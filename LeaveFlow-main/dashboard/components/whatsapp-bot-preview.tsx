"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useState } from "react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

const DEMO_MESSAGES: Message[] = [
  {
    id: "1",
    sender: "user",
    text: "Hi, I want to take leave next week",
    timestamp: new Date(Date.now() - 5000),
  },
  {
    id: "2",
    sender: "bot",
    text: "Hi! I'd be happy to help. Which dates are you planning to take leave? Please provide the start and end date.",
    timestamp: new Date(Date.now() - 4500),
  },
  {
    id: "3",
    sender: "user",
    text: "Monday to Friday next week, May 13-17",
    timestamp: new Date(Date.now() - 4000),
  },
  {
    id: "4",
    sender: "bot",
    text: "Perfect! That's 5 days. What type of leave? (Casual, Sick, Special, Unpaid)",
    timestamp: new Date(Date.now() - 3500),
  },
  {
    id: "5",
    sender: "user",
    text: "Casual leave. I have some pending work to complete",
    timestamp: new Date(Date.now() - 3000),
  },
  {
    id: "6",
    sender: "bot",
    text: '✓ Submitted! Your leave request for May 13-17 (Casual, 5 days) has been sent to your manager. You\'ll receive an update once it\'s reviewed.',
    timestamp: new Date(),
  },
];

export function WhatsAppBotPreview() {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: String(messages.length + 1),
      sender: "user",
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: String(messages.length + 2),
        sender: "bot",
        text: "Thanks for your message! I'm processing your request. Our system is AI-powered to understand your needs better.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>WhatsApp Bot Demo</CardTitle>
        <CardDescription>
          See how easy it is to manage leaves via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 space-y-4 mb-4 overflow-y-auto max-h-96">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs rounded-lg px-4 py-2 text-sm ${
                  message.sender === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
