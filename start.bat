@echo off
chcp 65001 >nul
title Mesa Interativa de RPG - Universo Evren

cd /d "%~dp0"

echo ===================================================================
echo   INICIANDO MESA INTERATIVA — UNIVERSO EVREN
echo   VTT ^& Wiki Ttica de Lore
echo ===================================================================
echo.

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [i] Python detectado. Iniciando servidor local em http://localhost:8000...
    python server.py
) else (
    echo [!] Python no encontrado no PATH do sistema.
    echo [i] Abrindo diretamente no navegador padro (modo offline)...
    start "" index.html
)

pause
