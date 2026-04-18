import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Sidebar } from '../pages/Sidebar';
import OrderChat from '../pages/OrderChat';
import axios from 'axios';

const API_URL = 'http://localhost:4001';

// 1. COMPONENTE TEMPORIZADOR
// Cuenta regresiva de 30 minutos para la sala de espera
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutos en segundos

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-4xl font-black font-mono text-yellow-500 tracking-widest my-2 drop-shadow-lg">
        {formatTime(timeLeft)}
      </div>
      <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-2">
        <div 
          className="h-full bg-yellow-500 transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / (30 * 60)) * 100}%` }}
        />
      </div>
    </div>
  );
};

const OrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;
  const token = localStorage.getItem('token');

  // Fetch Order Details (Polling Function)
  const fetchOrderDetails = useCallback(async () => {
    try {
      const url = `${API_URL}/transactions/order/${id}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.ok) {
        setOrder(res.data.order);
        setTransaction(res.data.transaction);
        setError('');
      } else {
        setError(res.data.message || 'Error al cargar la orden');
      }
    } catch (error: any) {
      console.error('Polling error:', error);
      if (loading) setError(`Conectando...`);
    } finally {
      setLoading(false);
    }
  }, [id, token, loading]);

  // Polling: Consulta cada 3 segundos
  useEffect(() => {
    fetchOrderDetails();
    const interval = setInterval(fetchOrderDetails, 3000); 
    return () => clearInterval(interval);
  }, [fetchOrderDetails]);


  // ================= ACCIONES (API CALLS) =================

  const handleMarkPayment = async () => {
    if (!transaction) return;
    if (!window.confirm("¿Estás seguro de que ya transferiste el dinero?")) return;

    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/transactions/p2p/mark-payment-sent`, 
        { transactionId: transaction.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrderDetails();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al marcar pago');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseFunds = async () => {
    if (!transaction) return;
    if (!window.confirm("ATENCIÓN: ¿Confirmas que recibiste el dinero?")) return;

    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/transactions/p2p/confirm-payment`, 
        { transactionId: transaction.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("¡Transacción completada exitosamente!");
      fetchOrderDetails();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al liberar fondos');
    } finally {
      setActionLoading(false);
    }
  };

  // [NUEVO] Acción para cancelar orden en el mercado (OPEN_MARKET)
  const handleCancelOpenOrder = async () => {
    if (!window.confirm("¿Seguro que deseas cancelar esta oferta y recuperar tus fondos del Escrow?")) return;
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/transactions/p2p/cancel/${id}`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Oferta cancelada exitosamente.");
      navigate('/dashboard'); // Si cancela, lo devolvemos al inicio
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al cancelar oferta');
    } finally {
      setActionLoading(false);
    }
  };

  // [NUEVO] Acción para el vendedor: cancelar si el comprador no paga
  const handleCancelTimeout = async () => {
    if (!transaction) return;
    if (!window.confirm("ATENCIÓN: Solo cancela si han pasado los 15 minutos y el comprador no ha pagado. ¿Deseas proceder?")) return;
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/transactions/p2p/cancel-timeout/${transaction.id}`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Comercio cancelado. Fondos devueltos a tu cuenta.");
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al cancelar la transacción');
    } finally {
      setActionLoading(false);
    }
  };


  // ================= RENDERS DE ESTADO =================

  if (loading) {
    return (
      <div className="h-screen bg-[#0b0e11] flex flex-col items-center justify-center text-white gap-4">
        <div className="animate-spin text-blue-500"><Icons.Loader size={40} /></div>
        <p className="font-black italic uppercase tracking-widest text-xs">Cargando...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="h-screen bg-[#0b0e11] flex flex-col items-center justify-center text-white p-4">
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl max-w-md text-center">
          <Icons.AlertTriangle size={40} className="mx-auto mb-4" />
          <p className="font-bold mb-2">Estado de Conexión</p>
          <p className="text-sm mb-6 whitespace-pre-wrap">{error || 'Orden no disponible'}</p>
          <button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold">
            Volver
          </button>
        </div>
      </div>
    );
  }

  // === ESCENARIO 1: SALA DE ESPERA (CON TEMPORIZADOR) ===
  // [CORRECCIÓN DE ESTADO] Ajustado para que valide OPEN_MARKET (que es el nuevo estado del mercado) o PENDING_MATCH
  if (order.status === 'OPEN_MARKET' || order.status === 'PENDING_MATCH') {
    return (
      <div className="min-h-screen bg-[#0b0e11] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        
        <div className="max-w-md w-full bg-[#13151b] border border-[#2b3139] rounded-3xl p-8 shadow-2xl relative z-10">
          
          {/* Animación de Radar */}
          <div className="flex justify-center mb-8 relative">
             <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-20 animate-ping"></span>
             <div className="relative bg-[#1d2026] p-4 rounded-full border border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                <Icons.Search className="w-10 h-10 text-yellow-500" />
             </div>
          </div>
          
          <h1 className="text-2xl font-black text-center mb-2 italic uppercase">Buscando Comerciante</h1>
          <p className="text-gray-400 text-center mb-8 text-xs font-medium px-4">
            Tu solicitud está en vivo en el mercado P2P. <br/> Esperando que un usuario acepte la oferta.
          </p>

          {/* TEMPORIZADOR INTEGRADO */}
          <div className="bg-[#0b0e11] border border-[#2b3139] rounded-2xl p-6 mb-6">
             <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tiempo Restante</span>
                <Icons.Clock size={14} className="text-yellow-500" />
             </div>
             
             <CountdownTimer />
             
             <div className="mt-4 pt-4 border-t border-[#2b3139] flex justify-between text-xs text-gray-400">
                <span>Tu Orden:</span>
                <span className="font-mono font-bold text-white">#{order.id}</span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
             <div className="bg-[#1d2026] p-3 rounded-xl border border-[#2b3139]">
                <span className="block text-[9px] text-gray-500 font-bold uppercase mb-1">Monto</span>
                <span className="font-mono font-bold text-white text-lg">{order.amount} <span className="text-xs text-gray-500">{order.asset.toUpperCase()}</span></span>
             </div>
             <div className="bg-[#1d2026] p-3 rounded-xl border border-[#2b3139]">
                <span className="block text-[9px] text-gray-500 font-bold uppercase mb-1">Método</span>
                <span className="font-bold text-white text-sm truncate">{order.paymentInstructions || 'Cualquiera'}</span>
             </div>
          </div>

          {/* [NUEVO] Botón de cancelar oferta funcional */}
          <button
            onClick={handleCancelOpenOrder}
            disabled={actionLoading}
            className="w-full text-red-500 hover:text-white hover:bg-red-500/10 border border-transparent hover:border-red-500/20 font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            {actionLoading ? <Icons.Loader className="animate-spin" size={14} /> : <Icons.X size={14} />} 
            Cancelar Oferta y Recuperar Escrow
          </button>
        </div>
      </div>
    );
  }


  // === ESCENARIO 2: TRANSACCIÓN ACTIVA (MATCHED) ===
  
  // Lógica de roles robusta
  let isBuyer = false;
  let isSeller = false;

  if (transaction) {
    if (order.type === 'BUY') {
        isBuyer = transaction.receiver?.id === userId;
        isSeller = transaction.sender?.id === userId;
    } else {
        isBuyer = transaction.receiver?.id === userId;
        isSeller = transaction.sender?.id === userId;
    }
    // Fallback
    if (!isBuyer && !isSeller) {
       isBuyer = transaction.receiver?.id === userId;
       isSeller = transaction.sender?.id === userId;
    }
  } else {
    // Fallback visual por si transaction tarda en llegar por socket/poll
    const isCreator = order.user?.id === userId;
    isBuyer = isCreator ? order.type === 'BUY' : order.type === 'SELL';
    isSeller = isCreator ? order.type === 'SELL' : order.type === 'BUY';
  }

  const getStatusDisplay = () => {
    switch (order.status) {
      case 'WAITING_PAYMENT':
        return { text: '⏳ Esperando Pago', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' };
      case 'payment_sent':
        return { text: '🔵 Validando Pago', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' };
      case 'completed':
        return { text: '🟢 Finalizada', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' };
      case 'disputed':
        return { text: '🔴 En disputa', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' };
      case 'CANCELLED':
        return { text: '❌ Cancelada', color: 'text-gray-500', bg: 'bg-gray-500/10 border-gray-500/20' };
      default:
        return { text: order.status, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="flex h-screen bg-[#0b0e11] text-white overflow-hidden">
      <aside className="hidden md:flex w-64 bg-[#0b0e11] border-r border-[#2b3139] flex-col h-full shrink-0 overflow-y-auto">
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col relative w-full min-w-0 bg-[#0b0e11]">
        {/* Header */}
        <header className="h-16 border-b border-[#2b3139] flex items-center justify-between px-6 shrink-0 bg-[#0b0e11] z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition p-2 hover:bg-[#1d2026] rounded-lg">
              <Icons.ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black uppercase italic leading-none">Orden #{id}</h1>
              <p className="text-[10px] text-gray-500 font-bold mt-1">SISTEMA ESCROW ACTIVO</p>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${status.bg} ${status.color}`}>
            {status.text}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col lg:flex-row gap-6">
          
          {/* Columna Izquierda: Detalles */}
          <div className="flex-1 space-y-6">
            
            {/* Tarjeta Principal */}
            <div className="bg-[#13151b] border border-[#2b3139] p-6 rounded-2xl relative overflow-hidden">
              <div className="grid grid-cols-2 gap-8 relative z-10">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Monto Acordado</p>
                  <p className="text-3xl font-black text-white">
                    {order.amount} <span className="text-sm text-gray-400">{order.asset?.toUpperCase()}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Tu Rol</p>
                  <p className={`text-xl font-black italic uppercase ${isBuyer ? 'text-blue-500' : 'text-green-500'}`}>
                    {isBuyer ? 'Comprador' : 'Vendedor'}
                  </p>
                </div>
              </div>
            </div>

            {/* Instrucciones Dinámicas */}
            <div className="bg-[#13151b] border border-blue-500/30 p-6 rounded-2xl shadow-lg shadow-blue-500/5">
              <div className="flex items-center gap-2 mb-4">
                <Icons.Info size={16} className="text-blue-500" />
                <h2 className="text-gray-200 text-[10px] font-black uppercase tracking-widest">Pasos a seguir</h2>
              </div>
              <div className="bg-[#0b0e11] p-4 rounded-xl border border-[#2b3139] min-h-[60px] flex items-center">
                <p className="text-sm text-gray-300 font-medium">
                  {order.status === 'CANCELLED' 
                    ? 'Esta transacción ha sido cancelada. Los fondos han sido liberados del Escrow.' 
                    : isBuyer 
                    ? `Por favor transfiere el monto exacto a la cuenta: ${order.paymentInstructions || 'Acordar en chat'}. Luego adjunta el comprobante en el chat y marca como pagado.`
                    : `Espera a recibir la notificación de tu banco. NO liberes los fondos hasta ver el dinero reflejado en tu cuenta real.`
                  }
                </p>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="grid grid-cols-1 gap-3">
              
              {/* COMPRADOR: Botón Pagar */}
              {isBuyer && order.status === 'WAITING_PAYMENT' && (
                <button
                  onClick={handleMarkPayment}
                  disabled={actionLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? <Icons.Loader className="animate-spin" /> : <Icons.CheckCircle size={18} />}
                  Ya realicé la transferencia
                </button>
              )}
              {isBuyer && order.status === 'payment_sent' && (
                 <div className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-500 py-4 rounded-xl font-bold text-center text-sm flex items-center justify-center gap-2">
                    <Icons.Clock size={18} className="animate-pulse" /> Esperando que el vendedor confirme...
                 </div>
              )}

              {/* VENDEDOR: Botón Liberar y Cancelar Timeout */}
              {isSeller && order.status === 'payment_sent' && (
                <button
                  onClick={handleReleaseFunds}
                  disabled={actionLoading}
                  className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? <Icons.Loader className="animate-spin" /> : <Icons.Unlock size={18} />}
                  He recibido el dinero - Liberar
                </button>
              )}
              {isSeller && order.status === 'WAITING_PAYMENT' && (
                 <>
                   <div className="w-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 py-4 rounded-xl font-bold text-center text-sm flex items-center justify-center gap-2">
                      <Icons.Clock size={18} /> Esperando pago del comprador...
                   </div>
                   {/* [NUEVO] Botón de cancelar por falta de pago */}
                   <button
                     onClick={handleCancelTimeout}
                     disabled={actionLoading}
                     className="w-full mt-2 text-gray-500 hover:text-red-500 font-bold py-2 text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                   >
                     <Icons.XCircle size={12} /> Cancelar Orden (Comprador no responde)
                   </button>
                 </>
              )}

              {/* Finalizado */}
              {order.status === 'completed' && (
                 <div className="w-full bg-green-500/20 border border-green-500/30 text-green-400 py-4 rounded-xl font-black uppercase text-center text-sm tracking-widest">
                    🎉 Transacción Finalizada Exitosamente
                 </div>
              )}

              {/* Disputa */}
              {order.status !== 'completed' && order.status !== 'CANCELLED' && order.status !== 'cancelled' && (
                <button
                  onClick={() => navigate(`/dispute/${order.id}`)}
                  className="w-full bg-[#1d2026] hover:bg-red-500/10 text-gray-500 hover:text-red-500 py-3 rounded-xl font-bold text-[10px] uppercase transition border border-[#2b3139] border-dashed flex items-center justify-center gap-2 mt-4"
                >
                  <Icons.AlertTriangle size={14} /> Reportar problema
                </button>
              )}
            </div>
          </div>

          {/* Columna Derecha: Chat */}
          {/* Ocultamos el chat si la orden está en PENDING_MATCH u OPEN_MARKET, ya que no hay con quién hablar aún */}
          {(order.status !== 'PENDING_MATCH' && order.status !== 'OPEN_MARKET') && (
            <div className="w-full lg:w-[450px] flex flex-col min-h-[500px] border border-[#2b3139] rounded-2xl overflow-hidden bg-[#13151b] shadow-2xl">
              {order && <OrderChat orderId={Number(id)} userId={userId} />}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default OrderPage;