import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Loader2, X } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateDistance } from '../utils/distance';
import citiesData from '../data/cities.json';

// Initialize Gemini API (User must provide VITE_GEMINI_API_KEY in .env)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export default function AIChatbot({ contextData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hello! I'm Charge AI. I can calculate trip costs (e.g., 'Mumbai to Pune cost?'), find nearby chargers, and monitor your range. How can I help with your journey today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const normalizeInput = (text) => {
    let lower = text.toLowerCase().trim();
    lower = lower.replace(/mumabi/g, 'mumbai').replace(/punne/g, 'pune').replace(/banglore/g, 'bangalore').replace(/hydrabad/g, 'hyderabad');
    return lower;
  };

  const matchLocalIntent = (msg) => {
    const cleanMsg = normalizeInput(msg);
    
    if (contextData?.isEmergency) {
      return "⚠️ EMERGENCY: Battery is critical (<10%). Standard routing is disabled. Please use the red 'Emergency Assistant' panel for help.";
    }

    // 2. Journey Detection (X to Y)
    const journeyMatch = cleanMsg.match(/(?:from\s+)?([a-z\s]+)\s+to\s+([a-z\s]+)/i);
    if (journeyMatch) {
      const startKey = Object.keys(citiesData).find(c => c.toLowerCase() === journeyMatch[1].trim());
      const endKey = Object.keys(citiesData).find(c => c.toLowerCase() === journeyMatch[2].trim());

      if (startKey && endKey) {
        const dist = calculateDistance(citiesData[startKey].lat, citiesData[startKey].lng, citiesData[endKey].lat, citiesData[endKey].lng);
        return `Distance from ${startKey} to ${endKey} is approx ${Math.round(dist)} km. Estimated EV charging cost is ₹${Math.round(dist * 1.5)}.`;
      }
    }

    if (cleanMsg.includes("charge") || cleanMsg.includes("charging")) {
      return "Standard charging takes approx 1 hour at 50kW for a 50 kWh battery (20% to 80% SoC).";
    }

    if (cleanMsg.includes("nearest") || cleanMsg.includes("find") || cleanMsg.includes("where")) {
      const top = contextData?.stations?.[0];
      return top ? `${top.name} is the closest hub at ${top.distance.toFixed(1)} km. Status: ${top.status.toLowerCase()}.` : "No stations detected nearby.";
    }

    if (cleanMsg.includes("battery") || cleanMsg.includes("range")) {
      return `Status: ${contextData?.battery}% battery | ~${contextData?.range} km range remaining.`;
    }

    if (cleanMsg.includes("what is ev") || cleanMsg.includes("benefit")) {
      return "EVs are 75% cheaper per km than petrol and offer zero emissions with instant performance.";
    }

    return null;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // STEP 1: Check Local Logic (Offline First)
    const localResponse = matchLocalIntent(userMessage);
    if (localResponse) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: localResponse }]);
        setIsLoading(false);
      }, 500);
      return;
    }

    // STEP 2: Secondary Fallback to Gemini AI
    try {
      if (genAI) {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const systemPrompt = `You are an EV Charging Assistant. User context: ${JSON.stringify(contextData)}. Answer technical queries concisely in 1-2 lines.`;

        const result = await model.generateContent(`${systemPrompt}\n\nQuery: "${userMessage}"`);
        const response = result.response.text();
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      } else {
        throw new Error("No API Initialized");
      }
    } catch (error) {
      console.warn("AI Fallback Error:", error.message);
      // STEP 3: Smart Knowledge Fallback (No error messages)
      const fallbackTips = [
        "Try: 'Mumbai to Goa' for a distance and cost estimate.",
        "Maintain battery between 20-80% for optimal health.",
        "Check your current range status by asking 'What is my battery range?'",
        "Enable GPS for real-time station availability."
      ];
      const randomTip = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
      setMessages(prev => [...prev, { role: 'assistant', content: `I'm focusing on your logistics. Tip: ${randomTip}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all z-50 group"
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-surface border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/80 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Charge AI</h3>
              <p className="text-xs text-slate-400">Powered by Gemini</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-blue-400" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-sm' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-sm text-slate-400">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about range, stations..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors flex items-center justify-center min-w-[40px]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
