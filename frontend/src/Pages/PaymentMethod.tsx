import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import axios from 'axios';

// Asegúrate de que el puerto 4001 es donde está corriendo tu backend Node.js
const API_URL = 'http://localhost:4001/api'; 

const PaymentMethods = () => {
  const [methods, setMethods] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  
  const [newMethod, setNewMethod] = useState({ 
    bankName: '', 
    accountDetails: '', 
    type: 'BANK_TRANSFER' 
  });

  const fetchMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      // Asegurarse de que el token exista antes de pedir datos
      if (!token) return; 

      const res = await axios.get(`${API_URL}/payment-methods`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMethods(res.data);
    } catch (err) { 
      console.error("Error cargando métodos:", err); 
    }
  };

  const handleAdd = async () => {
    if (!newMethod.bankName || !newMethod.accountDetails) {
      return alert("Por favor, completa el nombre del banco y los detalles de la cuenta.");
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/payment-methods`, newMethod, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Limpiar el formulario al guardar con éxito
      setNewMethod({ bankName: '', accountDetails: '', type: 'BANK_TRANSFER' });
      setShowAdd(false);
      
      // Recargar la lista de inmediato
      fetchMethods();
      
      alert("¡Método de pago agregado exitosamente!");
    } catch (err) { 
      console.error(err);
      alert("Error al guardar método. Verifica la consola."); 
    }
  };

  useEffect(() => { 
    fetchMethods(); 
  }, []);

  return (
    <div className="p-6 bg-[#13151b] border border-[#2b3139] rounded-2xl max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black italic uppercase text-white">Cuentas y Billeteras Afines</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Configuración Global de Cobro</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl transition shadow-lg shadow-blue-900/20 text-white"
        >
          <Icons.Plus size={20} />
        </button>
      </div>

      {/* LEYENDA LEGAL DE SEGURIDAD (BLINDAJE KYC) */}
      <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex gap-3 items-start">
        <Icons.ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={20} />
        <p className="text-[11px] text-gray-400 leading-relaxed">
          <span className="text-red-500 font-black uppercase">Aviso de Seguridad P2P:</span> Todas las cuentas bancarias o billeteras externas deben estar <span className="text-white font-bold underline">a nombre del titular de esta cuenta</span>. El uso de cuentas de terceros está estrictamente prohibido y ligado a su validación de <span className="text-white font-bold">KYC</span>. Cualquier discrepancia resultará en el bloqueo de fondos y suspensión definitiva.
        </p>
      </div>

      {/* LISTA DE MÉTODOS DE PAGO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.length === 0 && !showAdd && (
          <p className="text-gray-500 text-sm col-span-2 text-center py-4">
            Aún no tienes cuentas vinculadas. Haz clic en el "+" para agregar una.
          </p>
        )}
        {methods.map((m: any) => (
          <div key={m.id} className="p-4 bg-[#0b0e11] border border-[#2b3139] rounded-xl flex justify-between items-center group hover:border-blue-500/50 transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#1d2026] rounded-lg">
                {m.type === 'BANK_TRANSFER' ? <Icons.Building2 size={18} className="text-blue-500"/> : <Icons.Wallet2 size={18} className="text-purple-500"/>}
              </div>
              <div>
                <p className="text-white font-black text-xs uppercase">{m.bankName}</p>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">{m.accountDetails}</p>
              </div>
            </div>
            <Icons.CheckCircle size={14} className="text-green-500 opacity-50" />
          </div>
        ))}
      </div>

      {/* FORMULARIO PARA AGREGAR */}
      {showAdd && (
        <div className="mt-8 p-6 bg-[#0b0e11] border border-[#2b3139] rounded-2xl animate-in fade-in slide-in-from-bottom-2">
          <h3 className="text-sm font-black uppercase mb-4 text-gray-300">Nuevo Método de Cobro</h3>
          <div className="space-y-4">
            <select 
              className="w-full bg-[#13151b] border border-[#2b3139] p-3 rounded-lg text-sm font-bold text-white outline-none focus:border-blue-500"
              value={newMethod.type}
              onChange={e => setNewMethod({...newMethod, type: e.target.value})}
            >
              <option value="BANK_TRANSFER">Transferencia Bancaria (RD o Internacional)</option>
              <option value="WALLET">Billetera Digital (Zelle, PayPal, AirTM, etc.)</option>
              <option value="OTHER">Otro (Efectivo, Remesa)</option>
            </select>

            <input 
              placeholder="Nombre del Banco o App (Ej: Banreservas, Wise, Revolut)" 
              value={newMethod.bankName}
              className="w-full bg-[#13151b] border border-[#2b3139] p-3 rounded-lg text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
              onChange={e => setNewMethod({...newMethod, bankName: e.target.value})}
            />

            <textarea 
              placeholder="Detalles de cuenta (Número, Tipo, Nombre del Titular - DEBE COINCIDIR CON KYC)" 
              value={newMethod.accountDetails}
              className="w-full bg-[#13151b] border border-[#2b3139] p-3 rounded-lg text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500 h-24"
              onChange={e => setNewMethod({...newMethod, accountDetails: e.target.value})}
            />

            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-[#1d2026] text-white py-3 rounded-xl font-bold uppercase text-[10px] hover:bg-[#2b3139]">Cancelar</button>
              <button onClick={handleAdd} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold uppercase text-[10px] hover:bg-blue-500 shadow-lg shadow-blue-900/20">Guardar Método</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;