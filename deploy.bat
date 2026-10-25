@echo off
chcp 65001 > nul
cls
echo ========================================================
echo   MESA INTERATIVA DE RPG — UNIVERSO EVREN
echo   Kit de Publicação e Deploy em Produção
echo ========================================================
echo.

echo [1/3] Executando testes de integridade da mesa...
python test_integrity.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha nos testes de integridade. Corrija os erros antes de publicar.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Verificando assets do PWA e Web Manifest...
if not exist "assets\icon-192.png" (
    echo Gerando ícones PWA ausentes...
    python generate_app_icons.py
)
echo ✓ Todos os assets PWA estão prontos.

echo.
echo [3/3] Opções de Publicação e Execução:
echo.
echo   [1] Iniciar Servidor Local de Desenvolvimento (http://localhost:8000)
echo   [2] Publicar / Fazer Push para o GitHub Pages (Git Commit + Push)
echo   [3] Executar apenas os Testes de Validação
echo   [4] Sair
echo.
set /p opt="Escolha uma opção (1-4): "

if "%opt%"=="1" (
    echo Iniciando servidor HTTP...
    start http://localhost:8000
    python server.py
)
if "%opt%"=="2" (
    echo.
    echo Publicando no GitHub...
    git status > nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo Inicializando repositório Git...
        git init
        git branch -M main
    )
    git add .
    set /p msg="Mensagem do commit (pressione Enter para padrão): "
    if "%msg%"=="" set msg=Deploy Evren RPG VTT Production Ready
    git commit -m "%msg%"
    echo.
    echo Para enviar para o seu repositório remoto:
    echo Execute: git push -u origin main
    echo.
    git push
    pause
)
if "%opt%"=="3" (
    python test_integrity.py
    node test_data_loader.js
    pause
)
if "%opt%"=="4" (
    exit /b 0
)
