import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useIsMobile } from './hooks/useIsMobile';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar.tsx';
import MobileLayout from './components/mobile/MobileLayout.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import VerifyEmailPage from './pages/VerifyEmailPage.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage.tsx';
import CategoryList from './pages/CategoryList.tsx';
import PaymentMethodList from './pages/PaymentMethodList.tsx';
import ExpenseList from './pages/ExpenseList.tsx';
import CurrencyList from './pages/CurrencyList.tsx';
import IncomeList from './pages/IncomeList.tsx';
import SavingsWalletList from './pages/SavingsWalletList.tsx';
import SavingList from './pages/SavingList.tsx';
import IssuingEntityList from './pages/IssuingEntityList.tsx';
import CardExpenseList from './pages/CardExpenseList.tsx';
import PersonalDebtList from './pages/PersonalDebtList.tsx';
import RecurrentExpenseList from './pages/RecurrentExpenseList.tsx';
import BudgetList from './pages/BudgetList.tsx';
import HomePage from './pages/HomePage.tsx';
import MorePage from './pages/MorePage.tsx';
import AdminPage from './pages/AdminPage.tsx';
import HistoryPage from './pages/HistoryPage.tsx';

function DesktopLayout() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  useTheme();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<MobileLayout />}>
                <Route path="/" element={<ExpenseList />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/expenses" element={<ExpenseList />} />
                <Route path="/income" element={<IncomeList />} />
                <Route path="/card-expenses" element={<CardExpenseList />} />
                <Route path="/debts" element={<PersonalDebtList />} />
                <Route path="/more" element={<MorePage />} />
                <Route path="/categories" element={<CategoryList />} />
                <Route path="/payment-methods" element={<PaymentMethodList />} />
                <Route path="/currencies" element={<CurrencyList />} />
                <Route path="/savings" element={<SavingList />} />
                <Route path="/savings-wallets" element={<SavingsWalletList />} />
                <Route path="/issuing-entities" element={<IssuingEntityList />} />
                <Route path="/recurrent-expenses" element={<RecurrentExpenseList />} />
                <Route path="/budget" element={<BudgetList />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DesktopLayout />}>
              <Route path="/" element={<ExpenseList />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/categories" element={<CategoryList />} />
              <Route path="/payment-methods" element={<PaymentMethodList />} />
              <Route path="/expenses" element={<ExpenseList />} />
              <Route path="/currencies" element={<CurrencyList />} />
              <Route path="/income" element={<IncomeList />} />
              <Route path="/savings-wallets" element={<SavingsWalletList />} />
              <Route path="/savings" element={<SavingList />} />
              <Route path="/issuing-entities" element={<IssuingEntityList />} />
              <Route path="/card-expenses" element={<CardExpenseList />} />
              <Route path="/debts" element={<PersonalDebtList />} />
              <Route path="/recurrent-expenses" element={<RecurrentExpenseList />} />
              <Route path="/budget" element={<BudgetList />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/more" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
