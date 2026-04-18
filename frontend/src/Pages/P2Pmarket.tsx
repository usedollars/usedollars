import React, { useState, useEffect, useCallback } from 'react';
import * as Icons from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:4001';

const P2PMarket = () => {
  const [tradeType, setTradeType] = useState('BUY'); // 'BUY' o 'SELL'
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // 1. CARGA DE ÓRDENES REALES DESDE EL BACKEND
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/transactions/p2p/open-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.ok) {
        // Filtramos para mostrar solo lo que el usuario busca (Si el usuario quiere COMPRAR, busca órdenes de VENTA)
        const filtered = res.data.orders.filter((o: any) => 
          tradeType === 'BUY' ? o.type === 'SELL' : o.type === 'BUY'
        );
        setOrders(filtered);
      }
    } catch (err) {
      console.error("Error al cargar el mercado:", err);
    } finally {
      setLoading(false);
    }
  }, [tradeType, token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 2. FUNCIÓN PARA TOMAR UNA ORDEN (MATCH MANUAL)
  const handleAcceptOrder = async (orderId: number) => {
    if (!window.confirm("¿Deseas tomar esta orden e iniciar el comercio?")) return;
    
    try {
      const res = await axios.post(`${API_URL}/transactions/p2p/accept`, 
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.ok) {
        // Redirigimos a la OrderPage con el ID de la nueva transacción
        navigate(`/order/${res.data.transactionId}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al aceptar la orden");
    }
  };

  return (
    <div className="p-6 bg-[#13151b] border border-[#2b3139] rounded-2xl max-w-6xl mx-auto">
      
      {/* ENCABEZADO Y TABS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase text-white">Mercado P2P</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Compra y vende criptomonedas localmente</p>
        </div>
        
        <div className="flex bg-[#0b0e11] p-1 rounded-xl border border-[#2b3139]">
          <button 
            onClick={() => setTradeType('BUY')}
            className={`px-8 py-2.5 rounded-lg font-black uppercase text-sm transition-all ${tradeType === 'BUY' ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'text-gray-500 hover:text-white'}`}
          >
            Comprar
          </button>
          <button 
            onClick={() => setTradeType('SELL')}
            className={`px-8 py-2.5 rounded-lg font-black uppercase text-sm transition-all ${tradeType === 'SELL' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-gray-500 hover:text-white'}`}
          >
            Vender
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-[#0b0e11] rounded-xl border border-[#2b3139]">
        <div className="flex bg-[#13151b] border border-[#2b3139] rounded-lg px-3 py-2 items-center focus-within:border-blue-500 transition-colors">
          <Icons.Search size={16} className="text-gray-500 mr-2" />
          <input type="number" placeholder="Cantidad" className="bg-transparent border-none outline-none text-white text-sm w-full" />
          <span className="text-gray-500 text-xs font-bold">DOP</span>
        </div>
        
        <select className="bg-[#13151b] border border-[#2b3139] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500">
          <option value="DOP">DOP - Peso Dominicano</option>
          <option value="USD">USD - Dólar Estadounidense</option>
        </select>

        <select className="bg-[#13151b] border border-[#2b3139] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500">
          <option value="ALL">Todos los métodos</option>
          <option value="BANRESERVAS">Banreservas</option>
          <option value="BHD">BHD León</option>
          <option value="ZELLE">Zelle</option>
        </select>

        <button onClick={fetchOrders} className="bg-[#1d2026] hover:bg-[#2b3139] text-white rounded-lg px-4 py-2 text-sm font-bold uppercase transition flex items-center justify-center gap-2">
          <Icons.RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Actualizar
        </button>
      </div>

      {/* CABECERA DE LA TABLA */}
      <div className="hidden md:grid grid-cols-5 gap-4 px-4 py-2 text-[10px] text-gray-500 font-black uppercase tracking-wider mb-2">
        <div>Anunciante</div>
        <div>Precio / Tasa</div>
        <div>Disponible / Moneda</div>
        <div>Instrucciones de Pago</div>
        <div className="text-right">Operación</div>
      </div>

      {/* LISTA DE OFERTAS REALES */}
      <div className="space-y-3">
        {orders.length > 0 ? orders.map((offer) => (
          <div key={offer.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-[#0b0e11] border border-[#2b3139] rounded-xl hover:border-gray-600 transition items-center">
            
            {/* Usuario */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold text-sm">{offer.user?.name || "Legionario"}</span>
                {offer.user?.kycTier > 0 && <Icons.BadgeCheck size={16} className="text-blue-500" />}
              </div>
              <span className="text-[11px] text-gray-500">ID: #{offer.id} | Código: {offer.user?.refCode || 'N/A'}</span>
            </div>

            {/* Precio */}
            <div>
              <div className="text-lg font-black text-white">
                {Number(offer.price).toFixed(2)} 
                <span className="text-xs text-gray-500 font-bold ml-1">{offer.currency?.toUpperCase() || 'USDT'}</span>
              </div>
            </div>

            {/* Disponible */}
            <div className="flex flex-col">
              <span className="text-white font-black text-sm">{offer.amount} <span className="text-blue-500">{offer.asset?.toUpperCase()}</span></span>
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Monto Total de Orden</span>
            </div>

            {/* Instrucciones (Métodos) */}
            <div className="text-xs text-gray-400 font-medium truncate">
              {offer.paymentInstructions || 'Transferencia Bancaria'}
            </div>

            {/* Botón de Acción */}
            <div className="flex justify-end">
              <button 
                onClick={() => handleAcceptOrder(offer.id)}
                className={`px-6 py-2.5 rounded-lg font-black uppercase text-[11px] shadow-lg transition-transform hover:scale-105 ${tradeType === 'BUY' ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20'}`}
              >
                {tradeType === 'BUY' ? `Comprar ${offer.asset?.toUpperCase()}` : `Vender ${offer.asset?.toUpperCase()}`}
              </button>
            </div>

          </div>
        )) : (
          <div className="py-20 text-center border border-dashed border-[#2b3139] rounded-2xl">
            <Icons.Inbox size={40} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No hay ofertas disponibles en este momento</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default P2PMarket;