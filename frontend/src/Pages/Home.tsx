import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';

const Home = () => {
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const [country] = useState({ name: 'Rep. Dominicana', currency: 'DOP', code: 'do' });
  const navigate = useNavigate();

  // --- WIDGET TRADINGVIEW ---
  useEffect(() => {
    if (widgetContainerRef.current) {
      widgetContainerRef.current.innerHTML = '';
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        { "proName": "BINANCE:BTCUSDT", "title": "Bitcoin" },
        { "proName": "BINANCE:ETHUSDT", "title": "Ethereum" },
        { "proName": "FX:EURUSD", "title": "EUR/USD" },
        { "proName": "FX:USDMXN", "title": "USD/MXN" },
        { "proName": "FX_IDC:USDDOP", "title": "USD/DOP" }
      ],
      "showSymbolLogo": true,
      "colorTheme": "dark",
      "isTransparent": false,
      "displayMode": "adaptive",
      "locale": "es",
      "largeChartUrl": ""
    });

    if (widgetContainerRef.current) {
      widgetContainerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0e11] text-white font-['Inter'] selection:bg-blue-500/30">
      
      {/* --- NAVBAR --- */}
      <nav className="bg-[#0b0e11] border-b border-gray-800 w-full relative z-40">
        <div className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 max-w-7xl mx-auto gap-2">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition group shrink-0 select-none">
            <div className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
               <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" className="stroke-green-500" />
                <path d="M21 3v5h-5" className="stroke-green-500" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" className="stroke-blue-500" />
                <path d="M3 21v-5h5" className="stroke-blue-500" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-black text-white text-[10px] md:text-sm">$</span>
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tighter uppercase italic text-white block">
              USEDOLLARS
            </span>
          </Link>

          {/* MENU DESKTOP */}
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
            <a href="#remesas" className="hover:text-white transition">Cómo enviar</a>
            <a href="#ganar" className="hover:text-white transition text-yellow-400 flex items-center gap-1">
              <Icons.Star size={14} className="fill-yellow-400" /> Socios
            </a>
          </div>

          {/* ACTIONS RIGHT */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono bg-gray-800 px-3 py-1 rounded-full border border-gray-700 text-gray-300">
              <img src={`https://flagcdn.com/w20/${country.code}.png`} className="w-3 h-auto" alt="flag" />
              <span>{country.currency}</span>
            </div>
            <Link to="/login" className="text-gray-300 hover:text-white text-xs md:text-sm font-bold">Entrar</Link>
            <Link to="/register" className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-bold text-xs md:text-sm shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* --- TICKER WIDGET TRADINGVIEW --- */}
      <div className="w-full bg-[#13151b] border-b border-[#2b3139] z-30 shrink-0 h-[46px] overflow-hidden">
        <div className="tradingview-widget-container" ref={widgetContainerRef}>
          <div className="tradingview-widget-container__widget"></div>
        </div>
      </div>

      {/* --- HERO --- */}
      <header className="pt-16 pb-12 md:pt-40 md:pb-24 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-block px-4 py-1 mb-8 text-[10px] md:text-xs font-bold tracking-wider text-blue-400 uppercase bg-blue-900/20 rounded-full border border-blue-500/30 animate-pulse">
          Próximamente ⚡
        </div>
        
        <h1 className="text-4xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight tracking-tight text-white italic">
          Intercambia <br /> Dólares Digitales <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            Sin Complicaciones.
          </span>
        </h1>
        
        <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
           Mercado P2P <span className="text-green-400 font-bold bg-green-400/10 px-2 py-1 rounded border border-green-400/20">100% Gratis</span>. Retiros a billeteras externas desde 1 USDT.
        </p>

        <div className="flex justify-center gap-4">
            <Link to="/register" className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors rounded-sm">
              Crear Cuenta
            </Link>
            <Link to="/login" className="px-8 py-3 bg-transparent border border-gray-700 text-white font-black uppercase tracking-widest text-xs hover:border-white transition-colors rounded-sm">
              Iniciar Sesión
            </Link>
        </div>
      </header>

      {/* --- FEATURES GRID --- */}
      <section className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-6">
        <div className="bg-[#13151b] border border-[#2b3139] p-8 rounded-2xl hover:border-green-500/30 transition-colors group">
           <div className="w-12 h-12 bg-green-900/30 text-green-400 rounded-lg flex items-center justify-center mb-4 border border-green-500/20 group-hover:scale-110 transition-transform">
             <Icons.Scale size={24} />
           </div>
           <h3 className="text-xl font-bold mb-2">Comisiones Inteligentes</h3>
           <p className="text-gray-400 text-sm">Operar en nuestro P2P cuesta <strong>$0</strong>. Solo pagas una tarifa dinámica (desde 1 USDT) al retirar fondos a otras redes.</p>
        </div>
        <div className="bg-[#13151b] border border-[#2b3139] p-8 rounded-2xl hover:border-blue-500/30 transition-colors group">
           <div className="w-12 h-12 bg-blue-900/30 text-blue-400 rounded-lg flex items-center justify-center mb-4 border border-blue-500/20 group-hover:scale-110 transition-transform">
             <Icons.Clock size={24} />
           </div>
           <h3 className="text-xl font-bold mb-2">Mercado 24/7</h3>
           <p className="text-gray-400 text-sm">El mercado nunca cierra. Compra y vende domingos y feriados.</p>
        </div>
        <div className="bg-[#13151b] border border-[#2b3139] p-8 rounded-2xl hover:border-purple-500/30 transition-colors group">
           <div className="w-12 h-12 bg-purple-900/30 text-purple-400 rounded-lg flex items-center justify-center mb-4 border border-purple-500/20 group-hover:scale-110 transition-transform">
             <Icons.ShieldCheck size={24} />
           </div>
           <h3 className="text-xl font-bold mb-2">Garantía de Custodia</h3>
           <p className="text-gray-400 text-sm">Tus fondos están protegidos por Escrow hasta que la transacción se completa.</p>
        </div>
      </section>

      {/* --- SECCIÓN REMESAS --- */}
      <section id="remesas" className="py-24 max-w-7xl mx-auto px-6 border-t border-gray-800 text-center">
        <h2 className="text-3xl md:text-5xl font-black mb-4 italic">ENVÍA DINERO SIN FRONTERAS</h2>
        <p className="text-gray-400 mb-16 max-w-3xl mx-auto">Olvídate de las agencias de envío. Usa el ecosistema cripto para mover valor internacionalmente en 4 pasos simples.</p>
        
        <div className="relative grid md:grid-cols-4 gap-6">
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-800 -z-0"></div>
          {[
            { n: 1, t: "Recarga tu Billetera", d: "Entra al mercado P2P y compra USDT usando tu moneda local (Transferencia bancaria)." },
            { n: 2, t: "Transferencia Interna", d: "Manda fondos a cualquier usuario registrado en Usedollars. ¡GRATIS!", promo: "0% Comisión" },
            { n: 3, t: "Recepción Global", d: "El usuario recibe los USDT en segundos, sin importar el país." },
            { n: 4, t: "Retiro a Banco", d: "Vende esos USDT y recibe el dinero en su moneda local." }
          ].map((s, idx) => (
            <div key={idx} className="bg-[#13151b] border border-[#2b3139] p-6 relative z-10 h-full flex flex-col items-center rounded-2xl hover:-translate-y-2 transition-transform duration-300">
              {s.promo && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-lg shadow-green-900/50">{s.promo}</div>}
              <div className="w-14 h-14 bg-[#1d2026] text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 border-4 border-[#0b0e11] shadow-lg">{s.n}</div>
              <h3 className="text-lg font-bold mb-2">{s.t}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- SECCIÓN ¿CÓMO FUNCIONA? (ACTUALIZADA) --- */}
      <section id="ganar" className="py-24 bg-[#13151b] border-y border-gray-800 relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-blue-900/10 via-[#13151b] to-[#13151b] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-16 italic text-white">
            ¿CÓMO FUNCIONA?
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            
            {/* PASO 1 */}
            <div className="bg-[#0b0e11] border border-gray-800 p-8 rounded-2xl relative group hover:border-blue-500/50 transition-all duration-300">
               <div className="w-16 h-16 bg-blue-900/20 text-blue-400 rounded-full flex items-center justify-center text-2xl font-black mb-6 mx-auto border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:scale-110 transition-transform">
                 1
               </div>
               <h3 className="text-xl font-black mb-4 uppercase tracking-wide">Compartes tu Código</h3>
               <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                 Le das tu enlace de afiliado a un amigo.
               </p>
            </div>

            {/* PASO 2 */}
            <div className="bg-[#0b0e11] border border-gray-800 p-8 rounded-2xl relative group hover:border-purple-500/50 transition-all duration-300">
               <div className="w-16 h-16 bg-purple-900/20 text-purple-400 rounded-full flex items-center justify-center text-2xl font-black mb-6 mx-auto border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] group-hover:scale-110 transition-transform">
                 2
               </div>
               <h3 className="text-xl font-black mb-4 uppercase tracking-wide">Tu amigo se Registra</h3>
               <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                 Él crea su cuenta usando tu código.
               </p>
            </div>

            {/* PASO 3 - PREMIO */}
            <div className="bg-gradient-to-b from-green-900/10 to-[#0b0e11] border border-green-500/30 p-8 rounded-2xl relative group hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(34,197,94,0.05)]">
               <div className="w-16 h-16 bg-green-900/20 text-green-400 rounded-full flex items-center justify-center mb-6 mx-auto border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)] group-hover:scale-110 transition-transform">
                 <Icons.Infinity size={32} />
               </div>
               <h3 className="text-xl font-black mb-4 uppercase tracking-wide text-green-400">¡Cobras Siempre!</h3>
               <p className="text-gray-300 text-sm leading-relaxed max-w-xs mx-auto">
                 Por cada transacción que él haga en el futuro, tú recibes automáticamente <span className="text-white font-bold">0.25 USDT</span>.
               </p>
               <div className="mt-6 inline-block bg-yellow-500/10 border border-yellow-500/20 px-4 py-1 rounded-full">
                 <span className="text-[10px] font-black tracking-[0.2em] text-yellow-500 uppercase">Automaticamente</span>
               </div>
            </div>
          </div>

          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-black font-black px-8 py-4 rounded-sm hover:bg-gray-200 transition-colors uppercase tracking-widest text-xs shadow-lg shadow-white/10">
            OBTENER MI CÓDIGO AHORA
            <Icons.ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-gray-800 bg-[#050608] pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8 text-center md:text-left">
           <div className="md:col-span-2">
             <span className="text-xl font-black tracking-tighter italic text-white uppercase">USEDOLLARS</span>
             <p className="text-gray-600 text-sm mt-4 max-w-sm">
               Plataforma segura de intercambio P2P global. Simplificando el acceso a dólares digitales para Latinoamérica.
             </p>
           </div>
           <div>
             <h4 className="font-bold text-gray-300 mb-4 uppercase text-xs tracking-widest">Legal</h4>
             <ul className="text-sm text-gray-500 space-y-2">
               <li><a href="#" className="hover:text-blue-500 transition">Términos de Uso</a></li>
               <li><a href="#" className="hover:text-blue-500 transition">Política de Privacidad</a></li>
               <li><a href="#" className="hover:text-blue-500 transition">KYC / AML</a></li>
             </ul>
           </div>
           <div>
             <h4 className="font-bold text-gray-300 mb-4 uppercase text-xs tracking-widest">Soporte</h4>
             <ul className="text-sm text-gray-500 space-y-2">
               <li><a href="#" className="hover:text-blue-500 transition">Centro de Ayuda</a></li>
               <li><a href="#" className="hover:text-blue-500 transition">Crear Ticket</a></li>
               <li><a href="#" className="hover:text-blue-500 transition">Estado del Sistema</a></li>
             </ul>
           </div>
        </div>
        <div className="text-center text-gray-800 text-[10px] mt-12 border-t border-gray-900 pt-8 uppercase tracking-widest">
          © 2026 Usedollars.com. Todos los derechos reservados.
        </div>
      </footer>

      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0b0e11; }
        ::-webkit-scrollbar-thumb { background: #2b3139; border-radius: 3px; }
      `}</style>
    </div>
  );
};

export default Home;