import { useState, useEffect } from 'react';
import { PaymentMethod, IssuingEntity } from '../types';

interface Props {
  paymentMethods: PaymentMethod[];
  value?: PaymentMethod;
  onChange: (pm: PaymentMethod | undefined) => void;
  emptyMessage?: string;
  optional?: boolean;
}

function getInitialEntityId(value?: PaymentMethod): number | 'none' | null {
  if (!value) return null;
  return value.issuingEntity?.id ?? 'none';
}

export default function PaymentMethodWithEntityPicker({ paymentMethods, value, onChange, emptyMessage, optional }: Props) {
  const [selectedEntityId, setSelectedEntityId] = useState<number | 'none' | null>(() => getInitialEntityId(value));

  // Sync when editing a different item (value.id changes)
  useEffect(() => {
    if (value) setSelectedEntityId(value.issuingEntity?.id ?? 'none');
  }, [value?.id]);

  // Build ordered unique entities from the payment methods list
  const entityMap = new Map<number | 'none', IssuingEntity | undefined>();
  paymentMethods.forEach(pm => {
    const key = pm.issuingEntity?.id ?? 'none';
    if (!entityMap.has(key)) entityMap.set(key, pm.issuingEntity);
  });
  const entities = Array.from(entityMap.entries());

  const filteredPMs = selectedEntityId === null
    ? []
    : paymentMethods.filter(pm =>
        selectedEntityId === 'none'
          ? !pm.issuingEntity?.id
          : pm.issuingEntity?.id === selectedEntityId
      );

  if (paymentMethods.length === 0) {
    return (
      <p className="text-sm text-amber-600 dark:text-amber-400">
        {emptyMessage ?? '⚠️ No hay métodos de pago activos. Creá uno primero.'}
      </p>
    );
  }

  const handleEntitySelect = (entityId: number | 'none') => {
    if (selectedEntityId === entityId) return;
    setSelectedEntityId(entityId);
    onChange(undefined);
  };

  return (
    <div className="space-y-3">

      {/* Step 1: Entity icons only */}
      <div className="flex flex-wrap gap-2">
        {entities.map(([entityId, entity]) => {
          const active = selectedEntityId === entityId;
          return (
            <button
              key={String(entityId)}
              type="button"
              onClick={() => handleEntitySelect(entityId)}
              title={entity?.description ?? 'Sin entidad'}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-150 ${
                active
                  ? 'ring-2 ring-teal-600 ring-offset-2 dark:ring-offset-stone-900 scale-110 shadow-md bg-teal-700 dark:bg-teal-600'
                  : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {entity?.icon ? (
                <span className="text-xl leading-none">{entity.icon}</span>
              ) : (
                <span className={`text-xs font-bold ${active ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`}>
                  GEN
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Step 2: Filtered payment methods */}
      {selectedEntityId !== null && (
        filteredPMs.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No hay métodos de pago para esta entidad.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {optional && (
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  !value
                    ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                Ninguno
              </button>
            )}
            {filteredPMs.map(pm => {
              const selected = value?.id === pm.id;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => onChange(pm)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    selected
                      ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {pm.icon && <span className="text-base leading-none">{pm.icon}</span>}
                  <span>{pm.name}</span>
                </button>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
