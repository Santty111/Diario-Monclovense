# LuminaFlip — Lector Interactivo de Libros y Documentos Escaneados (Flipbook 3D)

**LuminaFlip** es una aplicación web moderna, ultraligera y de alto rendimiento diseñada para la lectura y exploración interactiva de documentos, libros antiguos, revistas, partituras y archivos escaneados. Ofrece una simulación física realista de paso de hoja a 60 FPS acelerada por GPU, compresión de imágenes en el cliente, audio procedural sintetizado y un visor de zoom de alta precisión con minimapa de navegación.

Optimizada y lista para desplegar en **Vercel** con cero tiempo de configuración y máxima puntuación Lighthouse.

---

## ✨ Características Principales

### 1. Subida y Gestión Integral de Páginas
- **Carga en lote multiformato**: Soporta imágenes escaneadas (`JPG`, `PNG`, `WEBP`) y documentos completos en **`PDF`** (extracción automatizada de páginas a alta resolución mediante PDF.js).
- **Zona Drag & Drop intuitiva**: Arrastra archivos directamente al navegador o selecciónalos con un clic.
- **Compresión inteligente en cliente**: Reducción de peso de entre 60% y 85% usando OffscreenCanvas y WebP/JPEG configurable (1800px, 1400px, 1000px u original) sin perder nitidez de texto ni requerir procesamiento en backend.
- **Ordenamiento y reestructuración**:
  - Orden natural numérico (A-Z y Z-A, ej: `pág_1`, `pág_2`, `pág_10`).
  - Inversión de orden y ordenamiento manual arrastrando tarjetas en la rejilla.
  - Rotación individual de 90° para corregir páginas escaneadas vertical u horizontalmente.
  - Duplicación y eliminación ágil con un clic.

### 2. Animación y Física 3D de Paso de Página (Flipbook)
- **Motor StPageFlip / PageFlip**: Animación hiperrealista con curvatura de papel, sombras interiores y exteriores dinámicas y arrastre interactivo desde cualquier esquina con mouse o dedo.
- **Modos de Vista Adaptables**:
  - **PC / Pantallas panorámicas**: Vista de doble página abierta (*spread*) centrada con efecto de lomo (*spine crease*) e iluminación volumétrica.
  - **Móvil / Pantallas verticales**: Vista de página única (*single page*) automática para aprovechar el 100% de la pantalla del dispositivo.
  - **Selector dinámico**: Alterna entre Auto, Doble y Simple en cualquier momento.

### 3. Efectos de Sonido Procedurales (Web Audio API)
- **Sintetizador en tiempo real**: Generación matemática del sonido de fricción de papel y desplazamiento de aire mediante ruido blanco filtrado con barrido paso-banda exponencial y resonancia dinámica.
- **Cero latencia y cero dependencias de red**: No depende de archivos de audio externos que puedan fallar o demorar la carga.
- **Variación orgánica**: Cada paso de hoja tiene micro-variaciones aleatorias de frecuencia y envolvente para un sonido completamente natural.
- **Controles accesibles**: Botón de Mute/Unmute rápido (tecla `M`), control de volumen deslizante y persistencia en `localStorage`.

### 4. Zoom de Alta Precisión & Navegación Panorámica
- **Modo Inspección HD**: Diseñado especialmente para examinar caligrafía antigua, notas al margen y tipografía pequeña.
- **Controles fluidos**: Zoom con rueda del ratón, gestos *pinch-to-zoom* en pantallas táctiles y botones `+` / `−` / `↺`.
- **Minimapa en tiempo real**: Muestra una vista en miniatura con un visor rojo que indica la posición exacta de la cámara.
- **Desplazamiento fluido (Pan)**: Arrastra el documento con el cursor manual (*grab/grabbing*).

### 5. Navegación, Filmstrip y Modo Presentación
- **Cajón de miniaturas (*Filmstrip*)**: Barra inferior deslizante con vista previa de todas las páginas y salto instantáneo con un clic.
- **Modo Auto-reproducir (*Presentation Mode*)**: Paso de página automático con temporizador configurable.
- **Pantalla Completa (*Fullscreen API*)**: Inmersión total con tecla `F` o botón en barra superior.
- **Soporte táctil y teclado**: Swipes móviles, flechas del teclado, espacio y atajos globales.

