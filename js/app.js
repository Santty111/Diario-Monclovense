/**
 * LuminaFlip - Aplicación Principal
 * Coordinador de UI, motor de Flipbook, Audio FX, Gestor de Páginas y Zoom Panorámico.
 */
import { AudioFX } from './audio-fx.js?v=4.2.0';
import { PageManager } from './page-manager.js?v=4.2.0';
import { FlipbookEngine } from './flipbook-engine.js?v=4.2.0';
import { ZoomController } from './zoom-controller.js?v=4.2.0';
import { SAMPLE_PAGES } from './sample-book.js?v=4.2.0';
import { StorageManager } from './storage.js?v=4.2.0';

class LuminaFlipApp {
  constructor() {
    this.audioFX = new AudioFX();
    this.pageManager = new PageManager();
    this.storage = new StorageManager();
    this._toastTimer = null;
    this.flipbook = null;
    this.zoomController = null;

    this.isAutoPlay = false;
    this.autoPlayTimer = null;
    this.autoPlayInterval = 5000;

    this.isFilmstripOpen = false;
  }

  async init() {
    this._initFlipbook();
    this._initZoom();
    this._bindUI();
    this._bindKeyboard();
    await this._loadInitialBook();
  }

  _initFlipbook() {
    const container = document.getElementById('flipbook-stage-container');
    this.flipbook = new FlipbookEngine({
      container: container,
      audioFX: this.audioFX,
      onPageChange: (info) => this._onPageUpdated(info),
      onInit: (info) => this._onPageUpdated(info)
    });
  }

  _initZoom() {
    this.zoomController = new ZoomController({
      container: document.getElementById('zoom-modal-container'),
      viewport: document.getElementById('zoom-viewport'),
      content: document.getElementById('zoom-inspect-img'),
      minimap: document.getElementById('zoom-minimap'),
      minimapImg: document.getElementById('zoom-minimap-img'),
      minimapRect: document.getElementById('zoom-minimap-rect'),
      onClose: () => {
        // Al salir de zoom, reenfocar el flipbook
      }
    });
  }

  async _loadInitialBook() {
    const OFFICIAL_BOOK_VERSION = 'v4.2.0-monclovense';
    const currentVersion = localStorage.getItem('monflip_book_version');

    if (currentVersion !== OFFICIAL_BOOK_VERSION) {
      // Sincronizar automáticamente con la versión oficial recién publicada
      try {
        await this.storage.clearCustomBook();
        localStorage.setItem('monflip_book_version', OFFICIAL_BOOK_VERSION);
      } catch (e) {}
    } else {
      try {
        const savedPages = await this.storage.getCustomBook();
        if (savedPages && savedPages.length > 0) {
          this.pageManager.setPages(savedPages);
          await this.flipbook.loadBook(this.pageManager.getPages());
          this._renderFilmstrip();
          this._showToast(`📖 Se cargaron ${savedPages.length} páginas de tu libro guardado`);
          return;
        }
      } catch (e) {
        console.warn("No se pudo restaurar el libro guardado:", e);
      }
    }

    // Inicializar el PageManager con las páginas oficiales
    SAMPLE_PAGES.forEach(p => {
      this.pageManager.addCustomPage({
        name: p.name,
        url: p.url,
        width: p.width,
        height: p.height,
        rotation: 0
      });
    });

    await this.flipbook.loadBook(this.pageManager.getPages());
    this._renderFilmstrip();
  }

  _showToast(message, duration = 3500) {
    let toast = document.getElementById("monflip-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "monflip-toast";
      toast.className = "monflip-toast";
      document.body.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, duration);
  }

  async _saveIfCustom() {
    try {
      await this.storage.saveCustomBook(this.pageManager.getPages());
    } catch (e) {
      console.warn("Error al auto-guardar en IndexedDB:", e);
    }
  }

