#!/usr/bin/env zsh

# LuminaFlip - Script de inicio rápido para macOS
export PATH="/Users/sannsann/.gemini/antigravity-ide/bin:/Users/sannsann/.antigravity-ide/antigravity-ide/bin:$PATH"

# Verificar si node está disponible
if ! command -v node >/dev/null 2>&1; then
  echo "⚠️ Configurando entorno Node..."
  export PATH="/Users/sannsann/.gemini/antigravity-ide/bin:$PATH"
fi

echo "🚀 Iniciando LuminaFlip en http://localhost:3000 ..."

# Abrir el navegador automáticamente en macOS tras 1 segundo
(sleep 1.2 && open "http://localhost:3000") &

# Ejecutar el servidor web
node dev-server.js
