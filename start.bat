@echo off
setlocal
title Universo Evren - Museu Historico e Mesa de RPG

cd /d "%~dp0"

echo ===================================================================
echo   UNIVERSO EVREN - MUSEU HISTORICO E VTT INTERATIVO
echo   Inicializador Local Seguro
echo ===================================================================
echo.

python --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Python detectado no sistema.
    echo [i] Iniciando servidor local seguro em 127.0.0.1:8000...
    python server.py
) else (
    echo [i] Python nao encontrado no PATH do sistema.
    echo [i] Abrindo aplicacao diretamente no navegador padrao (modo offline)...
    start "" "index.html"
)

endlocal
pause
