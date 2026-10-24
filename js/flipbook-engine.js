/**
 * FlipbookEngine - Adaptador y orquestador de PageFlip (StPageFlip)
 * Maneja modos de vista adaptables (doble página / spread para PC y página simple para móvil),
 * física de volteo realista, eventos de sonido y dimensionamiento responsivo.
 */
export class FlipbookEngine {
  constructor(options = {}) {
    this.container = options.container;
    this.audioFX = options.audioFX;
    this.pageFlip = null;
    this.pages = []; // URLs de imágenes
    this.pageMetadata = [];

    this.currentPage = 0;
    this.totalPages = 0;
    this.viewMode = 'auto'; // 'auto' | 'double' | 'single'
    this.currentOrientation = 'landscape'; // 'portrait' | 'landscape'

    this.onPageChange = options.onPageChange || (() => {});
    this.onInit = options.onInit || (() => {});

    this.resizeObserver = null;
    this._isInitializing = false;
  }

  /**
   * Inicializa o recarga el flipbook con una lista de páginas
   * @param {Array<{url: string, name?: string}>} pagesList
   */
  async loadBook(pagesList) {
    if (!pagesList || pagesList.length === 0) return;

    let processed = [...pagesList];
    // Asegurar que el total sea par para que la contraportada quede siempre como página única cerrada al final
    if (processed.length > 1 && processed.length % 2 !== 0) {
      const lastPage = processed[processed.length - 1];
      const endpaper = {
        name: 'Guardas Interiores',
        url: processed[0].url,
        width: lastPage.width || 1200,
        height: lastPage.height || 1600,
        rotation: 0
      };
      processed.splice(processed.length - 1, 0, endpaper);
    }

    this.pageMetadata = processed;
    this.pages = processed.map(p => (typeof p === 'string' ? p : p.url));
    this.totalPages = this.pages.length;

    await this._initPageFlip();
  }

