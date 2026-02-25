import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useIsMobile } from './hooks/useIsMobile';
import Sidebar from './components/Sidebar.tsx';
import MobileLayout from './components/mobile/MobileLayout.tsx';
import CategoryList from './pages/CategoryList.tsx';
import PaymentMethodList from './pages/PaymentMethodList.tsx';
import ExpenseList from './pages/ExpenseList.tsx';
import CurrencyList from './pages/CurrencyList.tsx';
import IncomeList from './pages/IncomeList.tsx';
import SavingsWalletList from './pages/SavingsWalletList.tsx';
import SavingList from './pages/SavingList.tsx';
import IssuingEntityList from './pages/IssuingEntityList.tsx';
import DebtList from './pages/DebtList.tsx';
import HomePage from './pages/HomePage.tsx';
import MorePage from './pages/MorePage.tsx';

function App() {
  const { isDark, toggle } = useTheme();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BrowserRouter>
        <Routes>
          <Route element={<MobileLayout isDark={isDark} toggle={toggle} />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/expenses" element={<ExpenseList />} />
            <Route path="/income" element={<IncomeList />} />
            <Route path="/debts" element={<DebtList />} />
            <Route path="/more" element={<MorePage />} />
            <Route path="/categories" element={<CategoryList />} />
            <Route path="/payment-methods" element={<PaymentMethodList />} />
            <Route path="/currencies" element={<CurrencyList />} />
            <Route path="/savings" element={<SavingList />} />
            <Route path="/savings-wallets" element={<SavingsWalletList />} />
            <Route path="/issuing-entities" element={<IssuingEntityList />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <Sidebar isDark={isDark} toggle={toggle} />
        <main className="lg:ml-64 min-h-screen">
          <Routes>
            <Route path="/" element={<CategoryList />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/payment-methods" element={<PaymentMethodList />} />
            <Route path="/expenses" element={<ExpenseList />} />
            <Route path="/currencies" element={<CurrencyList />} />
            <Route path="/income" element={<IncomeList />} />
            <Route path="/savings-wallets" element={<SavingsWalletList />} />
            <Route path="/savings" element={<SavingList />} />
            <Route path="/issuing-entities" element={<IssuingEntityList />} />
            <Route path="/debts" element={<DebtList />} />
            <Route path="/more" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
