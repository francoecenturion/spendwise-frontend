# React + TypeScript Frontend para Spring Boot CRUD

Frontend moderno en React con TypeScript para conectar con tu API REST de Spring Boot.

## 🚀 Características

- ✅ CRUD completo (Crear, Leer, Actualizar, Eliminar)
- 🔷 **TypeScript** para type safety y mejor DX
- 🎨 Diseño moderno con Tailwind CSS
- 📱 Responsive y mobile-friendly
- ⚡ Vite para desarrollo rápido
- 🔄 React Router para navegación
- 📡 Axios para llamadas API con tipos
- 🎭 Componentes reutilizables tipados (Modal, Table, Form)

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Tu backend Spring Boot corriendo en `http://localhost:8080`

## 🛠️ Instalación

1. **Instala las dependencias:**
```bash
npm install
```

2. **Configura tu modelo de datos:**

Edita `src/types/index.ts` y define tu interfaz:

```typescript
export interface Item {
  id?: number;
  name: string;
  description: string;
  price?: number;      // Agrega tus campos
  category?: string;
  stock?: number;
  createdAt?: string;
}
```

3. **Configura tu backend:**

Edita `src/services/api.ts` y cambia el nombre del recurso:

```typescript
// Cambia 'items' por el nombre de tu endpoint
export const itemService = createCrudService<Item>('items');

// Si tu API Spring Boot tiene el endpoint /api/products, usa:
export const productService = createCrudService<Product>('products');
```

4. **Configura CORS en Spring Boot:**

Agrega esta configuración en tu backend:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*");
    }
}
```

## 🏃‍♂️ Ejecutar el Proyecto

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🎯 Personalización

### 1. Cambiar los campos del formulario

Edita `src/components/CategoryForm.tsx`:

```typescript
const [formData, setFormData] = useState<Item>({
  name: '',
  description: '',
  price: 0,        // Agrega tus campos
  category: '',
  stock: 0,
});
```

Y agrega los inputs correspondientes con tipos correctos:

```typescript
<input
  type="number"
  id="price"
  name="price"
  value={formData.price || 0}
  onChange={(e) => setFormData(prev => ({
    ...prev,
    price: parseFloat(e.target.value)
  }))}
  className="input-field"
/>
```

### 2. Cambiar las columnas de la tabla

Edita `src/pages/CategoryList.tsx`:

```typescript
const columns: TableColumn<Item>[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Nombre' },
  { 
    key: 'price', 
    label: 'Precio', 
    render: (value: number) => `$${value.toFixed(2)}` 
  },
  { 
    key: 'createdAt', 
    label: 'Fecha', 
    render: (value: string) => new Date(value).toLocaleDateString() 
  },
];
```

### 3. Agregar nuevos recursos

1. Define la interfaz en `src/types/index.ts`:
```typescript
export interface Product {
  id?: number;
  name: string;
  price: number;
  stock: number;
}
```

2. Crea un servicio en `src/services/api.ts`:
```typescript
export const productService = createCrudService<Product>('products');
```

3. Crea una nueva página duplicando `src/pages/CategoryList.tsx`

4. Agrega la ruta en `src/App.tsx`:
```typescript
<Route path="/products" element={<ProductList />} />
```

## 📁 Estructura del Proyecto

```
src/
├── types/              # Definiciones de TypeScript
│   └── index.ts        # Interfaces y tipos
├── components/         # Componentes reutilizables
│   ├── Modal.tsx      # Modal genérico
│   ├── Table.tsx      # Tabla con acciones
│   └── CategoryForm.tsx   # Formulario de item
├── pages/             # Páginas principales
│   └── CategoryList.tsx   # Lista con CRUD completo
├── services/          # Capa de servicios
│   └── api.ts         # Configuración axios y servicios
├── App.tsx            # Componente principal con routing
├── main.tsx           # Entry point
├── vite-env.d.ts      # Tipos de Vite
└── index.css          # Estilos globales
```

## 🔧 Tecnologías Utilizadas

- **React 18** - Framework UI
- **TypeScript 5** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **DM Sans + Fraunces** - Tipografía

## 📝 Endpoints Esperados

El frontend asume que tu backend Spring Boot tiene estos endpoints:

```
GET    /api/items       - Obtener todos → Item[]
GET    /api/items/{id}  - Obtener uno → Item
POST   /api/items       - Crear → Item
PUT    /api/items/{id}  - Actualizar → Item
DELETE /api/items/{id}  - Eliminar → void
```

## 🎨 Ventajas de TypeScript

- ✅ Autocompletado inteligente en el IDE
- ✅ Detección de errores en tiempo de desarrollo
- ✅ Refactoring más seguro
- ✅ Documentación implícita con tipos
- ✅ Mejor mantenibilidad del código

## 🐛 Troubleshooting

**Error de tipos:**
- Ejecuta `npm install` para instalar `@types/react` y `@types/react-dom`
- Verifica que tus interfaces en `types/index.ts` estén correctas

**Error de CORS:**
- Verifica que Spring Boot tenga configurado CORS
- Revisa que el backend esté en `http://localhost:8080`

**No se cargan los datos:**
- Verifica que el backend esté corriendo
- Revisa la consola del navegador para errores
- Verifica el nombre del endpoint en `api.ts`
- Asegúrate de que los tipos coincidan con el backend

**Error 404 en las rutas:**
- Verifica que los endpoints de Spring Boot coincidan
- Revisa que el `@RequestMapping` tenga el prefijo `/api`

## 📦 Build para Producción

```bash
npm run build
```

Los archivos optimizados estarán en `dist/`

TypeScript compilará y verificará los tipos antes de hacer el build.

## 🤝 Mejores Prácticas TypeScript

1. **Define tipos para todo:** Props, estados, respuestas de API
2. **Usa interfaces para objetos:** Más flexibles que types
3. **Evita `any`:** Usa `unknown` si no conoces el tipo
4. **Tipado estricto:** El proyecto viene con `strict: true`
5. **Documentación:** Los tipos documentan tu código automáticamente

---

¡Listo para usar con TypeScript! 🎉