---

## 🚀 Despliegue en Vercel

La aplicación está lista para desplegarse en Vercel como sitio estático de máxima velocidad (Edge Network) sin necesidad de pasos de compilación complejos.

### Opción A: Despliegue con Vercel CLI (Recomendado)

1. Abre tu terminal en la carpeta del proyecto:
   ```bash
   npm i -g vercel # (si no tienes la CLI)
   vercel
   ```
2. Sigue las instrucciones interactivas:
   - *Set up and deploy?* -> `y`
   - *Which scope?* -> Selecciona tu cuenta
   - *Link to existing project?* -> `N`
   - *What's your project's name?* -> `lumina-flip`
   - *In which directory is your code located?* -> `./`
3. Para publicar en producción:
   ```bash
   vercel --prod
   ```

### Opción B: Despliegue desde GitHub / GitLab / Bitbucket

1. Sube este repositorio a GitHub.
2. Inicia sesión en [vercel.com](https://vercel.com) y haz clic en **"Add New Project"**.
3. Importa tu repositorio `lumina-flip`.
4. En la configuración del proyecto:
   - **Framework Preset**: `Other`
   - **Build Command**: *(Dejar vacío o `npm run build`)*
   - **Output Directory**: `./` *(Directorio raíz)*
5. Haz clic en **"Deploy"**. En segundos tendrás tu URL pública de producción con SSL activo y CDN global.

---

## 💻 Ejecución en Desarrollo Local

Para correr el proyecto localmente con el servidor de desarrollo ligero incluido:

```bash
# Iniciar servidor local en http://localhost:3000
npm start
# o
npm run dev
# o directamente con node
node server.js
```

---

## ⌨️ Atajos de Teclado

| Tecla | Acción |
| :--- | :--- |
| `→` / `Espacio` / `AvPág` | Pasar a la siguiente página |
| `←` / `RePág` | Regresar a la página anterior |
| `Inicio` / `Fin` | Ir a la primera / última página |
| `Z` | Activar / salir del modo Zoom HD |
| `M` | Silenciar / activar sonido de papel |
| `F` | Alternar Pantalla Completa (*Fullscreen*) |
| `+` / `−` / `0` | Acercar / alejar / restablecer nivel de zoom |
| `ESC` | Cerrar cualquier modal o visor de zoom activo |
| `?` | Abrir ayuda interactiva de atajos |

---

## 🏛️ Estructura del Proyecto

```
├── index.html               # Estructura semántica HTML5, metadatos SEO y modales
├── vercel.json              # Configuración de caché, cleanUrls y headers para Vercel
├── package.json             # Metadatos del proyecto y scripts npm
├── server.js                # Servidor HTTP estático nativo para desarrollo
├── css/
│   ├── main.css             # Design System, variables cromáticas y glassmorphism
│   ├── flipbook.css         # Escenario 3D, sombras de lomo e indicadores
│   ├── toolbar.css          # Cabecera, barra inferior flotante y filmstrip
│   ├── manager.css          # Modal de subida, compresión y ordenamiento de páginas
│   └── zoom.css             # Visor panorámico Pan & Zoom con minimapa
├── js/
│   ├── app.js               # Orquestador principal y vinculación de eventos
│   ├── flipbook-engine.js   # Wrapper reactivo de StPageFlip con modos adaptables
│   ├── audio-fx.js          # Síntesis procedural con Web Audio API pura
│   ├── page-manager.js      # Procesamiento en lote, PDF.js y compresión Canvas
│   ├── zoom-controller.js   # Controlador de Pan, Zoom, Pinch y minimapa
│   └── sample-book.js       # Manuscrito renacentista de muestra precargado
├── vendor/
│   ├── page-flip.browser.js # Motor PageFlip vendoreado localmente
│   ├── pdf.min.js           # Extracción y renderizado de PDFs
│   └── pdf.worker.min.js    # Web Worker de PDF.js
└── assets/
    └── sample/              # Imágenes en alta resolución del manuscrito de prueba
```

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).
