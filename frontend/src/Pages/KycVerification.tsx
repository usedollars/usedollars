import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Sidebar } from './Sidebar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // <-- Faltaba esto

const KycVerification = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate(); // <-- Y esto
  
  const [formData, setFormData] = useState({
    fullName: '',
    documentId: '',
    documentType: 'CEDULA',
  });

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      // Asegurarse de que el token exista
      if (!token) return alert("Sesión expirada");

      // Ajustada la ruta a /api/users/kyc-request (o la que uses en tu backend)
      await axios.post('http://localhost:4001/api/users/kyc-request', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStep(3); // Paso de "En Revisión"
    } catch (error) {
      console.error(error);
      alert("Error al enviar la solicitud de KYC. Verifica la consola.");
    }
  };

  return (
    <div className="flex h-screen bg-[#0b0e11] text-white overflow-hidden">
      <aside className="hidden md:flex w-64 bg-[#0b0e11] border-r border-[#2b3139] flex-col h-full shrink-0 overflow-y-auto">
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col relative w-full min-w-0 bg-[#0b0e11]">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-[#13151b] border border-[#2b3139] rounded-2xl p-8 shadow-2xl">
            
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="text-center">
                  <div className="bg-blue-600/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icons.ShieldCheck size={32} className="text-blue-500" />
                  </div>
                  <h2 className="text-xl font-black uppercase italic italic">Verificación de Identidad</h2>
                  <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">Requisito para conectar Cuentas Afines</p>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl">
                  <p className="text-[10px] text-gray-400 leading-relaxed italic text-center">
                    "Para Usedollars, la seguridad es ley. Su nombre legal debe coincidir con el titular de sus cuentas bancarias para evitar fraudes y lavado de activos."
                  </p>
                </div>

                <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black uppercase tracking-widest transition shadow-lg shadow-blue-900/20 text-white"
                >
                  Empezar Verificación
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-black uppercase text-gray-300 mb-4">Datos del Documento</h3>
                
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Nombre Completo (Como en su ID)</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#0b0e11] border border-[#2b3139] p-3 rounded-lg text-sm outline-none focus:border-blue-500 text-white"
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Tipo de Documento</label>
                  <select 
                    className="w-full bg-[#0b0e11] border border-[#2b3139] p-3 rounded-lg text-sm font-bold outline-none focus:border-blue-500 text-white"
                    onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                  >
                    <option value="CEDULA">Cédula de Identidad (RD)</option>
                    <option value="PASAPORTE">Pasaporte Internacional</option>
                    <option value="ID_CARD">ID Card (Otros Países)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Número de Documento</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 402-XXXXXXX-X"
                    className="w-full bg-[#0b0e11] border border-[#2b3139] p-3 rounded-lg text-sm outline-none focus:border-blue-500 text-white placeholder:text-gray-600"
                    onChange={(e) => setFormData({...formData, documentId: e.target.value})}
                  />
                </div>

                <button 
                  onClick={handleSubmit}
                  className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-black uppercase tracking-widest transition mt-4"
                >
                  Enviar para Revisión
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-4 animate-in zoom-in-95">
                <div className="text-yellow-500 flex justify-center"><Icons.Clock size={48} /></div>
                <h2 className="text-lg font-black uppercase italic">Solicitud en Revisión</h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Nuestro sistema judicial digital está validando tus datos. Una vez verificado, podrás registrar tus cuentas bancarias y operar sin límites.
                </p>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-[#1d2026] text-white py-3 rounded-xl font-bold uppercase text-[10px] border border-[#2b3139] hover:bg-[#2b3139]"
                >
                  Volver al Panel
                </button>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default KycVerification;