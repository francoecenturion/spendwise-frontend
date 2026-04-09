import { useState, useEffect } from 'react';
import Modal from './Modal';
import { MailImport, MailImportConfirm, Category, PaymentMethod, CategoryType } from '../types';
import { categoryService, paymentMethodService, mailImportService } from '../services/api';
import CategoryPicker from './CategoryPicker';
import PaymentMethodWithEntityPicker from './PaymentMethodWithEntityPicker';

interface Props {
  mailImport: MailImport | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmed: () => void;
}

export default function MailImportConfirmModal({ mailImport, isOpen, onClose, onConfirmed }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [form, setForm] = useState<MailImportConfirm>({ categoryId: undefined });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDebt = mailImport?.parsedIsDebt === true;

  useEffect(() => {
    if (isOpen) {
      setForm({
        categoryId: undefined,
        paymentMethodId: undefined,
        description: '',
        date: mailImport?.parsedDate ?? new Date().toISOString().split('T')[0],
      });
      setError(null);
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [cats, pms, binding] = await Promise.all([
        categoryService.getAll({ enabled: true, type: CategoryType.EXPENSE }, 0, 1000),
        paymentMethodService.getAll({ enabled: true }, 0, 1000),
        mailImport?.parsedMerchant
          ? mailImportService.lookupBinding(mailImport.parsedMerchant)
          : Promise.resolve(null),
      ]);
      setCategories(cats.content);
      setPaymentMethods(pms.content);

      if (binding) {
        // Pre-fill from saved binding
        setForm({
          categoryId: binding.categoryId,
          paymentMethodId: binding.paymentMethodId,
          description: binding.description || '',
        });
      } else {
        // Feature 1: auto-match payment method by senderEntity name
        const matchedPm = pms.content.find(pm =>
          mailImport?.senderEntity &&
          pm.name.toLowerCase().includes(mailImport.senderEntity.toLowerCase())
        );
        if (matchedPm) {
          setForm(f => ({ ...f, paymentMethodId: matchedPm.id }));
        }
      }
    } catch {
      // silently ignore
    }
  };

  const canSubmit = isDebt || !!form.categoryId;

  const handleSubmit = async () => {
    if (!mailImport?.id || !canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await mailImportService.confirm(mailImport.id, form);
      onConfirmed();
      onClose();
    } catch {
      setError('Error al confirmar. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!mailImport) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDebt ? 'Registrar como deuda' : 'Confirmar gasto'}
    >
      <div className="space-y-4">
        {/* Mail info summary */}
        <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-4 text-sm space-y-1">
          <p className="font-medium text-stone-900 dark:text-stone-50">
            {mailImport.parsedMerchant || mailImport.senderEntity || mailImport.fromAddress}
          </p>
          {mailImport.parsedAmount != null && (
            <p className="text-stone-600 dark:text-stone-400 font-semibold">
              {mailImport.parsedCurrencySymbol} {mailImport.parsedAmount.toLocaleString('es-AR')}
            </p>
          )}
          {mailImport.subject && (
            <p className="text-stone-400 dark:text-stone-500 text-xs truncate">{mailImport.subject}</p>
          )}
        </div>

        {/* Debt notice */}
        {isDebt && (
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-300">Pago con tarjeta de crédito</p>
              <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                Se registrará como deuda personal con acreedor: <strong>{mailImport.senderEntity}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Fecha
          </label>
          <input
            type="date"
            className="input-field"
            value={form.date ?? ''}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
            Descripción (opcional)
          </label>
          <input
            type="text"
            className="input-field"
            placeholder={mailImport.parsedMerchant || mailImport.subject || 'Descripción'}
            value={form.description || ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        {/* Category — only for non-debt */}
        {!isDebt && (
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Categoría *
            </label>
            <CategoryPicker
              categories={categories}
              value={categories.find(c => c.id === form.categoryId)}
              onChange={cat => setForm(f => ({ ...f, categoryId: cat.id }))}
            />
          </div>
        )}

        {/* Payment method */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            {isDebt ? 'Tarjeta / método de pago (opcional)' : 'Método de pago (opcional)'}
          </label>
          <PaymentMethodWithEntityPicker
            paymentMethods={paymentMethods}
            value={paymentMethods.find(pm => pm.id === form.paymentMethodId)}
            onChange={pm => setForm(f => ({ ...f, paymentMethodId: pm?.id }))}
            optional
          />
        </div>

        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button className="btn btn-secondary flex-1" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className="btn btn-primary flex-1"
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
          >
            {loading ? 'Guardando...' : isDebt ? 'Registrar deuda' : 'Confirmar gasto'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
