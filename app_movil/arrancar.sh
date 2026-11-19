#!/usr/bin/env bash
# Arranca la app en segundo plano (Codespaces lo ejecuta cada vez que se enciende).
cd "$(dirname "$0")"
pkill -f "python3 app.py" 2>/dev/null
setsid nohup python3 app.py > /tmp/app.log 2>&1 < /dev/null &
echo "App arrancando en el puerto 7860 (registro en /tmp/app.log)"
