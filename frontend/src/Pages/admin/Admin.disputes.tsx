import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// --- INTERFACES ---
interface Dispute {
  id: number;
  reason: string;
  transaction: {
    id: number;
    amount: number;
    asset: string;
  };
  claimant: {
    email: string;
  };
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  isAdmin: boolean;
  created_at: string;
  sender?: { email: string }; // Opcional, si el backend lo devuelve
}

const AdminDisputes: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DEL CHAT DE JUEZ ---
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [adminInput, setAdminInput] = useState("");
  
  // Referencia al socket para no reconectar en cada render
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Auto-scroll

  // 1. Cargar Disputas al inicio
  const fetchDisputes = async () => {
    try {
      const token = localStorage.getItem('token');
      // Ajusta la URL si es necesario
      const response = await axios.get('http://localhost:4001/admin/disputes/open', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDisputes(response.data);
    } catch (error) {
      console.error("Error al cargar las disputas", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
    
    // Conexión inicial al Socket
    socketRef.current = io("http://localhost:4001");

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // 2. Escuchar mensajes entrantes (Solo si hay chat abierto)
  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on("receive_message", (msg: Message) => {
      // Solo agregamos si el mensaje pertenece a la orden que estamos viendo
      // (O validamos por ID si quieres ser estricto)
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    return () => {
      socketRef.current?.off("receive_message");
    };
  }, [selectedOrderId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- ACCIONES ---

  // A. Ver Evidencia (Abrir Chat)
  const openChat = async (orderId: number) => {
    setSelectedOrderId(orderId);
    setMessages([]); // Limpiar chat anterior
    
    // Unirse a la sala de Socket
    socketRef.current?.emit("join_room", orderId.toString());

    // Cargar historial de la DB
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:4001/admin/disputes/${orderId}/chat`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error cargando chat historial", error);
    }
  };

  // B. Enviar mensaje como Juez
  const sendAdminMessage = () => {
    if (!adminInput.trim() || !selectedOrderId) return;

    // Emitir al servidor con flag isAdmin: true
    socketRef.current?.emit("send_message", {
      orderId: selectedOrderId,
      senderId: 0, // ID reservado para Admin
      content: adminInput,
      isAdmin: true 
    });
    
    // (Opcional) Optimistic update: agregarlo localmente antes de que vuelva del server
    // Pero como tenemos el socket.on, mejor esperar la confirmación del servidor
    setAdminInput("");
  };

  // C. Dictar Sentencia (Tu lógica original)
  const handleResolve = async (disputeId: number, winner: 'CLAIMANT' | 'COUNTERPARTY') => {
    const adminNotes = prompt("Escriba la sentencia legal para cerrar este caso:");
    if (!adminNotes) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:4001/admin/disputes/resolve', {
        disputeId,
        winner,
        adminNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert("Sentencia ejecutada con éxito.");
      fetchDisputes(); 
      setSelectedOrderId(null); // Cerrar chat al resolver
    } catch (error) {
      alert("Error al procesar la resolución.");
    }
  };

  if (loading) return <div className="p-10">Cargando tribunal de justicia...</div>;

  return (
    <div className="p-6 flex gap-6 h-screen bg-gray-50">
      
      {/* IZQUIERDA: TABLA DE DISPUTAS */}
      <div className={`transition-all duration-300 ${selectedOrderId ? 'w-1/2' : 'w-full'} overflow-auto`}>
        <h1 className="text-2xl font-bold mb-4 text-gray-800">⚖️ Panel de Disputas (Admin)</h1>
        
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caso</th>
                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {disputes.map((d) => (
                <tr key={d.id} className={`hover:bg-blue-50 transition ${selectedOrderId === d.transaction.id ? 'bg-blue-100' : ''}`}>
                  <td className="p-3">
                    <div className="font-bold text-gray-900">Tx #{d.transaction.id}</div>
                    <div className="text-sm text-gray-500">{d.claimant.email}</div>
                    <div className="text-xs text-red-500 italic mt-1">"{d.reason}"</div>
                  </td>
                  <td className="p-3 font-mono text-green-600 font-bold">
                    {d.transaction.amount} {d.transaction.asset}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-2 items-center">
                      <button 
                        onClick={() => openChat(d.transaction.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded shadow-sm w-full"
                      >
                        👁️ Evidencia
                      </button>
                      
                      <div className="flex gap-1 w-full">
                        <button 
                          onClick={() => handleResolve(d.id, 'CLAIMANT')}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-[10px] py-1 rounded shadow-sm"
                        >
                          ✔ Reclamante
                        </button>
                        <button 
                          onClick={() => handleResolve(d.id, 'COUNTERPARTY')}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-[10px] py-1 rounded shadow-sm"
                        >
                          ✔ Contraparte
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {disputes.length === 0 && <div className="p-10 text-center text-gray-500">No hay disputas pendientes. ¡Buen trabajo!</div>}
        </div>
      </div>

      {/* DERECHA: CHAT DE EVIDENCIA (Solo se ve si seleccionas una orden) */}
      {selectedOrderId && (
        <div className="w-1/2 flex flex-col bg-white border-l-4 border-blue-500 shadow-2xl rounded-lg overflow-hidden animate-slide-in">
          {/* Header del Chat */}
          <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Sala de Evidencia</h3>
              <p className="text-xs text-gray-400">Orden #{selectedOrderId} - Modo Supervisión</p>
            </div>
            <button onClick={() => setSelectedOrderId(null)} className="text-gray-400 hover:text-white font-bold text-xl">×</button>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-100 space-y-3">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`flex flex-col max-w-[80%] ${
                  m.isAdmin 
                    ? 'ml-auto items-end'  // Admin a la derecha
                    : 'mr-auto items-start' // Usuarios a la izquierda
                }`}
              >
                <div 
                  className={`p-3 rounded-xl text-sm shadow-sm ${
                    m.isAdmin 
                      ? 'bg-amber-100 border border-amber-300 text-amber-900' // Estilo JUEZ
                      : 'bg-white border border-gray-200 text-gray-800' // Estilo Usuario
                  }`}
                >
                  <div className="font-bold text-xs mb-1 opacity-70">
                    {m.isAdmin ? "⚖️ TU (ADMIN)" : `Usuario ${m.senderId}`}
                  </div>
                  {m.content}
                </div>
                <span className="text-[10px] text-gray-400 mt-1">
                  {new Date(m.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de Admin */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input 
                type="text"
                value={adminInput}
                onChange={(e) => setAdminInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendAdminMessage()}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Escribe aquí para intervenir como Juez..." 
              />
              <button 
                onClick={sendAdminMessage} 
                className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-bold transition"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisputes;