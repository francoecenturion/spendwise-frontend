import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.tsx';
import CategoryList from './pages/CategoryList.tsx';
import PaymentMethodList from './pages/PaymentMethodList.tsx';
import ExpenseList from './pages/ExpenseList.tsx';
import CurrencyList from './pages/CurrencyList.tsx';
import IncomeList from './pages/IncomeList.tsx';
import SavingsWalletList from './pages/SavingsWalletList.tsx';
import SavingList from './pages/SavingList.tsx';
import IssuingEntityList from './pages/IssuingEntityList.tsx';
import DebtList from './pages/DebtList.tsx';
import { useTheme } from './hooks/useTheme';

function App() {
  const { isDark, toggle } = useTheme();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <Sidebar isDark={isDark} toggle={toggle} />

        {/* Main content area with left margin for sidebar */}
        <main className="lg:ml-64 min-h-screen">
          <Routes>
            <Route path="/" element={<CategoryList />} />
            <Route path="/payment-methods" element={<PaymentMethodList />} />
            <Route path="/expenses" element={<ExpenseList />} />
            <Route path="/currencies" element={<CurrencyList />} />
            <Route path="/income" element={<IncomeList />} />
            <Route path="/savings-wallets" element={<SavingsWalletList />} />
            <Route path="/savings" element={<SavingList />} />
            <Route path="/issuing-entities" element={<IssuingEntityList />} />
            <Route path="/debts" element={<DebtList />} />
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
