import { useState, useEffect } from 'react';
import { paymentMethodService } from '../services/api';
import Table from '../components/Table.tsx';
import Modal from '../components/Modal.tsx';
import PaymentMethodForm from '../components/PaymentMethodForm.tsx';
import { PaymentMethod, TableColumn, PaymentMethodType } from '../types';

export default function PaymentMethodList() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<PaymentMethod | null>(null);

  const paymentTypeLabels: Record<PaymentMethodType, string> = {
    [PaymentMethodType.CREDIT_CARD_VISA]: 'Visa',
    [PaymentMethodType.CREDIT_CARD_MASTERCARD]: 'Mastercard',
    [PaymentMethodType.CREDIT_CARD_AMERICAN_EXPRESS]: 'American Express',
    [PaymentMethodType.DEBIT_CARD]: 'Débito',
    [PaymentMethodType.CASH]: 'Efectivo',
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case PaymentMethodType.CREDIT_CARD_VISA:
      case PaymentMethodType.CREDIT_CARD_MASTERCARD:
      case PaymentMethodType.CREDIT_CARD_AMERICAN_EXPRESS:
        return '💳';
      case PaymentMethodType.DEBIT_CARD:
        return '🏦';
      case PaymentMethodType.CASH:
        return '💵';
      default:
        return '💰';
    }
  };

  const columns: TableColumn<PaymentMethod>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nombre' },
    { 
      key: 'paymentMethodType', 
      label: 'Tipo',
      render: (value: string) => (
        <span className="inline-flex items-center gap-2">
          <span className="text-lg">{getPaymentTypeIcon(value)}</span>
          <span>{paymentTypeLabels[value as PaymentMethodType] || value}</span>
        </span>
      )
    },
    { 
      key: 'enabled', 
      label: 'Estado',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
  ];

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await paymentMethodService.getAll();
      setPaymentMethods(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los métodos de pago. Verifica que el backend esté corriendo.');
      console.error('Error loading payment methods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (): void => {
    setSelectedPaymentMethod(null);
    setIsModalOpen(true);
  };

  const handleEdit = (paymentMethod: PaymentMethod): void => {
    setSelectedPaymentMethod(paymentMethod);
    setIsModalOpen(true);
  };

  const handleDelete = (paymentMethod: PaymentMethod): void => {
    setPaymentMethodToDelete(paymentMethod);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!paymentMethodToDelete?.id) return;
    
    try {
      await paymentMethodService.delete(paymentMethodToDelete.id);
      setPaymentMethods(paymentMethods.filter(pm => pm.id !== paymentMethodToDelete.id));
      setIsDeleteModalOpen(false);
      setPaymentMethodToDelete(null);
    } catch (err) {
      console.error('Error deleting payment method:', err);
      alert('Error al eliminar el método de pago');
    }
  };

  const handleSubmit = async (formData: PaymentMethod): Promise<void> => {
    try {
      if (selectedPaymentMethod?.id) {
        const updated = await paymentMethodService.update(selectedPaymentMethod.id, formData);
        setPaymentMethods(paymentMethods.map(pm => pm.id === selectedPaymentMethod.id ? updated : pm));
      } else {
        const created = await paymentMethodService.create(formData);
        setPaymentMethods([...paymentMethods, created]);
      }
      setIsModalOpen(false);
      setSelectedPaymentMethod(null);
    } catch (err) {
      console.error('Error saving payment method:', err);
      alert('Error al guardar el método de pago');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-stone-900 mb-2">Métodos de Pago</h1>
          <p className="text-stone-600">Administra tus tarjetas y formas de pago</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 animate-fade-in">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <div className="text-sm text-stone-600">
            Total: <span className="font-semibold text-stone-900">{paymentMethods.length}</span> métodos
          </div>
          <button onClick={handleCreate} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Método
            </span>
          </button>
        </div>

        <div className="card animate-fade-in">
          <Table
            columns={columns}
            data={paymentMethods}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedPaymentMethod ? 'Editar Método de Pago' : 'Crear Método de Pago'}
        >
          <PaymentMethodForm
            paymentMethod={selectedPaymentMethod}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>

        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirmar Eliminación"
        >
          <div className="space-y-4">
            <p className="text-stone-600">
              ¿Estás seguro de que deseas eliminar <span className="font-semibold">{paymentMethodToDelete?.name}</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-4">
              <button onClick={confirmDelete} className="btn btn-danger flex-1">
                Eliminar
              </button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
