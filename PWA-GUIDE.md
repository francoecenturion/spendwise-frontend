# 📱 SpendWise - PWA (Progressive Web App)

## ✨ Características del Menú Lateral

- ✅ **Diseño lateral** - Menú fijo en escritorio, overlay en móvil
- ✅ **Responsive** - Se adapta perfectamente a móviles y tablets
- ✅ **Navegación fluida** - Transiciones suaves
- ✅ **Estado activo** - Resalta la sección actual
- ✅ **PWA Ready** - Instalable como app nativa

## 📱 Instalar como PWA

### En Android (Chrome):
1. Abre la app en Chrome
2. Toca el menú (⋮) → "Agregar a pantalla de inicio"
3. Confirma y listo - tendrás un ícono en tu home

### En iOS (Safari):
1. Abre la app en Safari
2. Toca el botón "Compartir" 
3. Selecciona "Agregar a pantalla de inicio"
4. Confirma

### En Desktop (Chrome/Edge):
1. Ve a la URL de la app
2. Busca el ícono de instalación en la barra de direcciones
3. Haz clic en "Instalar"

## 🎨 Estructura del Menú

El sidebar incluye:
- **Logo** - SpendWise en la parte superior
- **Navegación** - Categorías, Gastos, Presupuesto, Reportes
- **Perfil** - Usuario en la parte inferior

## 📐 Layout Responsivo

### Desktop (lg: > 1024px)
- Sidebar fijo de 256px (16rem)
- Contenido principal con margen izquierdo
- Sin botón de menú hamburguesa

### Móvil (< 1024px)
- Sidebar oculto por defecto
- Botón hamburguesa flotante (top-left)
- Overlay oscuro al abrir
- Sidebar deslizable desde la izquierda

## 🎯 Navegación

Secciones actuales:
- **Categorías** (`/`) - Gestión de categorías
- **Gastos** (`/expenses`) - Próximamente
- **Presupuesto** (`/budget`) - Próximamente
- **Reportes** (`/reports`) - Próximamente

## 🔧 Personalizar el Menú

Para agregar nuevas secciones, edita `src/components/Sidebar.tsx`:

```typescript
const navItems: NavItem[] = [
  // ... items existentes
  {
    name: 'Nueva Sección',
    path: '/nueva-seccion',
    icon: (
      <svg>...</svg> // Tu ícono aquí
    )
  },
];
```

Luego agrega la ruta en `src/App.tsx`:

```typescript
<Route path="/nueva-seccion" element={<NuevaSeccion />} />
```

## 📦 Archivos PWA

- `public/manifest.json` - Configuración de la PWA
- `public/service-worker.js` - Cache offline
- `index.html` - Meta tags de PWA
- `public/icon-192.png` - Ícono pequeño (necesitas crearlo)
- `public/icon-512.png` - Ícono grande (necesitas crearlo)

## 🎨 Crear los Íconos

Necesitas crear dos íconos PNG para la PWA:

1. **icon-192.png** - 192x192px
2. **icon-512.png** - 512x512px

Puedes usar herramientas como:
- [Figma](https://figma.com)
- [Canva](https://canva.com)
- [favicon.io](https://favicon.io/)

Diseño sugerido:
- Fondo: `#1c1917` (stone-900)
- Texto: `SW` en blanco
- Tipografía: Bold, centrado

## 🚀 Testing PWA

Para probar que la PWA funciona:

1. **Chrome DevTools**:
   - Abre DevTools (F12)
   - Ve a la pestaña "Application"
   - Revisa "Manifest" y "Service Workers"

2. **Lighthouse**:
   - DevTools → Lighthouse
   - Ejecuta un audit de PWA
   - Debería obtener 100 puntos

## 📱 Funcionalidades Offline

El Service Worker cachea:
- Página principal
- CSS y JavaScript
- Recursos estáticos

**Próximamente:**
- Cache de datos de la API
- Sync en segundo plano
- Notificaciones push

## 🎯 Ventajas de la PWA

✅ **Instalación rápida** - Sin App Store
✅ **Peso liviano** - Menos de 1MB
✅ **Actualizaciones automáticas** - Sin descargas
✅ **Funciona offline** - Datos cacheados
✅ **Look nativo** - Sin barra del navegador
✅ **Notificaciones** - Push notifications (próximamente)

---

¡Disfruta de SpendWise como una app nativa! 📱✨
