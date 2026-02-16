# 🔷 TypeScript vs JavaScript: Lo que cambió

Este proyecto usa **TypeScript** para mayor seguridad y mejor experiencia de desarrollo.

## 📋 Diferencias Principales

### 1. Archivos con extensión `.ts` y `.tsx`

**Antes (JavaScript):**
```
src/App.jsx
src/components/Modal.jsx
src/services/api.js
```

**Ahora (TypeScript):**
```
src/App.tsx
src/components/Modal.tsx
src/services/api.ts
```

### 2. Definición de Tipos e Interfaces

**Nuevo archivo: `src/types/index.ts`**

Define la estructura de tus datos:

```typescript
export interface Item {
  id?: number;        // ? = opcional
  name: string;       // requerido
  description: string;
  price?: number;
}
```

### 3. Componentes con Props Tipadas

**Antes (JavaScript):**
```jsx
export default function Modal({ isOpen, onClose, title, children }) {
  // ...
}
```

**Ahora (TypeScript):**
```tsx
import { ModalProps } from '../types';

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // ...
}
```

### 4. Estados con Tipos Explícitos

**Antes (JavaScript):**
```jsx
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
```

**Ahora (TypeScript):**
```tsx
const [items, setItems] = useState<Item[]>([]);
const [loading, setLoading] = useState<boolean>(true);
```

### 5. Funciones con Tipos de Retorno

**Antes (JavaScript):**
```javascript
const loadItems = async () => {
  const data = await itemService.getAll();
  setItems(data);
};
```

**Ahora (TypeScript):**
```typescript
const loadItems = async (): Promise<void> => {
  const data: Item[] = await itemService.getAll();
  setItems(data);
};
```

### 6. Servicios API Tipados

**Antes (JavaScript):**
```javascript
const createCrudService = (resourceName) => ({
  getAll: async () => {
    const response = await apiClient.get(`/${resourceName}`);
    return response.data;
  },
  // ...
});
```

**Ahora (TypeScript):**
```typescript
const createCrudService = <T>(resourceName: string): CrudService<T> => ({
  getAll: async (): Promise<T[]> => {
    const response: AxiosResponse<T[]> = await apiClient.get(`/${resourceName}`);
    return response.data;
  },
  // ...
});
```

### 7. Event Handlers Tipados

**Antes (JavaScript):**
```jsx
const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};
```

**Ahora (TypeScript):**
```tsx
const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};
```

## 🎯 Beneficios Concretos

### 1. Autocompletado Inteligente

Cuando escribes `item.`, tu IDE te mostrará:
```
item.id
item.name
item.description
item.price
```

### 2. Detección de Errores Temprana

**Sin TypeScript:** Error en runtime ❌
```javascript
const name = item.nombre; // Typo! Pero no lo sabes hasta ejecutar
```

**Con TypeScript:** Error inmediato ✅
```typescript
const name = item.nombre; // ❌ Property 'nombre' does not exist on type 'Item'
```

### 3. Refactoring Seguro

Si cambias el nombre de un campo en la interfaz:
```typescript
export interface Item {
  // name: string;       ❌ Renombrado
  title: string;         ✅ Nuevo nombre
}
```

TypeScript te mostrará **todos los lugares** donde debes actualizar el código.

### 4. Documentación Automática

Los tipos documentan tu código:
```typescript
// Sabes exactamente qué espera esta función
function createItem(item: Item): Promise<Item> {
  // ...
}

// Vs JavaScript - necesitas leer la implementación o documentación
function createItem(item) {
  // ¿Qué campos tiene item? 🤷‍♂️
}
```

### 5. Menos Bugs en Producción

TypeScript detecta:
- ❌ Typos en nombres de propiedades
- ❌ Tipos incorrectos (pasar string donde se espera number)
- ❌ Valores undefined/null no manejados
- ❌ Funciones con argumentos incorrectos

## 📚 Conceptos Clave de TypeScript

### Tipos Primitivos
```typescript
const name: string = "Juan";
const age: number = 25;
const active: boolean = true;
const nothing: null = null;
const notDefined: undefined = undefined;
```

### Arrays
```typescript
const numbers: number[] = [1, 2, 3];
const names: string[] = ["Juan", "Ana"];
const items: Item[] = [item1, item2];
```

### Objetos (Interfaces)
```typescript
interface User {
  id: number;
  name: string;
  email?: string;  // opcional
}
```

### Union Types
```typescript
type Status = 'active' | 'inactive' | 'pending';
const status: Status = 'active';  // ✅
const status: Status = 'deleted'; // ❌ Error!
```

### Genéricos
```typescript
function first<T>(array: T[]): T | undefined {
  return array[0];
}

const num = first([1, 2, 3]);      // num: number | undefined
const str = first(['a', 'b']);     // str: string | undefined
```

## 🛠️ Herramientas TypeScript

### TSConfig (`tsconfig.json`)
Configuración del compilador TypeScript con:
- `strict: true` - Validaciones estrictas
- `noUnusedLocals: true` - Detecta variables sin usar
- `noUnusedParameters: true` - Detecta parámetros sin usar

### Comandos Útiles

```bash
# Compilar TypeScript (verifica errores)
npm run build

# Desarrollo (con hot reload)
npm run dev

# Ver errores de TypeScript en tu IDE
# VSCode: Cmd/Ctrl + Shift + M
```

## 🎓 Tips para Trabajar con TypeScript

1. **Empieza con los tipos**: Define interfaces antes de escribir código
2. **Usa el autocompletado**: Presiona Ctrl+Espacio para ver opciones
3. **Lee los errores**: TypeScript te dice exactamente qué está mal
4. **Evita `any`**: Pierde todos los beneficios de TypeScript
5. **Usa `unknown` si no sabes el tipo**: Más seguro que `any`

## 📖 Recursos para Aprender

- [TypeScript Handbook (oficial)](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

TypeScript puede parecer verboso al principio, pero **te ahorra muchísimo tiempo** detectando errores temprano y mejorando tu experiencia de desarrollo. ¡Dale una oportunidad! 🚀
