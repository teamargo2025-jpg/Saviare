@echo off
cd /d "%~dp0"
echo Sincronizando Saviare -^> Argonauts...
echo.
node scripts\sync-to-argonauts.mjs
echo.
echo Listo. Presiona una tecla para cerrar esta ventana.
pause >nul
