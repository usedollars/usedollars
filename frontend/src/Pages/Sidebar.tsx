import React, { useState } from 'react'; // [NUEVO] Importamos useState
import { Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();
  const [copied, setCopied] = useState(false); // [NUEVO] Estado para el botón de copiado

  // 1. Extraemos los datos del objeto user para obtener los niveles reales de tu DB
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = localStorage.getItem('user_role'); // 'ADMIN' o 'USER'
  
  // Extraemos la información de niveles que acabamos de blindar en el backend
  const kycTier = user.kycTier || 0;
  const kycStatus = user.kycStatus || 'PENDING_VERIFICATION';
  
  // [NUEVO] Extraemos el código de referido y el nombre
  const refCode = user.refCode || '';
  const userName = user.name || 'Socio P2P'; // Si por algún error no hay nombre, dirá Socio P2P
  const initials = userName.substring(0, 2).toUpperCase();

  const isActive = (path: string) => location.pathname === path;

  const itemClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm
    ${isActive(path) 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
      : 'text-gray-400 hover:text-white hover:bg-[#1d2026]'}
  `;

  // [NUEVO] Función para copiar al portapapeles
  const handleCopyCode = () => {
    if (refCode) {
      navigator.clipboard.writeText(refCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Vuelve al ícono normal después de 2 seg
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-4 font-['Inter']">
      <nav className="space-y-2 flex-1">
        {/* PANEL PRINCIPAL */}
        <Link to="/dashboard" className={itemClass('/dashboard')}>
          <Icons.LayoutDashboard size={20} />
          <span>Panel Principal</span>
        </Link>

        <Link to="/wallet" className={itemClass('/wallet')}>
          <Icons.Wallet size={20} />
          <span>Mis Billeteras</span>
        </Link>

        <Link to="/p2p" className={itemClass('/p2p')}>
          <Icons.Users size={20} />
          <span>Mercado P2P</span>
        </Link>

        {/* SECCIÓN CONDICIONAL: Solo aparece si eres ADMIN */}
        {userRole === 'ADMIN' && (
          <>
            <div className="pt-4 pb-2 border-t border-[#2b3139] mt-4">
              <p className="px-4 text-[10px] font-black text-red-500 uppercase tracking-widest">
                Administración
              </p>
            </div>

            <Link to="/admin/disputes" className={itemClass('/admin/disputes')}>
              <Icons.Gavel size={20} />
              <span>Gestionar Disputas</span>
            </Link>
          </>
        )}

        <div className="pt-4 pb-2">
          <p className="px-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">Configuración</p>
        </div>

       <Link to="/kyc" className={itemClass('/kyc')}>
          <Icons.User size={20} />
          <span>Perfil & KYC</span>
        </Link>

        <Link to="/security" className={itemClass('/security')}>
          <Icons.ShieldCheck size={20} />
          <span>Seguridad</span>
        </Link>
      </nav>

      {/* Footer del Sidebar: Aquí es donde mostramos el blindaje del usuario */}
      <div className="mt-auto pt-6 border-t border-[#2b3139]">
        <div className="bg-[#13151b] p-4 rounded-2xl border border-[#2b3139] relative overflow-hidden group transition-all hover:border-blue-500/30">
            <div className="flex items-center gap-3 relative z-10">
                {/* Avatar con insignia de verificación dinámica */}
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center font-black text-sm text-white shadow-inner">
                        {initials} {/* [MODIFICADO] Iniciales dinámicas */}
                    </div>
                    {kycStatus === 'APPROVED' && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full border-2 border-[#13151b] p-0.5 shadow-lg">
                        <Icons.Check size={10} strokeWidth={4} className="text-white" />
                      </div>
                    )}
                </div>

                <div className="overflow-hidden flex-1">
                    <p className="text-xs font-black text-white truncate uppercase tracking-tight">{userName}</p>
                    
                    {/* Badge de Nivel Dinámico */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${
                        kycTier >= 1 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        Tier {kycTier}
                      </span>
                      <span className="text-[10px] text-gray-600">•</span>
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        {userRole === 'ADMIN' ? 'Juez' : 'Verificado'}
                      </span>
                    </div>
                </div>
            </div>
            
            {/* [NUEVO] Sección para copiar el código de referido */}
            {refCode && (
              <div className="mt-4 pt-3 border-t border-[#2b3139]/50 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Tu Código de Invitación</p>
                  <p className="text-xs font-mono font-bold text-blue-400">{refCode}</p>
                </div>
                <button 
                  onClick={handleCopyCode}
                  className="bg-[#1d2026] hover:bg-blue-600 text-gray-400 hover:text-white p-2 rounded-xl transition-all shadow-sm"
                  title="Copiar código"
                >
                  {copied ? <Icons.Check size={14} className="text-green-500" /> : <Icons.Copy size={14} />}
                </button>
              </div>
            )}
            
            {/* Si el usuario es Nivel 0, le mostramos un incentivo sutil */}
            {kycTier === 0 && kycStatus !== 'PENDING_REVIEW' && (
              <Link to="/profile" className="mt-3 flex items-center justify-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 py-1.5 rounded-lg transition-colors group">
                <Icons.AlertCircle size={12} />
                <span className="text-[8px] font-black uppercase tracking-widest">Mejorar Nivel</span>
              </Link>
            )}
        </div>
      </div>
    </div>
  );
};