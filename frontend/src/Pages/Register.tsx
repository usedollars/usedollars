import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    referredBy: '' 
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 👈 Nuevo estado de carga
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // 👈 Bloqueamos el botón
    setError('');

    try {
      await axios.post('http://localhost:4001/auth/register', formData);
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al procesar el registro');
    } finally {
      setIsLoading(false); // 👈 Liberamos el botón, pase lo que pase
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center px-4 font-['Inter'] relative">
       
       <Link to="/" className="absolute top-8 left-8 text-gray-500 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors uppercase tracking-wider">
        <ArrowLeft size={20} /> Volver
      </Link>

      <div className="max-w-md w-full bg-[#181a20] border border-[#2b3139] p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
        
        <h2 className="text-3xl font-black text-center mb-2 uppercase tracking-tighter text-white">
          Unirse a la <span className="text-blue-500">Legión</span>
        </h2>
        <p className="text-gray-500 text-center text-sm mb-8">Crea tu cuenta y empieza a ganar.</p>

        {error && <p className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-6 text-xs text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Nombre Completo</label>
            <input 
              type="text" 
              className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="Ej. María Mercedes"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Email</label>
            <input 
              type="email" 
              className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="correo@ejemplo.com"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              disabled={isLoading}
            />
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-bold text-yellow-500 uppercase mb-1 ml-1">Código de Invitación (Opcional)</label>
            <input 
              type="text" 
              className="w-full bg-[#0b0e11] border border-yellow-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 font-mono text-sm uppercase"
              placeholder="Ej. X8J2P9"
              // 👈 Forzamos a que el código siempre esté en mayúsculas
              onChange={(e) => setFormData({...formData, referredBy: e.target.value.toUpperCase()})}
              value={formData.referredBy}
              disabled={isLoading}
            />
            <p className="text-[9px] text-gray-600 mt-2 ml-1 italic">Si te invitaron, ingresa el código para activar tu red.</p>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            // 👈 Cambiamos el color si está cargando para dar feedback visual
            className={`w-full text-white font-bold py-4 rounded-xl transition shadow-lg mt-6 uppercase tracking-widest text-sm 
              ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'}`}
          >
            {isLoading ? 'Forjando identidad...' : 'Crear mi cuenta'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-8 text-xs relative z-10">
          ¿Ya eres parte? <Link to="/login" className="text-blue-400 font-bold hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;