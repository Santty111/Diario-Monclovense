/**
 * ZoomController - Motor de Pan & Zoom interactivo de alta resolución
 * Permite examinar detalles minúsculos de documentos escaneados (caligrafía,
 * grabados, anotaciones) con navegación panorámica, rueda de ratón, pinch-to-zoom y minimapa.
 */
export class ZoomController {
  constructor(options = {}) {
    this.container = options.container; // Contenedor del visor de zoom
    this.viewport = options.viewport;   // Área visible
    this.content = options.content;     // Elemento transformado (imagen o contenedor)
    this.minimap = options.minimap;     // Contenedor del minimapa
    this.minimapImg = options.minimapImg;
    this.minimapRect = options.minimapRect;
    this.onClose = options.onClose || (() => {});

    // Estado del visor
    this.scale = 1.0;
    this.minScale = 0.8;
    this.maxScale = 4.5;
    this.translateX = 0;
    this.translateY = 0;

    // Estado de arrastre (Pan)
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    // Estado de toque (Pinch)
    this.touchStartDist = 0;
    this.startScale = 1;

    this.isActive = false;
    this.currentImageSrc = '';

    this._bindEvents();
  }

  /**
   * Abre el modo de inspección con una imagen de alta resolución específica
   */
  open(imageSrc, pageTitle = '') {
    this.currentImageSrc = imageSrc;
    this.scale = 1.25; // Nivel de zoom inicial cómodo
    this.translateX = 0;
    this.translateY = 0;
    this.isActive = true;

    if (this.content) {
      this.content.src = imageSrc;
    }
    if (this.minimapImg) {
      this.minimapImg.src = imageSrc;
    }

    if (this.container) {
      this.container.classList.remove('hidden');
      this.container.setAttribute('aria-hidden', 'false');
    }

    const titleEl = document.getElementById('zoom-page-title');
    if (titleEl) {
      titleEl.textContent = pageTitle || 'Inspección de Documento';
    }

    this._updateTransform();
    this._updateMinimap();
  }

  /**
   * Cierra el modo de zoom y retorna al flipbook
   */
  close() {
    this.isActive = false;
    if (this.container) {
      this.container.classList.add('hidden');
      this.container.setAttribute('aria-hidden', 'true');
    }
    this.onClose();
  }

