import { Sidebar } from './Sidebar';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';

const API_URL = 'http://localhost:4001';

const Dashboard = () => {
  const navigate = useNavigate();
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  
  // --- ESTADOS DE UI Y SEGURIDAD ---
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [modalType, setModalType] = useState<'ENVIAR' | 'COMPRAR' | 'VENDER' | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false); 
  
  // [NUEVO] Rate Limiting local para botones críticos
  const [isRateLimited, setIsRateLimited] = useState(false);

  // --- ESTADOS DE DATOS ---
  const [balances, setBalances] = useState({ usdt: '0.00', btc: '0.0000', eth: '0.0000' });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const refCode = user.refCode || '';

  // --- ESTADOS DEL FORMULARIO DE ACCIÓN ---
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'usdt',
    address: '', 
    paymentMethod: 'Banco de Prueba (Test)' 
  });

  // 1. Lógica de pantalla
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleScreenChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setSidebarOpen(false);
    };
    handleScreenChange(mediaQuery);
    mediaQuery.addEventListener("change", handleScreenChange);
    return () => mediaQuery.removeEventListener("change", handleScreenChange);
  }, []);

  // 2. CARGA DE DATOS
  const fetchWalletData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // WALLETS
    try {
      const response = await fetch(`${API_URL}/wallets/me`, { headers });
      if (response.status === 401) { handleLogout(); return; }
      if (response.ok) {
        const data = await response.json();
        const walletsArray = data.wallets || data; 
        if (Array.isArray(walletsArray)) {
          const newBalances = { usdt: '0.00', btc: '0.0000', eth: '0.0000' };
          walletsArray.forEach((w: any) => {
            const val = Number(w.balance);
            if (w.currency?.toLowerCase() === 'usdt') newBalances.usdt = val.toFixed(2);
            if (w.currency?.toLowerCase() === 'btc') newBalances.btc = val.toFixed(8);
            if (w.currency?.toLowerCase() === 'eth') newBalances.eth = val.toFixed(6);
          });
          setBalances(newBalances);
        }
      }
    } catch (error) { console.error("Error cargando wallets:", error); }

    // TRANSACCIONES
    try {
      const txRes = await fetch(`${API_URL}/transactions/me`, { headers });
      if (txRes.ok) {
        const txData = await txRes.json();
        if (Array.isArray(txData)) setTransactions(txData);
      }
    } catch (error) { console.error("Error en transacciones:", error); setTransactions([]); }
  };

  useEffect(() => { 
    fetchWalletData(); 
  }, []); 

  // 3. WIDGET TRADINGVIEW
  useEffect(() => {
    if (widgetContainerRef.current && widgetContainerRef.current.querySelector('script')) return;
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        { "proName": "BINANCE:BTCUSDT", "title": "Bitcoin" },
        { "proName": "BINANCE:ETHUSDT", "title": "Ethereum" },
        { "proName": "FX_IDC:USDDOP", "title": "USD/DOP" }
      ],
      "showSymbolLogo": true, "colorTheme": "dark", "isTransparent": false, "displayMode": "adaptive", "locale": "es"
    });
    if (widgetContainerRef.current) widgetContainerRef.current.appendChild(script);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/'); 
  };

  const handleCopyCode = () => {
    if (refCode) {
      navigator.clipboard.writeText(refCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenModal = async (type: 'ENVIAR' | 'COMPRAR' | 'VENDER') => {
    setModalType(type);
    setFormData({ amount: '', currency: 'usdt', address: '', paymentMethod: 'Banco de Prueba (Test)' }); 

    if (type === 'VENDER') {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${API_URL}/users/payment-methods`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPaymentMethods(data);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, address: data[0].accountDetails }));
          }
        }
      } catch (error) { console.error("Error cargando cuentas:", error); }
    }
  };

  // --- LÓGICA DE ENVÍO CON ANTI-SPAM ---
  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // [NUEVO] Validación Anti-Spam
    if (isRateLimited) {
      alert("Espera un momento antes de intentar otra operación.");
      return;
    }

    setLoading(true);
    setIsRateLimited(true); // Bloquear botón

    const token = localStorage.getItem('token');
    let endpoint = '';
    let body = {};

    if (modalType === 'ENVIAR') {
      endpoint = `${API_URL}/transactions/internal-send`;
      body = { amount: parseFloat(formData.amount), currency: formData.currency, toUserEmail: formData.address };
    } 
    else if (modalType === 'COMPRAR') {
      endpoint = `${API_URL}/transactions/p2p/initiate`;
      body = { 
        type: 'BUY',
        amount: parseFloat(formData.amount), 
        asset: formData.currency, 
        fiatCurrency: 'usd', 
        price: 1.00,
        paymentMethod: formData.paymentMethod 
      };
    } 
    else if (modalType === 'VENDER') {
      endpoint = `${API_URL}/transactions/p2p/initiate`;
      body = { 
        type: 'SELL',
        amount: parseFloat(formData.amount), 
        asset: formData.currency, 
        fiatCurrency: 'usd',
        price: 1.00,
        paymentInstructions: formData.address 
      };
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (res.ok) {
        setModalType(null);
        if (modalType === 'ENVIAR') {
          alert('¡Envío Interno Exitoso!');
          fetchWalletData();
        } else {
          const targetId = data.orderId || data.id || data.transactionId;
          navigate(`/order/${targetId}`); 
        }
      } else {
        alert(data.message || data.error || 'Error en la operación');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor P2P');
    } finally {
      setLoading(false);
      // [NUEVO] Liberar el bloqueo después de 2 segundos para evitar spam
      setTimeout(() => setIsRateLimited(false), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      'completed': 'bg-green-500/10 text-green-500 border-green-500/20',
      'payment_sent': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'pending': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'pending_payment': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'disputed': 'bg-red-500/10 text-red-500 border-red-500/20',
      'cancelled': 'bg-red-500/10 text-red-500 border-red-500/20',
      'MATCHED': 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };
    
    const labels: any = {
      'completed': 'Completado',
      'payment_sent': 'Pago Enviado',
      'pending': 'Pendiente',
      'pending_payment': 'Esp. Pago',
      'disputed': 'En Disputa',
      'cancelled': 'Cancelado',
      'MATCHED': 'Emparejado'
    };

    const style = styles[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    const label = labels[status] || status;

    return (
      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${style}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-[#0b0e11] text-white font-['Inter'] overflow-hidden selection:bg-blue-500/30">
      
      <aside className="hidden md:flex w-64 bg-[#0b0e11] border-r border-[#2b3139] flex-col h-full shrink-0 z-20 overflow-y-auto">
         <Sidebar />
      </aside>

      {/* Sidebar móvil */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[9999] flex md:hidden">
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSidebarOpen(false)}></div>
            <div className="relative w-[80%] max-w-sm bg-[#0b0e11] h-full border-r border-[#2b3139] flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
                <div className="flex justify-between items-center p-5 border-b border-[#2b3139] bg-[#13151b] shrink-0">
                    <span className="font-black text-white italic">USEDOLLARS</span>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 border border-[#2b3139] rounded-lg text-gray-400">
                        <Icons.X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto"><Sidebar /></div>
            </div>
        </div>
      )}

      <div className="flex-1 flex flex-col relative w-full min-w-0 bg-[#0b0e11]">
        
        <header className="h-16 border-b border-[#2b3139] bg-[#0b0e11] flex items-center justify-between px-4 md:px-6 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg">
                <Icons.Menu size={24} />
            </button>
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-blue-500 hidden sm:block">USEDOLLARS</h1>
          </div>
          <button onClick={handleLogout} className="text-xs font-bold text-red-500 border border-red-500/20 px-3 py-1.5 rounded hover:bg-red-500/10 uppercase">
            Salir
          </button>
        </header>

        <div className="bg-[#13151b] border-b border-[#2b3139] z-10 shrink-0 h-[46px] overflow-hidden">
          <div className="tradingview-widget-container" ref={widgetContainerRef}>
            <div className="tradingview-widget-container__widget"></div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0b0e11]">
          <div className="max-w-7xl mx-auto pb-20 mt-4">
            
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-4xl">
                <button onClick={() => handleOpenModal('ENVIAR')} className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all group">
                    <Icons.Send size={20} /> <span>Enviar</span>
                </button>
                <button onClick={() => handleOpenModal('COMPRAR')} className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-[#1d2026] hover:bg-[#2a2e36] border border-[#2b3139] text-white font-bold py-4 rounded-xl active:scale-95 transition-all group">
                    <Icons.PlusCircle size={20} className="text-green-500 group-hover:text-green-400"/> <span>Comprar</span>
                </button>
                <button onClick={() => handleOpenModal('VENDER')} className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-[#1d2026] hover:bg-[#2a2e36] border border-[#2b3139] text-white font-bold py-4 rounded-xl active:scale-95 transition-all group">
                    <Icons.MinusCircle size={20} className="text-red-500 group-hover:text-red-400"/> <span>Vender</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="md:col-span-2 bg-[#13151b] border border-[#2b3139] p-6 rounded-2xl relative overflow-hidden group">
                <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1 text-blue-400">Balance USDT (Escrow Protegido)</p>
                <div className="flex items-baseline gap-1"><span className="text-4xl md:text-5xl font-black text-white">{balances.usdt}</span><span className="text-xs font-bold text-gray-600">USDT</span></div>
              </div>
              <div className="bg-[#13151b] border border-[#2b3139] p-6 rounded-2xl relative">
                <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Balance BTC</p>
                <div className="flex items-baseline gap-1"><span className="text-3xl font-black text-yellow-500">{balances.btc}</span></div>
              </div>
              <div className="bg-[#13151b] border border-[#2b3139] p-6 rounded-2xl relative">
                <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Balance ETH</p>
                <div className="flex items-baseline gap-1"><span className="text-3xl font-black text-purple-400">{balances.eth}</span></div>
              </div>
            </div>

            {/* BANNER DE REFERIDOS */}
            {refCode && (
              <div className="mb-8 bg-gradient-to-r from-[#13151b] to-[#1a1d24] border border-[#2b3139] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl"></div>
                
                <div className="flex-1 relative z-10 text-center md:text-left">
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight mb-2 flex items-center justify-center md:justify-start gap-2">
                    <Icons.Rocket className="text-blue-500" size={24} />
                    Invita y Gana
                  </h3>
                  <p className="text-gray-400 text-sm max-w-xl mx-auto md:mx-0">
                    Construye tu red. Comparte este código con tus amigos y recibe el <span className="text-green-400 font-bold">25% de comisión</span> automática cada vez que ellos realicen un retiro externo.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 w-full md:w-auto">
                  <div className="bg-[#0b0e11] border border-[#2b3139] px-6 py-3 rounded-xl flex items-center justify-center w-full sm:w-auto">
                    <span className="text-xl font-mono font-black text-blue-400 tracking-widest">{refCode}</span>
                  </div>
                  <button 
                    onClick={handleCopyCode}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20 uppercase text-xs tracking-wider"
                  >
                    {copied ? (
                      <><Icons.Check size={16} /> ¡Copiado!</>
                    ) : (
                      <><Icons.Copy size={16} /> Copiar Código</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* HISTORIAL */}
            <div>
                 <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Icons.History size={20} className="text-gray-500"/> Actividad Reciente</h3>
                 {transactions.length > 0 ? (
                    <div className="bg-[#13151b] border border-[#2b3139] rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-[#1d2026] text-xs uppercase font-bold text-gray-300">
                                <tr>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Monto</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2b3139]">
                                {transactions.map((tx, i) => (
                                    <tr key={i} className="hover:bg-[#1d2026]/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white uppercase text-xs tracking-wider">
                                          {tx.type === 'p2p_trade' ? 'Comercio P2P' : 
                                           tx.type === 'internal_transfer' ? 'Envío Interno' : 
                                           tx.type === 'referral_bonus' ? 'Bono Referido' : 
                                           tx.type === 'deposit' ? 'Depósito' : 
                                           tx.type === 'withdrawal_external' ? 'Retiro' : tx.type}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-white font-bold">
                                          {Number(tx.amount).toFixed(tx.asset === 'btc' ? 6 : 2)}{' '}
                                          <span className="text-blue-400 ml-1">
                                            {(tx.asset || tx.currency || 'USDT').toUpperCase()}
                                          </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(tx.status)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">
                                          {new Date(tx.created_at).toLocaleString('es-ES', {
                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                          })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 ) : (
                    <div className="border border-dashed border-[#2b3139] bg-[#13151b]/30 rounded-2xl py-16 text-center">
                        <h3 className="text-lg font-bold text-gray-300">Sin Movimientos</h3>
                    </div>
                 )}
            </div>
          </div>
        </main>

        {/* MODAL DE OPERACIONES */}
        {modalType && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#13151b] border border-[#2b3139] w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
                    <button onClick={() => setModalType(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Icons.X size={20}/></button>
                    
                    <h2 className="text-xl font-black text-white italic uppercase mb-6 flex items-center gap-2">
                        {modalType === 'ENVIAR' && <Icons.Send className="text-blue-500"/>}
                        {modalType === 'COMPRAR' && <Icons.PlusCircle className="text-green-500"/>}
                        {modalType === 'VENDER' && <Icons.MinusCircle className="text-red-500"/>}
                        {modalType} ACTIVO
                    </h2>

                    <form onSubmit={handleTransactionSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Moneda</label>
                            <select 
                                className="w-full bg-[#0b0e11] border border-[#2b3139] text-white rounded-lg p-3 outline-none focus:border-blue-500 font-bold"
                                value={formData.currency}
                                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                            >
                                <option value="usdt">USDT (Tether)</option>
                                <option value="btc">BTC (Bitcoin)</option>
                                <option value="eth">ETH (Ethereum)</option>
                            </select>
                        </div>

                        {modalType === 'ENVIAR' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email del Destinatario</label>
                                <input 
                                    type="email" 
                                    placeholder="ejemplo@usedollars.com"
                                    className="w-full bg-[#0b0e11] border border-[#2b3139] text-white rounded-lg p-3 outline-none focus:border-blue-500 font-mono"
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    required
                                />
                            </div>
                        )}

                        {modalType === 'VENDER' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Recibir pago en (Cuenta Afín KYC)</label>
                                {paymentMethods.length > 0 ? (
                                    <select 
                                        className="w-full bg-[#0b0e11] border border-[#2b3139] text-white rounded-lg p-3 outline-none focus:border-blue-500 font-bold"
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        required
                                    >
                                        {paymentMethods.map((pm: any) => (
                                            <option key={pm.id} value={pm.accountDetails}>
                                                {pm.bankName} - {pm.accountDetails.substring(0, 15)}...
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-center p-3 border border-dashed border-red-500/50 rounded-lg">
                                        <p className="text-[10px] text-red-500 font-black uppercase mb-2">No tienes cuentas vinculadas</p>
                                        <button 
                                            type="button"
                                            onClick={() => navigate('/settings/payments')}
                                            className="text-[9px] bg-red-500 text-white px-2 py-1 rounded font-bold uppercase"
                                        >
                                            Configurar ahora
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {modalType === 'COMPRAR' && (
                           <div className="space-y-4">
                             <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-xs text-blue-300">
                               ℹ️ Estás creando una oferta de compra. Selecciona cómo deseas pagar.
                             </div>
                             
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Método de Pago</label>
                                <select 
                                    className="w-full bg-[#0b0e11] border border-[#2b3139] text-white rounded-lg p-3 outline-none focus:border-blue-500 font-bold text-sm"
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                                >
                                    <option value="Banco de Prueba (Test)">🧪 Banco de Prueba (Instantáneo)</option>
                                    <option disabled>--- Nacionales ---</option>
                                    <option value="Banco Popular">Banco Popular</option>
                                    <option value="Banreservas">Banreservas</option>
                                    <option value="BHD León">BHD León</option>
                                    <option value="Qik Banco Digital">Qik Banco Digital</option>
                                    <option disabled>--- Internacionales ---</option>
                                    <option value="Zelle">Zelle</option>
                                    <option value="PayPal">PayPal</option>
                                    <option value="Cash App">Cash App</option>
                                    <option value="Wise">Wise</option>
                                </select>
                             </div>
                           </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    step="0.000001"
                                    placeholder="0.00"
                                    className="w-full bg-[#0b0e11] border border-[#2b3139] text-white rounded-lg p-3 pr-16 outline-none focus:border-blue-500 font-mono text-lg font-bold"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    required
                                />
                                <span className="absolute right-4 top-3.5 text-xs font-black text-gray-500 uppercase">{formData.currency}</span>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || isRateLimited || (modalType === 'VENDER' && paymentMethods.length === 0)}
                            className={`w-full py-4 rounded-xl font-bold text-white uppercase tracking-wider transition-all active:scale-95 ${
                                modalType === 'ENVIAR' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 
                                modalType === 'COMPRAR' ? 'bg-green-600 hover:bg-green-500 shadow-green-900/20' : 
                                'bg-red-600 hover:bg-red-500 shadow-red-900/20'
                            } shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading || isRateLimited ? 'Procesando...' : 
                                modalType === 'COMPRAR' ? 'BUSCAR VENDEDOR' : 
                                `Iniciar ${modalType}`
                            }
                        </button>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;