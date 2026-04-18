import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Dashboard from './Pages/Dashboard';
import OrderPage from './Pages/OrderPage';
import AdminDisputes from './Pages/admin/Admin.disputes'; 
import PaymentMethod from './Pages/PaymentMethod';
import P2PMarket from './Pages/P2Pmarket';
import KycVerification from './Pages/KycVerification';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/order/:id" element={<OrderPage />} />
        <Route path="/wallet" element={<PaymentMethod />} />
        {/* Ruta para el Juez de Usedollars */}
        <Route path="/admin/disputes" element={<AdminDisputes />} />
        <Route path="/p2p" element={<P2PMarket />} />
        <Route path="/kyc" element={<KycVerification />} />

      </Routes>
    </Router>
  );
}

export default App;