  _onPageUpdated(info) {
    const { currentPage, totalPages, mode } = info;
    const isSpread = mode !== 'portrait' && this.flipbook?.viewMode !== 'single';

    // Actualizar indicador de páginas con estados cerrado/abierto
    const counterBadge = document.getElementById('page-counter-badge');
    const pageJumpInput = document.getElementById('jump-page-input');

    if (counterBadge) {
      if (currentPage === 0) {
        counterBadge.textContent = `📕 Portada (Libro cerrado)`;
      } else if (currentPage >= totalPages - 1) {
        counterBadge.textContent = `📘 Contraportada (Libro cerrado)`;
      } else if (isSpread) {
        const leftP = currentPage + 1;
        const rightP = Math.min(totalPages - 1, currentPage + 2);
        counterBadge.textContent = `📖 Páginas ${leftP} - ${rightP} de ${totalPages}`;
      } else {
        counterBadge.textContent = `Página ${currentPage + 1} de ${totalPages}`;
      }
    }

    if (pageJumpInput) {
      pageJumpInput.value = currentPage + 1;
      pageJumpInput.max = totalPages;
    }

    // Actualizar indicador en filmstrip
    this._highlightActiveThumbnail(currentPage);
  }

  _bindUI() {
    // 0. Desbloqueo universal de AudioContext al primer gesto del usuario
    const unlockAudio = () => {
      this.audioFX.unlock();
    };
    ["pointerdown", "mousedown", "click", "keydown", "touchstart"].forEach(evt => {
      window.addEventListener(evt, unlockAudio, { passive: true, capture: true });
    });

    // 1. Navegación manual flechas
    document.getElementById('btn-nav-prev')?.addEventListener('click', () => {
      this._pauseAutoPlay();
      this.flipbook.flipPrev();
    });

    document.getElementById('btn-nav-next')?.addEventListener('click', () => {
      this._pauseAutoPlay();
      this.flipbook.flipNext();
    });

    // 2. Salto directo de página
    const jumpInput = document.getElementById('jump-page-input');
    jumpInput?.addEventListener('change', (e) => {
      const p = parseInt(e.target.value, 10);
      if (!isNaN(p) && p >= 1) {
        this.flipbook.goToPage(p - 1);
      }
    });

    // 3. Audio Mute / Unmute, volumen, permanencia y botón Probar Sonido
    const audioGroup = document.querySelector('.audio-control-group');
    const muteBtn = document.getElementById('btn-toggle-mute');
    const volPopup = document.querySelector('.volume-slider-popup');
    this._updateMuteUI(this.audioFX.isMuted);

    muteBtn?.addEventListener('click', (e) => {
      // Toggle estado persistente abierto en pantalla
      audioGroup?.classList.toggle('is-open');

      const isMuted = this.audioFX.toggleMute();
      this._updateMuteUI(isMuted);
      if (!isMuted) {
        this.audioFX.playPageTurn({ force: true });
      }
    });

    // Mantener popup abierto si se hace clic dentro de él
    volPopup?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Cerrar popup persistente al hacer clic fuera del grupo de audio
    document.addEventListener('click', (e) => {
      if (audioGroup && !audioGroup.contains(e.target)) {
        audioGroup.classList.remove('is-open');
      }
    });

    const testBtn = document.getElementById('btn-test-sound');
    testBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.audioFX.isMuted = false;
      this._updateMuteUI(false);
      this.audioFX.playPageTurn({ force: true });
      audioGroup?.classList.add('is-open');
    });

    const volSlider = document.getElementById('audio-volume-slider');
    if (volSlider) {
      volSlider.value = Math.round(this.audioFX.volume * 100);
      volSlider.addEventListener('input', (e) => {
        this.audioFX.setVolume(parseFloat(e.target.value) / 100);
      });
      volSlider.addEventListener('change', () => {
        this.audioFX.playPageTurn({ force: true });
      });
    }

    // 3b. Música de Fondo Ambiental (C418 - Blind Spots de Minecraft)
    const btnToggleBgm = document.getElementById('btn-toggle-bgm');
    const btnPopupBgm = document.getElementById('btn-popup-toggle-bgm');
    const bgmSlider = document.getElementById('bgm-volume-slider');

    const handleToggleBgm = () => {
      const isPlaying = this.audioFX.toggleBgm();
      this._updateBgmUI(isPlaying);
    };

    btnToggleBgm?.addEventListener('click', handleToggleBgm);
    btnPopupBgm?.addEventListener('click', (e) => {
      e.stopPropagation();
      handleToggleBgm();
    });

    if (bgmSlider) {
      bgmSlider.value = Math.round(this.audioFX.bgmVolume * 100);
      bgmSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        this.audioFX.setBgmVolume(val);
        if (!this.audioFX.isBgmPlaying && val > 0) {
          this.audioFX.resumeBgm();
          this._updateBgmUI(true);
        }
      });
    }

    this._updateBgmUI(this.audioFX.isBgmPlaying);

    // 4. Modos de vista (Auto / Doble Página / Página Simple)
    document.getElementById('btn-view-auto')?.addEventListener('click', () => {
      this._setActiveViewBtn('btn-view-auto');
      this.flipbook.setViewMode('auto');
    });

    document.getElementById('btn-view-double')?.addEventListener('click', () => {
      this._setActiveViewBtn('btn-view-double');
      this.flipbook.setViewMode('double');
    });

    document.getElementById('btn-view-single')?.addEventListener('click', () => {
      this._setActiveViewBtn('btn-view-single');
      this.flipbook.setViewMode('single');
    });

    // 5. Botón Zoom / Inspección
    document.getElementById('btn-toggle-zoom')?.addEventListener('click', () => {
      const currentSrc = this.flipbook.getCurrentImageSrc();
      const meta = this.flipbook.getCurrentMetadata();
      if (currentSrc) {
        this.zoomController.open(currentSrc, meta ? meta.name : `Página ${this.flipbook.getCurrentPage() + 1}`);
      }
    });

    document.getElementById('btn-close-zoom')?.addEventListener('click', () => {
      this.zoomController.close();
    });

    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      this.zoomController.zoomBy(1.25);
    });

    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      this.zoomController.zoomBy(0.8);
    });

    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
      this.zoomController.resetZoom();
    });

    // 6. Pantalla completa (Fullscreen)
    document.getElementById('btn-toggle-fullscreen')?.addEventListener('click', () => {
      this._toggleFullscreen();
    });

    // 7. Auto-play / Modo Presentación
    const autoPlayBtn = document.getElementById('btn-toggle-autoplay');
    autoPlayBtn?.addEventListener('click', () => {
      this._toggleAutoPlay();
    });

    // 8. Filmstrip Drawer (Cajón de miniaturas inferior)
    const filmstripToggle = document.getElementById('btn-toggle-filmstrip');
    const filmstripDrawer = document.getElementById('bottom-filmstrip-drawer');
    const btnCloseFilmstrip = document.getElementById('btn-close-filmstrip');

    filmstripToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFilmstrip();
    });

    btnCloseFilmstrip?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.closeFilmstrip();
    });

    // Cerrar cajón de miniaturas al hacer clic fuera del mismo
    document.addEventListener('click', (e) => {
      if (this.isFilmstripOpen) {
        if (!filmstripDrawer?.contains(e.target) && !filmstripToggle?.contains(e.target)) {
          this.closeFilmstrip();
        }
      }
    });

    // 9. Modal de Gestión de Páginas y Subida en Lote
    const managerModal = document.getElementById('page-manager-modal');
    document.getElementById('btn-open-manager')?.addEventListener('click', () => {
      this._renderManagerGrid();
      managerModal?.classList.remove('hidden');
    });

    document.getElementById('btn-close-manager')?.addEventListener('click', () => {
      managerModal?.classList.add('hidden');
    });

    // Dropzone y File Input
    const dropzone = document.getElementById('manager-dropzone');
    const fileInput = document.getElementById('manager-file-input');

    dropzone?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this._handleFilesSelected(e.target.files);
      }
      e.target.value = '';
    });

    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-active');
    });

    dropzone?.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-active');
    });

    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-active');
      if (e.dataTransfer.files.length > 0) {
        this._handleFilesSelected(e.dataTransfer.files);
      }
    });

    // Botones de ordenamiento en el gestor
    document.getElementById('btn-sort-asc')?.addEventListener('click', () => {
      this.pageManager.sortNatural(true);
      this._renderManagerGrid();
    });

    document.getElementById('btn-sort-desc')?.addEventListener('click', () => {
      this.pageManager.sortNatural(false);
      this._renderManagerGrid();
    });

    document.getElementById('btn-sort-reverse')?.addEventListener('click', () => {
      this.pageManager.reverseOrder();
      this._renderManagerGrid();
    });

    document.getElementById('btn-clear-all-pages')?.addEventListener('click', async () => {
      if (confirm('¿Seguro que deseas eliminar todas las páginas del libro?')) {
        await this.storage.clearCustomBook();
        this.pageManager.clear();
        this._renderManagerGrid();
        this._showToast('🗑️ Todas las páginas han sido eliminadas.');
      }
    });

    document.getElementById('btn-load-sample-book')?.addEventListener('click', async () => {
      if (confirm('¿Restablecer el libro histórico de muestra original? Se borrarán las páginas guardadas.')) {
        await this.storage.clearCustomBook();
        this.pageManager.clear();
        SAMPLE_PAGES.forEach(p => {
          this.pageManager.addCustomPage({
            name: p.name,
            url: p.url,
            width: p.width,
            height: p.height,
            rotation: 0
          });
        });
        this._renderManagerGrid();
        this._showToast('🏛️ Se restableció el libro de muestra original.');
      }
    });

    // Botón "Generar y Aplicar Flipbook"
    document.getElementById('btn-apply-manager')?.addEventListener('click', async () => {
      const currentPages = this.pageManager.getPages();
      if (currentPages.length === 0) {
        alert('Agrega al menos una página antes de generar el libro.');
        return;
      }

      const applyBtn = document.getElementById('btn-apply-manager');
      const originalText = applyBtn ? applyBtn.innerHTML : '';
      if (applyBtn) {
        applyBtn.innerHTML = '<span>💾 Guardando libro...</span>';
        applyBtn.disabled = true;
      }

      try {
        await this.storage.saveCustomBook(currentPages);
        await this.flipbook.loadBook(currentPages);
        this._renderFilmstrip();
        managerModal?.classList.add('hidden');
        this._showToast(`✓ ¡Libro guardado! Tus ${currentPages.length} páginas persistirán al refrescar.`);
      } catch (err) {
        console.error('Error al guardar en almacenamiento local:', err);
        await this.flipbook.loadBook(currentPages);
        this._renderFilmstrip();
        managerModal?.classList.add('hidden');
      } finally {
        if (applyBtn) {
          applyBtn.innerHTML = originalText;
          applyBtn.disabled = false;
        }
      }
    });


    // Botón "Guardar y Publicar en Vercel (Para todos los navegadores)"
    document.getElementById('btn-publish-global')?.addEventListener('click', async () => {
      const currentPages = this.pageManager.getPages();
      if (currentPages.length === 0) {
        alert('Agrega al menos una página antes de publicar.');
        return;
      }

      if (!confirm('¿Deseas guardar estas páginas como el libro oficial y permanente del sitio web?\n\nSe sincronizará con GitHub y Vercel para que cualquier persona en cualquier celular, computadora o navegador las vea.')) {
        return;
      }

      const publishBtn = document.getElementById('btn-publish-global');
      const originalText = publishBtn ? publishBtn.innerHTML : '';
      if (publishBtn) {
        publishBtn.innerHTML = '<span>⏳ Guardando y subiendo a Vercel...</span>';
        publishBtn.disabled = true;
      }

      try {
        this._showToast('📤 Preparando páginas para sincronización con el servidor...');
        const payloadPages = [];

        for (let i = 0; i < currentPages.length; i++) {
          const p = currentPages[i];
          let blob = p.blob;
          if (!blob && p.url) {
            try {
              const resp = await fetch(p.url);
              blob = await resp.blob();
            } catch (e) {
              console.warn('No se pudo convertir a blob:', p.url, e);
            }
          }

          if (blob) {
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });

            payloadPages.push({
              name: p.name || `Página ${i + 1}`,
              dataUrl: base64,
              width: p.width || 1200,
              height: p.height || 1600,
              rotation: p.rotation || 0
            });
          }
        }

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isLocal) {
          alert('Para publicar cambios globales en GitHub y Vercel con 1 clic, abre tu servidor local en http://localhost:3000 y presiona este botón.');
          return;
        }

        const response = await fetch('/api/publish-book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pages: payloadPages })
        });

        const result = await response.json();
        if (result.success) {
          await this.storage.clearCustomBook();
          await this.flipbook.loadBook(currentPages);
          this._renderFilmstrip();
          managerModal?.classList.add('hidden');
          this._showToast('🚀 ¡Publicado con éxito! Visible en cualquier navegador en ~20 seg.');
          alert('¡Éxito! Tus páginas se han guardado en el servidor oficial y se subieron a GitHub. En unos 20-30 segundos Vercel terminará el despliegue automático y ya será visible en cualquier navegador o celular.');
        } else {
          throw new Error(result.error || 'Error al procesar en servidor');
        }
      } catch (err) {
        console.error('Error al publicar libro global:', err);
        alert('Hubo un error al publicar: ' + err.message);
      } finally {
        if (publishBtn) {
          publishBtn.innerHTML = originalText;
          publishBtn.disabled = false;
        }
      }
    });

    // Control de compresión del cliente
    const compressCheckbox = document.getElementById('compression-enable-check');
    compressCheckbox?.addEventListener('change', (e) => {
      this.pageManager.compressionSettings.enabled = e.target.checked;
    });

    const compressMaxDim = document.getElementById('compression-dimension-select');
    compressMaxDim?.addEventListener('change', (e) => {
      this.pageManager.compressionSettings.maxDimension = parseInt(e.target.value, 10);
    });

    // 10. Modal de Atajos de Teclado
    const helpModal = document.getElementById('keyboard-help-modal');
    document.getElementById('btn-open-help')?.addEventListener('click', () => {
      helpModal?.classList.remove('hidden');
    });
    document.getElementById('btn-close-help')?.addEventListener('click', () => {
      helpModal?.classList.add('hidden');
    });
  }

  async _handleFilesSelected(files) {
    const progressContainer = document.getElementById('manager-progress-container');
    const progressBar = document.getElementById('manager-progress-bar');
    const progressStatus = document.getElementById('manager-progress-status');

    if (progressContainer) progressContainer.classList.remove('hidden');

    try {
      await this.pageManager.processFiles(files, (curr, total, name) => {
        const pct = Math.round((curr / total) * 100);
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (progressStatus) progressStatus.textContent = `Procesando ${curr}/${total}: ${name}`;
      });
      await this.storage.saveCustomBook(this.pageManager.getPages());
      this._showToast(`📥 ${files.length} archivo(s) procesados y guardados`);
    } catch (err) {
      console.error('Error al procesar lote:', err);
      alert('Ocurrió un error al procesar algunos archivos.');
    } finally {
      if (progressContainer) progressContainer.classList.add('hidden');
      this._renderManagerGrid();
    }
  }

  _renderManagerGrid() {
    const grid = document.getElementById('manager-pages-grid');
    const countBadge = document.getElementById('manager-pages-count');
    if (!grid) return;

    const pages = this.pageManager.getPages();
    if (countBadge) countBadge.textContent = `${pages.length} páginas`;

    grid.innerHTML = '';

    if (pages.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No hay páginas cargadas. Arrastra archivos arriba o haz clic en "Cargar Libro de Muestra".</p>
        </div>
      `;
      return;
    }

    pages.forEach((page, index) => {
      const card = document.createElement('div');
      card.className = 'manager-page-card';
      card.setAttribute('draggable', 'true');
      card.dataset.index = index;

      card.innerHTML = `
        <div class="card-thumb-wrap">
          <img src="${page.url}" alt="${page.name}" style="transform: rotate(${page.rotation || 0}deg)" />
          <span class="card-num-badge">#${index + 1}</span>
        </div>
        <div class="card-info">
          <span class="card-title" title="${page.name}">${page.name}</span>
          ${page.savingsPercent ? `<span class="card-savings">Ahorro: -${page.savingsPercent}%</span>` : ''}
        </div>
        <div class="card-actions">
          <button class="btn-card-action" data-action="left" title="Mover a la izquierda" ${index === 0 ? 'disabled' : ''}>←</button>
          <button class="btn-card-action" data-action="right" title="Mover a la derecha" ${index === pages.length - 1 ? 'disabled' : ''}>→</button>
          <button class="btn-card-action" data-action="rotate" title="Rotar 90°">↻</button>
          <button class="btn-card-action" data-action="duplicate" title="Duplicar">⧉</button>
          <button class="btn-card-action danger" data-action="delete" title="Eliminar">✕</button>
        </div>
      `;

      // Eventos de acciones
      card.querySelectorAll('.btn-card-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          if (action === 'left') {
            this.pageManager.movePage(index, index - 1);
          } else if (action === 'right') {
            this.pageManager.movePage(index, index + 1);
          } else if (action === 'rotate') {
            this.pageManager.rotatePage(index, 90);
          } else if (action === 'duplicate') {
            this.pageManager.duplicatePage(index);
          } else if (action === 'delete') {
            this.pageManager.removePage(index);
          }
          this._renderManagerGrid();
          this._saveIfCustom();
        });
      });

      // Drag and Drop para reordenar en la rejilla
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index);
        card.classList.add('is-dragging');
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.classList.add('drag-hover');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-hover');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-hover');
        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(fromIdx) && fromIdx !== index) {
          this.pageManager.movePage(fromIdx, index);
          this._renderManagerGrid();
          this._saveIfCustom();
        }
      });

      grid.appendChild(card);
    });
  }

  _renderFilmstrip() {
    const strip = document.getElementById('filmstrip-track');
    if (!strip) return;
    strip.innerHTML = '';

    const pages = this.flipbook.pages;
    pages.forEach((src, idx) => {
      const item = document.createElement('button');
      item.className = 'filmstrip-item';
      item.dataset.index = idx;
      let label = `${idx + 1}`;
      if (idx === 0) label = 'Portada';
      else if (idx === pages.length - 1) label = 'Contraportada';

      item.innerHTML = `
        <div class="thumb-frame">
          <img src="${src}" alt="Miniatura ${idx + 1}" loading="lazy" />
        </div>
        <span class="thumb-label">${label}</span>
      `;
      item.addEventListener('click', () => {
        this._pauseAutoPlay();
        this.flipbook.goToPage(idx);
      });
      strip.appendChild(item);
    });

    this._highlightActiveThumbnail(this.flipbook.getCurrentPage());
  }

  openFilmstrip() {
    this.isFilmstripOpen = true;
    const filmstripDrawer = document.getElementById('bottom-filmstrip-drawer');
    const filmstripToggle = document.getElementById('btn-toggle-filmstrip');
    const bottomToolbar = document.querySelector('.floating-bottom-toolbar');

    filmstripDrawer?.classList.add('open');
    filmstripToggle?.classList.add('active');
    bottomToolbar?.classList.add('filmstrip-active');
    document.getElementById('page-indicator')?.classList.add('filmstrip-hidden');

    this._centerActiveThumbnailInTrack();
  }

  closeFilmstrip() {
    this.isFilmstripOpen = false;
    const filmstripDrawer = document.getElementById('bottom-filmstrip-drawer');
    const filmstripToggle = document.getElementById('btn-toggle-filmstrip');
    const bottomToolbar = document.querySelector('.floating-bottom-toolbar');

    filmstripDrawer?.classList.remove('open');
    filmstripToggle?.classList.remove('active');
    bottomToolbar?.classList.remove('filmstrip-active');
    document.getElementById('page-indicator')?.classList.remove('filmstrip-hidden');

    // Restablecer cualquier desplazamiento residual del viewport
    window.scrollTo(0, 0);
    const viewport = document.getElementById('app-root');
    if (viewport) viewport.scrollTop = 0;
  }

  toggleFilmstrip() {
    if (this.isFilmstripOpen) {
      this.closeFilmstrip();
    } else {
      this.openFilmstrip();
    }
  }

  _centerActiveThumbnailInTrack() {
    const track = document.getElementById('filmstrip-track');
    const activeEl = track?.querySelector('.filmstrip-item.active');
    if (track && activeEl) {
      const scrollPos = activeEl.offsetLeft - (track.clientWidth / 2) + (activeEl.clientWidth / 2);
      track.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }

  _highlightActiveThumbnail(pageIndex) {
    const items = document.querySelectorAll('.filmstrip-item');
    let activeItem = null;
    items.forEach(el => {
      const idx = parseInt(el.dataset.index, 10);
      const isActive = (idx === pageIndex);
      el.classList.toggle('active', isActive);
      if (isActive) activeItem = el;
    });

    // CRÍTICO: SOLO desplazar la cinta si el cajón de miniaturas está VISIBLEMENTE abierto.
    // NUNCA usar scrollIntoView(), ya que causa que el navegador desplace
    // verticalmente el viewport del contenedor o de la ventana, activando la vista previa
    // forzada en cada paso de página.
    if (this.isFilmstripOpen && activeItem) {
      this._centerActiveThumbnailInTrack();
    }
  }

  _setActiveViewBtn(activeId) {
    ['btn-view-auto', 'btn-view-double', 'btn-view-single'].forEach(id => {
      document.getElementById(id)?.classList.toggle('active', id === activeId);
    });
  }

  _updateMuteUI(isMuted) {
    const muteBtn = document.getElementById('btn-toggle-mute');
    if (!muteBtn) return;
    muteBtn.classList.toggle('muted', isMuted);
    muteBtn.setAttribute('title', isMuted ? 'Activar sonido de pasar página (M)' : 'Silenciar sonido de páginas (M)');
    const icon = muteBtn.querySelector('.icon');
    if (icon) {
      icon.textContent = isMuted ? '🔇' : '🔊';
    }
  }

  _updateBgmUI(isPlaying) {
    const btnToggleBgm = document.getElementById('btn-toggle-bgm');
    const btnPopupBgm = document.getElementById('btn-popup-toggle-bgm');
    if (btnToggleBgm) {
      btnToggleBgm.classList.toggle('playing', isPlaying);
      btnToggleBgm.setAttribute('title', isPlaying 
        ? 'Música de fondo: Blind Spots (C418) [Sonando sutilmente - Clic para pausar (B)]' 
        : 'Música de fondo: Blind Spots (C418) [Pausada - Clic para reanudar (B)]');
      const icon = btnToggleBgm.querySelector('.icon');
      if (icon) {
        icon.textContent = isPlaying ? '🎵' : '🔇';
      }
    }
    if (btnPopupBgm) {
      btnPopupBgm.textContent = isPlaying ? '⏸' : '▶';
      btnPopupBgm.setAttribute('title', isPlaying ? 'Pausar música ambiental' : 'Reanudar música ambiental');
    }
  }

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  _toggleAutoPlay() {
    this.isAutoPlay = !this.isAutoPlay;
    const btn = document.getElementById('btn-toggle-autoplay');
    btn?.classList.toggle('active', this.isAutoPlay);

    if (this.isAutoPlay) {
      if (btn) btn.querySelector('.label').textContent = 'Pausar';
      this.autoPlayTimer = setInterval(() => {
        if (this.flipbook.getCurrentPage() >= this.flipbook.getTotalPages() - 1) {
          this.flipbook.goToPage(0);
        } else {
          this.flipbook.flipNext();
        }
      }, this.autoPlayInterval);
    } else {
      this._pauseAutoPlay();
    }
  }

  _pauseAutoPlay() {
    if (this.isAutoPlay) {
      this.isAutoPlay = false;
      clearInterval(this.autoPlayTimer);
      const btn = document.getElementById('btn-toggle-autoplay');
      btn?.classList.remove('active');
      if (btn) btn.querySelector('.label').textContent = 'Auto-reproducir';
    }
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Si el foco está en un input numérico o texto, no interceptar
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      // Si el modal de zoom está activo, el ZoomController gestiona sus atajos
      if (this.zoomController?.isActive) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          this._pauseAutoPlay();
          this.flipbook.flipNext();
          break;

        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          this._pauseAutoPlay();
          this.flipbook.flipPrev();
          break;

        case 'Home':
          e.preventDefault();
          this.flipbook.goToPage(0);
          break;

        case 'End':
          e.preventDefault();
          this.flipbook.goToPage(this.flipbook.getTotalPages() - 1);
          break;

        case 'z':
        case 'Z':
          e.preventDefault();
          document.getElementById('btn-toggle-zoom')?.click();
          break;

        case 'm':
        case 'M':
          e.preventDefault();
          document.getElementById('btn-toggle-mute')?.click();
          break;

        case 'b':
        case 'B':
          e.preventDefault();
          document.getElementById('btn-toggle-bgm')?.click();
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          this._toggleFullscreen();
          break;

        case '?':
          e.preventDefault();
          document.getElementById('keyboard-help-modal')?.classList.toggle('hidden');
          break;

        case 'Escape':
          this.closeFilmstrip();
          document.getElementById('page-manager-modal')?.classList.add('hidden');
          document.getElementById('keyboard-help-modal')?.classList.add('hidden');
          break;
      }
    });
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.luminaFlip = new LuminaFlipApp();
  window.luminaFlip.init();
});
