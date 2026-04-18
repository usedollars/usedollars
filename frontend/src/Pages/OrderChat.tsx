import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Send, Clock, ShieldCheck, MessageSquare } from 'lucide-react';
import axios from 'axios';

// Asegúrate de que esta URL coincida con tu backend
const API_URL = 'http://localhost:4001';

// Configuración del socket fuera del componente
const socket = io(API_URL, {
  autoConnect: false,
  transports: ['websocket']
});

interface Message {
  id?: number;
  content: string;
  senderId: number;
  created_at?: string;
}

interface OrderChatProps {
  orderId: number;
  userId: number;
}

const OrderChat: React.FC<OrderChatProps> = ({ orderId, userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Cargar historial
  const fetchChatHistory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Endpoint que definimos en transaction.routes.ts
      const res = await axios.get(`${API_URL}/transactions/order/${orderId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        setMessages(res.data);
      }
    } catch (error) {
      console.error("Error cargando chat:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    // Conexión Socket
    socket.connect();
    socket.emit('join_room', orderId.toString()); // Usamos orderId como room

    fetchChatHistory();

    socket.on('receive_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.emit('leave_room', orderId.toString());
      socket.off('receive_message');
      socket.disconnect();
    };
  }, [orderId]);

  // Scroll automático
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      orderId, // Room ID
      senderId: userId,
      content: newMessage.trim()
    };

    socket.emit('send_message', messageData);
    
    // Optimistic UI update (opcional, si el socket tarda)
    // setMessages(prev => [...prev, { ...messageData, created_at: new Date().toISOString() }]); 
    
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-[#13151b] border-l border-[#2b3139]">
      {/* Header Seguro */}
      <div className="p-4 border-b border-[#2b3139] bg-[#1d2026] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase italic text-white tracking-widest leading-none">Canal Seguro</h3>
            <p className="text-[9px] text-gray-500 font-bold mt-1">ENCRIPTADO E2E</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-green-500 uppercase">Live</span>
        </div>
      </div>

      {/* Lista de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-[#0b0e11]/30">
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-40">
            <div className="animate-spin text-blue-500"><Clock size={20} /></div>
            <p className="text-[9px] font-black uppercase tracking-tighter">Cargando...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 px-8">
            <div className="inline-block p-4 bg-[#1d2026] rounded-full mb-4 text-gray-600">
              <MessageSquare size={24} />
            </div>
            <p className="text-[10px] text-gray-500 font-black uppercase leading-relaxed">
              Inicio del chat<br />
              <span className="text-gray-600">Acuerden los detalles del pago aquí.</span>
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === userId;
            return (
              <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20' 
                      : 'bg-[#2b3139] text-gray-200 rounded-tl-none border border-[#363c46]'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[8px] mt-1.5 font-black text-gray-600 uppercase tracking-tighter">
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-[#1d2026] border-t border-[#2b3139] flex gap-2 items-center">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-[#0b0e11] border border-[#2b3139] rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-all font-bold"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-blue-600 p-3 rounded-xl text-white hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default OrderChat;