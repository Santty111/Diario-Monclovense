/**
 * PageManager - Gestión, procesamiento, ordenamiento y compresión en cliente
 * de páginas escaneadas (JPG, PNG, WEBP y documentos PDF).
 */
export class PageManager {
  constructor() {
    this.pages = []; // Array de { id, name, url, originalBlob, width, height, rotation, size }
    this.compressionSettings = {
      enabled: true,
      maxDimension: 1800, // Alto o ancho máximo en píxeles (excelente legibilidad de texto)
      quality: 0.86,
      format: 'image/webp' // o 'image/jpeg'
    };
    this.listeners = new Set();
    this.isProcessing = false;
  }

  /**
   * Suscribe un callback a cambios de la lista de páginas
   */
  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  notify() {
    for (const cb of this.listeners) {
      try { cb([...this.pages]); } catch (e) { console.error(e); }
    }
  }

  /**
   * Procesa una lista de archivos seleccionados o arrastrados (imágenes o PDFs)
   * @param {FileList|File[]} files
   * @param {Function} onProgress Callback de progreso (current, total, currentName)
   */
  async processFiles(files, onProgress = () => {}) {
    this.isProcessing = true;
    const fileList = Array.from(files);
    let processedCount = 0;
    const newPages = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      onProgress(i + 1, fileList.length, file.name);

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // Procesar PDF página por página
        try {
          const pdfPages = await this._processPDF(file, (pNum, pTotal) => {
            onProgress(i + 1, fileList.length, `${file.name} (Pág. ${pNum}/${pTotal})`);
          });
          newPages.push(...pdfPages);
        } catch (err) {
          console.error('Error al procesar PDF:', file.name, err);
        }
      } else if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|tiff?)$/i.test(file.name)) {
        // Procesar Imagen
        try {
          const page = await this._processImage(file);
          newPages.push(page);
        } catch (err) {
          console.error('Error al procesar imagen:', file.name, err);
        }
      }
    }

    this.pages.push(...newPages);
    this.isProcessing = false;
    this.notify();
    return newPages;
  }

  /**
   * Añade una página directa (por ejemplo, desde los samples pre-cargados)
   */
  addCustomPage(pageData) {
    const page = {
      id: pageData.id || 'page_' + Math.random().toString(36).substring(2, 9),
      name: pageData.name || `Página ${this.pages.length + 1}`,
      url: pageData.url,
      blob: pageData.blob || null,
      width: pageData.width || 1200,
      height: pageData.height || 1600,
      rotation: pageData.rotation || 0,
      size: pageData.size || 0
    };
    this.pages.push(page);
    this.notify();
    return page;
  }

  /**
   * Reemplaza todas las páginas (útil para cargar colección o restablecer)
   */
  setPages(newPages) {
    this.clear();
    this.pages = [...newPages];
    this.notify();
  }

  /**
   * Procesa y comprime una imagen individual mediante OffscreenCanvas/Canvas
   */
  async _processImage(file) {
    const originalSize = file.size;
    const imgBitmap = await this._loadImage(file);
    let { width, height } = imgBitmap;

    let targetWidth = width;
    let targetHeight = height;

    if (this.compressionSettings.enabled) {
      const maxDim = this.compressionSettings.maxDimension;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          targetWidth = maxDim;
          targetHeight = Math.round((height / width) * maxDim);
        } else {
          targetHeight = maxDim;
          targetWidth = Math.round((width / height) * maxDim);
        }
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgBitmap, 0, 0, targetWidth, targetHeight);

    // Formato de compresión
    const format = this.compressionSettings.format;
    const quality = this.compressionSettings.quality;

    const blob = await new Promise(resolve => canvas.toBlob(resolve, format, quality));
    const url = URL.createObjectURL(blob);

    return {
      id: 'page_' + Math.random().toString(36).substring(2, 9),
      name: file.name,
      url: url,
      blob: blob,
      width: targetWidth,
      height: targetHeight,
      rotation: 0,
      size: blob.size,
      originalSize: originalSize,
      savingsPercent: originalSize > 0 ? Math.round((1 - blob.size / originalSize) * 100) : 0
    };
  }

  /**
   * Carga una imagen de manera asíncrona
   */
  _loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        resolve(img);
        // El objectUrl original se puede revocar tras dibujar en el canvas
      };
      img.onerror = reject;
      img.src = objectUrl;
    });
  }

  /**
   * Extrae páginas de un archivo PDF usando PDF.js
   */
  async _processPDF(file, onPdfProgress = () => {}) {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js no está disponible');
    }

    // Configurar worker si aún no está asignado
    if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    const result = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      onPdfProgress(pageNum, totalPages);
      const pdfPage = await pdf.getPage(pageNum);

      // Renderizar a alta resolución (2x scale para texto escaneado nítido)
      const viewport = pdfPage.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      await pdfPage.render({ canvasContext: ctx, viewport }).promise;

      // Comprimir a WebP/JPEG
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, this.compressionSettings.format, this.compressionSettings.quality);
      });
      const url = URL.createObjectURL(blob);

      result.push({
        id: 'page_' + Math.random().toString(36).substring(2, 9),
        name: `${file.name} - Pág. ${pageNum}`,
        url: url,
        blob: blob,
        width: viewport.width,
        height: viewport.height,
        rotation: 0,
        size: blob.size,
        originalSize: 0,
        savingsPercent: 0
      });
    }

    return result;
  }

  /**
   * Rota una página en 90 grados en sentido horario
   */
  rotatePage(index, degrees = 90) {
    if (!this.pages[index]) return;
    this.pages[index].rotation = (this.pages[index].rotation + degrees) % 360;
    this.notify();
  }

  /**
   * Mueve una página de una posición a otra
   */
  movePage(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.pages.length || toIndex < 0 || toIndex >= this.pages.length) return;
    const [movedItem] = this.pages.splice(fromIndex, 1);
    this.pages.splice(toIndex, 0, movedItem);
    this.notify();
  }

  /**
   * Elimina una página por su índice
   */
  removePage(index) {
    if (index >= 0 && index < this.pages.length) {
      const removed = this.pages.splice(index, 1)[0];
      if (removed && removed.url && removed.url.startsWith('blob:')) {
        URL.revokeObjectURL(removed.url);
      }
      this.notify();
    }
  }

  /**
   * Duplica una página
   */
  duplicatePage(index) {
    if (this.pages[index]) {
      const original = this.pages[index];
      const clone = {
        ...original,
        id: 'page_' + Math.random().toString(36).substring(2, 9),
        name: `${original.name} (copia)`
      };
      this.pages.splice(index + 1, 0, clone);
      this.notify();
    }
  }

  /**
   * Ordena las páginas por nombre con orden natural (e.g. p1, p2, p10)
   */
  sortNatural(ascending = true) {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    this.pages.sort((a, b) => {
      const res = collator.compare(a.name, b.name);
      return ascending ? res : -res;
    });
    this.notify();
  }

  /**
   * Invierte el orden actual de las páginas
   */
  reverseOrder() {
    this.pages.reverse();
    this.notify();
  }

  /**
   * Limpia y libera recursos de memoria de todas las páginas cargadas
   */
  clear() {
    for (const page of this.pages) {
      if (page.url && page.url.startsWith('blob:')) {
        URL.revokeObjectURL(page.url);
      }
    }
    this.pages = [];
    this.notify();
  }

  /**
   * Retorna las páginas actuales
   */
  getPages() {
    return [...this.pages];
  }

  /**
   * Retorna el conteo total
   */
  getCount() {
    return this.pages.length;
  }
}
