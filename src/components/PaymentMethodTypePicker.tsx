import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { PaymentMethod, PaymentMethodType, IssuingEntity } from '../types';

interface Props {
  paymentMethods: PaymentMethod[];
  value?: PaymentMethod;
  onChange: (pm: PaymentMethod | undefined) => void;
  onSetDefault?: (pm: PaymentMethod) => void;
  emptyMessage?: string;
}

const TYPE_OPTIONS: { type: PaymentMethodType; label: string }[] = [
  { type: PaymentMethodType.QR, label: 'QR' },
  { type: PaymentMethodType.TRANSFER, label: 'Transferencia' },
  { type: PaymentMethodType.CASH, label: 'Efectivo' },
  { type: PaymentMethodType.DEBIT_CARD, label: 'Débito' },
  { type: PaymentMethodType.CREDIT_CARD, label: 'Crédito' },
];

interface EntityGroup {
  entity?: IssuingEntity;
  pm: PaymentMethod;
}

export default function PaymentMethodTypePicker({ paymentMethods, value, onChange, onSetDefault, emptyMessage }: Props) {
  const [selectedType, setSelectedType] = useState<PaymentMethodType | null>(
    (value?.paymentMethodType as PaymentMethodType) ?? null
  );

  useEffect(() => {
    if (value) setSelectedType(value.paymentMethodType as PaymentMethodType);
  }, [value?.id]);

  if (paymentMethods.length === 0) {
    return (
      <p className="text-sm text-amber-600 dark:text-amber-400">
        {emptyMessage ?? '⚠️ No hay métodos de pago activos. Creá uno primero.'}
      </p>
    );
  }

  // One entry per distinct entity (or "genérico") for a given type — this is the
  // simplification: we don't ask which exact card, just type + entity.
  const uniqueEntityGroups = (type: PaymentMethodType): EntityGroup[] => {
    const seen = new Set<number | 'none'>();
    const groups: EntityGroup[] = [];
    paymentMethods
      .filter(pm => pm.paymentMethodType === type)
      .forEach(pm => {
        const key = pm.issuingEntity?.id ?? 'none';
        if (!seen.has(key)) {
          seen.add(key);
          groups.push({ entity: pm.issuingEntity, pm });
        }
      });
    return groups;
  };

  const handleTypeSelect = (type: PaymentMethodType) => {
    setSelectedType(type);
    const groups = uniqueEntityGroups(type);
    onChange(groups.length === 1 ? groups[0].pm : undefined);
  };

  const entityGroups = selectedType ? uniqueEntityGroups(selectedType) : [];

  return (
    <div className="space-y-4">
      {/* Tipo */}
      <div className="flex flex-wrap justify-center gap-0.5 rounded-full bg-stone-100 dark:bg-stone-800 p-1">
        {TYPE_OPTIONS.map(opt => {
          const active = selectedType === opt.type;
          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => handleTypeSelect(opt.type)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 ${
                active
                  ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Entidad — solo si hay más de una para el tipo elegido */}
      {selectedType && (
        entityGroups.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
            No hay métodos de pago de este tipo. Creá uno primero.
          </p>
        ) : entityGroups.length > 1 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {entityGroups.map(({ entity, pm }) => {
              const selected = value?.id === pm.id;
              return (
                <button
                  key={pm.id ?? entity?.id ?? 'generic'}
                  type="button"
                  title={entity?.description ?? 'Genérico'}
                  onClick={() => onChange(pm)}
                  className="relative flex items-center justify-center p-2 rounded-2xl transition-all duration-150"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform ${
                    selected
                      ? 'ring-2 ring-teal-600 ring-offset-2 dark:ring-offset-stone-900 scale-110 bg-teal-700 dark:bg-teal-600'
                      : 'bg-stone-100 dark:bg-stone-800'
                  }`}>
                    {entity?.icon ? (
                      <img src={entity.icon} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className={`text-xs font-bold ${selected ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`}>
                        {entity?.description ? entity.description.slice(0, 3).toUpperCase() : 'GEN'}
                      </span>
                    )}
                  </div>
                  {onSetDefault && (
                    <span
                      role="button"
                      tabIndex={0}
                      title="Marcar como predeterminado"
                      onClick={e => { e.stopPropagation(); onSetDefault(pm); }}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onSetDefault(pm); } }}
                      className={`absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        pm.isDefault
                          ? 'bg-amber-400 text-white'
                          : 'bg-white dark:bg-stone-900 text-stone-300 dark:text-stone-600 border border-stone-200 dark:border-stone-700 hover:text-amber-400'
                      }`}
                    >
                      <Star size={11} fill={pm.isDefault ? 'currentColor' : 'none'} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : null
      )}
    </div>
  );
}
