# 📊 Paginación y Filtros - Guía de Actualización

## 🎯 Cambios Realizados

He actualizado el frontend para soportar las nuevas funcionalidades del backend:

### 1. ✅ Paginación
Todas las entidades ahora retornan objetos `Page<>` con:
- `content`: Array de elementos
- `totalElements`: Total de registros
- `totalPages`: Total de páginas
- `number`: Página actual
- `size`: Tamaño de página

### 2. 🔍 Filtros Dinámicos
Cada entidad tiene sus propios filtros:

**Categories:**
- `name`: Búsqueda por nombre (parcial)
- `enabled`: true/false (activas/inactivas)
- `isIncome`: true/false (ingresos/gastos)

**PaymentMethods:**
- `name`: Búsqueda por nombre
- `paymentMethodType`: Tipo específico
- `enabled`: true/false

**Expenses:**
- `description`: Búsqueda en descripción
- `minAmountInPesos` / `maxAmountInPesos`: Rango en pesos
- `minAmountInDollars` / `maxAmountInDollars`: Rango en dólares
- `startDate` / `endDate`: Rango de fechas
- `categoryId`: Filtrar por categoría
- `paymentMethodId`: Filtrar por método de pago

### 3. 🆕 Campo `isIncome` en Categories
Las categorías ahora distinguen entre:
- **Gastos** (isIncome = false) 💳
- **Ingresos** (isIncome = true) 💰

## 📝 Archivos Actualizados

### `src/types/index.ts`
```typescript
// Nuevos tipos agregados:
- PageResponse<T>
- CategoryFilter
- PaymentMethodFilter
- ExpenseFilter

// Actualizado:
- Category: agregado campo isIncome
```

### `src/services/api.ts`
```typescript
// Método getAll() actualizado:
getAll(filters?, page?, size?) => PageResponse<T>

// Ahora acepta:
- filters: Objeto con filtros opcionales
- page: Número de página (default: 0)
- size: Tamaño de página (default: 1000)
```

### `src/pages/CategoryList.tsx`
```typescript
// Funcionalidades nuevas:
- Panel de filtros desplegable
- Paginación con botones Anterior/Siguiente
- Filtro por nombre, tipo (ingreso/gasto), estado
- Botón "Limpiar Filtros"
- Contador de resultados totales
```

### `src/components/CategoryForm.tsx`
```typescript
// Campo nuevo:
- Selector de tipo: Gasto / Ingreso
- Ayuda contextual según el tipo seleccionado
```

## 🚀 Próximos Pasos

### Para Payment Methods:
Puedes actualizar `PaymentMethodList.tsx` de forma similar:

```typescript
const [filters, setFilters] = useState<PaymentMethodFilter>({});

// Panel de filtros con:
// - Nombre
// - Tipo de método de pago
// - Estado (enabled)

// Llamada con filtros:
const response = await paymentMethodService.getAll(filters, currentPage, 20);
```

### Para Expenses:
Actualizar `ExpenseList.tsx` con filtros más complejos:

```typescript
const [filters, setFilters] = useState<ExpenseFilter>({});

// Panel de filtros con:
// - Descripción (búsqueda)
// - Rango de fechas (startDate - endDate)
// - Rango de montos (min/max ARS y USD)
// - Selector de Categoría (dropdown)
// - Selector de Método de Pago (dropdown)
```

## 💡 Ejemplo de Uso

### Búsqueda Simple
```typescript
// Buscar categorías que contengan "comida"
setFilters({ name: 'comida' });
```

### Filtros Combinados
```typescript
// Buscar categorías de gastos activas
setFilters({ 
  isIncome: false, 
  enabled: true 
});
```

### Con Paginación
```typescript
// Obtener página 2 de categorías activas
const response = await categoryService.getAll(
  { enabled: true }, 
  1,  // página 2 (0-indexed)
  20  // 20 items por página
);
```

## ⚙️ Configuración del Backend

Asegúrate que Spring Boot tenga:

```java
@GetMapping
public ResponseEntity<?> list(
    @ModelAttribute CategoryFilterDTO filters,
    Pageable pageable
) {
    Page<CategoryDTO> categories = service.list(filters, pageable);
    return ResponseEntity.ok(categories);
}
```

El frontend automáticamente agrega:
- `?page=0&size=20&sort=id,desc`
- `&name=valor&enabled=true` (etc, según filtros)

## 🎨 UI de Filtros

Los filtros se muestran en un panel desplegable con:
- ✅ Botón "Mostrar/Ocultar" para ahorrar espacio
- ✅ Grid responsivo (3 columnas en desktop, 1 en móvil)
- ✅ Botón "Limpiar Filtros" para resetear
- ✅ Los filtros se aplican automáticamente al cambiar

## 🔄 Flujo Completo

1. Usuario aplica filtros → `setFilters()`
2. `useEffect` detecta cambio → llama `loadData()`
3. `loadData()` llama `service.getAll(filters, page, size)`
4. Backend retorna `Page<DTO>`
5. Frontend actualiza tabla y paginación

---

¡El sistema de paginación y filtros está listo para usar! 🎉