  /**
   * Crea la instancia de PageFlip calculando las dimensiones óptimas
   */
  async _initPageFlip() {
    if (this._isInitializing) return;
    this._isInitializing = true;

    // Destruir instancia previa si existe
    if (this.pageFlip) {
      try {
        this.pageFlip.destroy();
      } catch (e) {
        console.warn('Error al destruir instancia anterior de PageFlip', e);
      }
      this.pageFlip = null;
    }

    // Limpiar contenedor
    this.container.innerHTML = '';
    const bookElement = document.createElement('div');
    bookElement.id = 'flipbook-canvas-target';
    bookElement.className = 'flipbook-book';
    this.container.appendChild(bookElement);

    // Calcular dimensiones óptimas del contenedor
    const dims = this._calculateDimensions();

    const PageFlipClass = window.St ? window.St.PageFlip : null;
    if (!PageFlipClass) {
      console.error('Librería St.PageFlip no encontrada en window.St');
      this._isInitializing = false;
      return;
    }

    const usePortrait = this.viewMode === 'single' || (this.viewMode === 'auto' && dims.isPortrait);

    this.pageFlip = new PageFlipClass(bookElement, {
      width: dims.pageWidth,
      height: dims.pageHeight,
      size: 'stretch',
      minWidth: Math.round(dims.pageWidth * 0.5),
      maxWidth: Math.round(dims.pageWidth * 1.6),
      minHeight: Math.round(dims.pageHeight * 0.5),
      maxHeight: Math.round(dims.pageHeight * 1.6),
      drawShadow: true,
      flippingTime: 750,
      usePortrait: usePortrait,
      startPage: Math.min(this.currentPage, this.pages.length - 1),
      maxShadowOpacity: 0.65,
      showCover: true,
      mobileScrollSupport: false,
      swipeDistance: 25,
      clickEventForward: true,
      useMouseEvents: true,
      showPageCorners: true
    });

    // Cargar páginas de imagen
    this.pageFlip.loadFromImages(this.pages);

    // Enlazar eventos de PageFlip
    this.pageFlip.on('init', (e) => {
      this._isInitializing = false;
      this.currentOrientation = e.data.mode;
      this.currentPage = e.data.page;
      this._syncState();
      this.onInit({
        currentPage: this.currentPage,
        totalPages: this.totalPages,
        mode: this.currentOrientation
      });
    });

    this.pageFlip.on('flip', (e) => {
      this.currentPage = e.data;
      if (this.audioFX) {
        this.audioFX.playPageTurn();
      }
      this._syncState();
      this.onPageChange({
        currentPage: this.currentPage,
        totalPages: this.totalPages,
        mode: this.currentOrientation
      });
    });

    this.pageFlip.on('changeOrientation', (e) => {
      this.currentOrientation = e.data;
      this._syncState();
    });

    // Observar redimensionamiento del viewport
    if (!this.resizeObserver) {
      let resizeTimeout;
      this.resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this._handleResize();
        }, 200);
      });
      this.resizeObserver.observe(this.container);
    }
  }

  /**
   * Calcula el ancho y alto óptimo de página para mantener la relación de aspecto
   * ocupando el máximo espacio visible sin desbordar el contenedor.
   */
  _calculateDimensions() {
    const cWidth = this.container.clientWidth || window.innerWidth;
    const cHeight = this.container.clientHeight || (window.innerHeight - 120);

    const isPortrait = cWidth < 768 || cWidth < cHeight * 1.15;
    const isSinglePage = this.viewMode === 'single' || (this.viewMode === 'auto' && isPortrait);

    // Relación de aspecto estándar para documentos escaneados (3:4 o ~0.72)
    const pageAspect = 0.72; // width / height

    let pageHeight, pageWidth;

    if (isSinglePage) {
      // 1 página ocupa el ancho/alto disponible con márgenes
      const availWidth = cWidth * 0.94;
      const availHeight = cHeight * 0.92;

      if (availWidth / availHeight < pageAspect) {
        pageWidth = Math.floor(availWidth);
        pageHeight = Math.floor(pageWidth / pageAspect);
      } else {
        pageHeight = Math.floor(availHeight);
        pageWidth = Math.floor(pageHeight * pageAspect);
      }
    } else {
      // 2 páginas lado a lado (Spread abierto)
      const availWidth = cWidth * 0.95;
      const availHeight = cHeight * 0.90;

      // 2 páginas de ancho combinadas
      if (availWidth / availHeight < pageAspect * 2) {
        pageWidth = Math.floor(availWidth / 2);
        pageHeight = Math.floor(pageWidth / pageAspect);
      } else {
        pageHeight = Math.floor(availHeight);
        pageWidth = Math.floor(pageHeight * pageAspect);
      }
    }

    return {
      pageWidth: Math.max(300, pageWidth),
      pageHeight: Math.max(400, pageHeight),
      isPortrait: isPortrait,
      isSinglePage: isSinglePage
    };
  }

  _handleResize() {
    if (!this.pageFlip || this._isInitializing) return;
    const dims = this._calculateDimensions();
    const shouldBePortrait = this.viewMode === 'single' || (this.viewMode === 'auto' && dims.isPortrait);

    if (shouldBePortrait !== (this.currentOrientation === 'portrait')) {
      // Cambio de orientación necesario (móvil vs escritorio)
      this._initPageFlip();
    } else {
      try {
        this.pageFlip.update();
      } catch (e) {}
    }
  }

  _syncState() {
    const isSpread = this.currentOrientation !== 'portrait' && this.viewMode !== 'single';
    const isFirst = this.currentPage === 0;
    const isLast = this.currentPage >= this.totalPages - 1;

    // Sincronizar clases de estado cerrado (portada/contraportada) en contenedor y stage
    const stageWrapper = document.getElementById('flipbook-stage-wrapper');
    if (this.container) {
      this.container.classList.remove('is-cover', 'is-back-cover', 'is-open');
      if (stageWrapper) {
        stageWrapper.classList.remove('stage-cover', 'stage-back-cover', 'stage-open');
      }

      if (isSpread) {
        if (isFirst) {
          this.container.classList.add('is-cover');
          if (stageWrapper) stageWrapper.classList.add('stage-cover');
        } else if (isLast) {
          this.container.classList.add('is-back-cover');
          if (stageWrapper) stageWrapper.classList.add('stage-back-cover');
        } else {
          this.container.classList.add('is-open');
          if (stageWrapper) stageWrapper.classList.add('stage-open');
        }
      } else {
        if (stageWrapper) stageWrapper.classList.add('stage-open');
      }
    }

    // Actualizar botones de navegación anterior/siguiente
    const prevBtn = document.getElementById('btn-nav-prev');
    const nextBtn = document.getElementById('btn-nav-next');
    if (prevBtn) prevBtn.disabled = isFirst;
    if (nextBtn) nextBtn.disabled = isLast;
  }

  flipNext() {
    if (!this.pageFlip) return;
    this.pageFlip.flipNext('bottom');
  }

  flipPrev() {
    if (!this.pageFlip) return;
    this.pageFlip.flipPrev('bottom');
  }

  goToPage(index) {
    if (!this.pageFlip) return;
    const target = Math.max(0, Math.min(this.totalPages - 1, index));
    this.pageFlip.flip(target);
  }

  jumpToPage(index) {
    if (!this.pageFlip) return;
    const target = Math.max(0, Math.min(this.totalPages - 1, index));
    this.pageFlip.turnToPage(target);
    this.currentPage = target;
    this._syncState();
  }

  setViewMode(mode) {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this._initPageFlip();
  }

  getCurrentPage() {
    return this.currentPage;
  }

  getTotalPages() {
    return this.totalPages;
  }

  getCurrentImageSrc() {
    return this.pages[this.currentPage] || '';
  }

  getCurrentMetadata() {
    return this.pageMetadata[this.currentPage] || null;
  }
}