  /**
   * Modifica el nivel de escala
   */
  zoomBy(factor, clientX = null, clientY = null) {
    const oldScale = this.scale;
    let newScale = this.scale * factor;
    newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));

    if (clientX !== null && clientY !== null && this.viewport) {
      const rect = this.viewport.getBoundingClientRect();
      const originX = clientX - rect.left - rect.width / 2;
      const originY = clientY - rect.top - rect.height / 2;

      this.translateX -= (originX - this.translateX) * (newScale / oldScale - 1);
      this.translateY -= (originY - this.translateY) * (newScale / oldScale - 1);
    }

    this.scale = newScale;
    this._constrainBounds();
    this._updateTransform();
    this._updateMinimap();
  }

  /**
   * Restablece el zoom a 100% centrado
   */
  resetZoom() {
    this.scale = 1.0;
    this.translateX = 0;
    this.translateY = 0;
    this._updateTransform();
    this._updateMinimap();
  }

  /**
   * Ajusta los límites de desplazamiento para no perder el documento de vista
   */
  _constrainBounds() {
    if (!this.viewport || !this.content) return;
    const vRect = this.viewport.getBoundingClientRect();
    const maxBoundX = (vRect.width * this.scale) / 2;
    const maxBoundY = (vRect.height * this.scale) / 2;

    this.translateX = Math.max(-maxBoundX, Math.min(maxBoundX, this.translateX));
    this.translateY = Math.max(-maxBoundY, Math.min(maxBoundY, this.translateY));
  }

  /**
   * Aplica la matriz de transformación 3D acelerada por GPU
   */
  _updateTransform() {
    if (!this.content) return;
    this.content.style.transform = `translate3d(${this.translateX}px, ${this.translateY}px, 0px) scale(${this.scale})`;
    
    // Actualizar indicador de nivel de zoom en UI
    const zoomLevelBadge = document.getElementById('zoom-percentage-badge');
    if (zoomLevelBadge) {
      zoomLevelBadge.textContent = `${Math.round(this.scale * 100)}%`;
    }
  }

  /**
   * Actualiza el marco rojo del minimapa
   */
  _updateMinimap() {
    if (!this.minimap || !this.minimapRect || !this.viewport) return;
    const mWidth = this.minimap.clientWidth;
    const mHeight = this.minimap.clientHeight;

    const boxW = Math.max(12, Math.min(mWidth, mWidth / this.scale));
    const boxH = Math.max(12, Math.min(mHeight, mHeight / this.scale));

    const normX = -this.translateX / (this.viewport.clientWidth * this.scale || 1);
    const normY = -this.translateY / (this.viewport.clientHeight * this.scale || 1);

    const left = (mWidth - boxW) / 2 + normX * mWidth;
    const top = (mHeight - boxH) / 2 + normY * mHeight;

    this.minimapRect.style.width = `${boxW}px`;
    this.minimapRect.style.height = `${boxH}px`;
    this.minimapRect.style.transform = `translate3d(${Math.max(0, Math.min(mWidth - boxW, left))}px, ${Math.max(0, Math.min(mHeight - boxH, top))}px, 0)`;
  }

  /**
   * Enlaza eventos de ratón, rueda, teclado y gestos táctiles
   */
  _bindEvents() {
    if (!this.viewport) return;

    // 1. Rueda del ratón para zoom fluido
    this.viewport.addEventListener('wheel', (e) => {
      if (!this.isActive) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1.15 : 0.87;
      this.zoomBy(delta, e.clientX, e.clientY);
    }, { passive: false });

    // 2. Arrastre con ratón (Pan)
    this.viewport.addEventListener('mousedown', (e) => {
      if (!this.isActive || e.button !== 0) return;
      this.isDragging = true;
      this.startX = e.clientX - this.translateX;
      this.startY = e.clientY - this.translateY;
      this.viewport.classList.add('grabbing');
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isActive || !this.isDragging) return;
      this.translateX = e.clientX - this.startX;
      this.translateY = e.clientY - this.startY;
      this._constrainBounds();
      this._updateTransform();
      this._updateMinimap();
    });

    window.addEventListener('mouseup', () => {
      if (!this.isActive || !this.isDragging) return;
      this.isDragging = false;
      this.viewport.classList.remove('grabbing');
    });

    // 3. Gestos táctiles (Pinch to Zoom & Touch Pan)
    this.viewport.addEventListener('touchstart', (e) => {
      if (!this.isActive) return;
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX - this.translateX;
        this.startY = e.touches[0].clientY - this.translateY;
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.touchStartDist = Math.hypot(dx, dy);
        this.startScale = this.scale;
      }
    }, { passive: true });

    this.viewport.addEventListener('touchmove', (e) => {
      if (!this.isActive) return;
      if (e.touches.length === 1 && this.isDragging) {
        this.translateX = e.touches[0].clientX - this.startX;
        this.translateY = e.touches[0].clientY - this.startY;
        this._constrainBounds();
        this._updateTransform();
        this._updateMinimap();
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (this.touchStartDist > 0) {
          const factor = dist / this.touchStartDist;
          this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.startScale * factor));
          this._constrainBounds();
          this._updateTransform();
          this._updateMinimap();
        }
      }
    }, { passive: true });

    this.viewport.addEventListener('touchend', (e) => {
      if (!this.isActive) return;
      if (e.touches.length < 2) this.touchStartDist = 0;
      if (e.touches.length === 0) this.isDragging = false;
    });

    // 4. Teclado en modo zoom (Flechas, +, -, 0, Escape)
    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === '+' || e.key === '=') {
        this.zoomBy(1.2);
      } else if (e.key === '-' || e.key === '_') {
        this.zoomBy(0.83);
      } else if (e.key === '0') {
        this.resetZoom();
      } else if (e.key === 'ArrowUp') {
        this.translateY += 40;
        this._constrainBounds();
        this._updateTransform();
        this._updateMinimap();
      } else if (e.key === 'ArrowDown') {
        this.translateY -= 40;
        this._constrainBounds();
        this._updateTransform();
        this._updateMinimap();
      } else if (e.key === 'ArrowLeft') {
        this.translateX += 40;
        this._constrainBounds();
        this._updateTransform();
        this._updateMinimap();
      } else if (e.key === 'ArrowRight') {
        this.translateX -= 40;
        this._constrainBounds();
        this._updateTransform();
        this._updateMinimap();
      }
    });
  }
}
