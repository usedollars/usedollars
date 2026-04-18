import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:4001/auth/login', { email, password });
      
      // 1. Guardamos el token de seguridad
      localStorage.setItem('token', res.data.token);
      
      // 2. [CORRECCIÓN] Guardamos los datos completos del usuario para el Sidebar
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // 3. Si el backend manda el rol separado, también lo guardamos
      if(res.data.user.role) {
         localStorage.setItem('user_role', res.data.user.role);
      }

      navigate('/dashboard'); 
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || 'No se pudo conectar al servidor');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center px-4 relative font-['Inter']">
      
      <Link to="/" className="absolute top-8 left-8 text-gray-500 hover:text-white flex items-center gap-2 font-bold text-sm transition-colors uppercase tracking-wider">
        <ArrowLeft size={20} /> Volver
      </Link>

      <div className="max-w-md w-full bg-[#181a20] border border-[#2b3139] p-10 rounded-3xl shadow-2xl">
        <h2 className="text-3xl font-black text-center mb-8 uppercase tracking-tighter text-white">
          Entrar al <span className="text-blue-500">Búnker</span>
        </h2>

        {error && <p className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-xl mb-6 text-xs text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
            <input 
              type="email" 
              className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="tu@correo.com"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password</label>
            <input 
              type="password" 
              className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-900/20">
            INGRESAR
          </button>
        </form>
        <p className="text-center text-gray-500 mt-8 text-sm">
          ¿No tienes cuenta? <Link to="/register" className="text-blue-400 font-bold hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;