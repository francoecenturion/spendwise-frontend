# 🚀 Guía Rápida de Inicio (TypeScript)

## Pasos para poner en marcha tu frontend React + TypeScript

### 1️⃣ Instalar dependencias
```bash
npm install
```

### 2️⃣ Definir tu modelo de datos

Abre `src/types/index.ts` y define tu interfaz:

```typescript
export interface Item {
  id?: number;
  name: string;
  description: string;
  // Agrega tus campos aquí con sus tipos
  price?: number;
  stock?: number;
  category?: string;
  createdAt?: string;
}
```

### 3️⃣ Configurar el servicio API

Abre `src/services/api.ts` y cambia el nombre del endpoint:

```typescript
// Si tu endpoint Spring Boot es /api/products:
export const itemService = createCrudService<Item>('products');
```

### 4️⃣ Configurar CORS en Spring Boot

**Copia el archivo `spring-config-example/WebConfig.java` a tu proyecto Spring Boot:**

```
tu-proyecto-spring/
└── src/main/java/com/tuapp/config/
    └── WebConfig.java  ← Copia aquí
```

### 5️⃣ Verificar tu controlador Spring Boot

Tu controlador debe retornar JSON que coincida con tu interfaz TypeScript.

Ejemplo: Si defines `price: number` en TypeScript, Spring Boot debe retornar un número, no un string.

### 6️⃣ Iniciar el backend
```bash
# En tu proyecto Spring Boot
./mvnw spring-boot:run
```

### 7️⃣ Iniciar el frontend
```bash
npm run dev
```

### 8️⃣ Abrir en el navegador
```
http://localhost:3000
```

## ✅ Checklist de Verificación TypeScript

- [ ] Todas las interfaces definidas en `src/types/index.ts`
- [ ] Tipos coinciden entre frontend (TS) y backend (Java)
- [ ] Backend Spring Boot corriendo en http://localhost:8080
- [ ] CORS configurado en Spring Boot
- [ ] npm install ejecutado sin errores de tipos
- [ ] No hay errores de TypeScript en el IDE

## 🎨 Personalización Rápida

### Agregar un campo al formulario

1. **Agrega a la interfaz** (`src/types/index.ts`):
```typescript
export interface Item {
  // ... campos existentes
  price: number;  // Nuevo campo
}
```

2. **Actualiza el estado inicial** (`src/components/CategoryForm.tsx`):
```typescript
const [formData, setFormData] = useState<Item>({
  name: '',
  description: '',
  price: 0,  // Nuevo campo
});
```

3. **Agrega el input** (`src/components/CategoryForm.tsx`):
```typescript
<input
  type="number"
  name="price"
  value={formData.price}
  onChange={handleChange}
  className="input-field"
/>
```

4. **Agrega a la tabla** (`src/pages/CategoryList.tsx`):
```typescript
const columns: TableColumn<Item>[] = [
  // ... columnas existentes
  { 
    key: 'price', 
    label: 'Precio',
    render: (value: number) => `$${value.toFixed(2)}`
  },
];
```

## 🔷 Ventajas de TypeScript

✅ **Autocompletado**: Tu IDE te sugerirá campos disponibles
✅ **Errores tempranos**: Detecta problemas antes de ejecutar
✅ **Refactoring seguro**: Renombra con confianza
✅ **Documentación viva**: Los tipos son la documentación

## ❓ Problemas Comunes con TypeScript

**Error: Property 'X' does not exist on type 'Item'**
- Agrega el campo a la interfaz en `src/types/index.ts`

**Error: Type 'string' is not assignable to type 'number'**
- Verifica que el tipo del campo coincida con tu backend
- Usa `parseInt()` o `parseFloat()` si recibes strings

**Error: Object is possibly 'null'**
- Usa optional chaining: `item?.name`
- O verifica: `if (item) { ... }`

**Los tipos no se actualizan en el IDE**
- Reinicia el servidor TypeScript en tu IDE
- En VSCode: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

---

**¿Necesitas ayuda?** Revisa `README-TS.md` para más detalles sobre TypeScript.
