import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.tsx';
import CategoryList from './pages/CategoryList.tsx';
import PaymentMethodList from './pages/PaymentMethodList.tsx';
import ExpenseList from './pages/ExpenseList.tsx';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-stone-50">
        <Sidebar />
        
        {/* Main content area with left margin for sidebar */}
        <main className="lg:ml-64 min-h-screen">
          <Routes>
            <Route path="/" element={<CategoryList />} />
            <Route path="/payment-methods" element={<PaymentMethodList />} />
            <Route path="/expenses" element={<ExpenseList />} />
            {/* Agrega más rutas aquí cuando las necesites:
            <Route path="/budget" element={<Budget />} />
            <Route path="/reports" element={<Reports />} />
            */}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
