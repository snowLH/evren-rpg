@echo off
setlocal
title Universo Evren - Utilitario de Publicacao do Desenvolvedor

cd /d "%~dp0"

echo ========================================================
echo   UNIVERSO EVREN - UTILITARIO DE DESENVOLVIMENTO
echo ========================================================
echo.
echo Este script e destinado exclusivamente a mantenedores do projeto
echo para verificacao local e publicacao de atualizacoes.
echo.
echo   [1] Iniciar Servidor Local Seguro (127.0.0.1:8000)
echo   [2] Executar Testes Locais de Integridade
echo   [3] Publicar Alteracoes no Git (commit + push)
echo   [4] Sair
echo.
set /p opt="Escolha uma opcao (1-4): "

if "%opt%"=="1" (
    python server.py
    goto :end
)

if "%opt%"=="2" (
    if exist "test_integrity.py" (
        python test_integrity.py
    ) else (
        echo [i] Arquivo test_integrity.py nao presente neste pacote.
    )
    if exist "test_data_loader.js" (
        node test_data_loader.js
    )
    pause
    goto :end
)

if "%opt%"=="3" (
    git --version >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] O utilitario Git nao foi detectado no PATH do sistema.
        pause
        goto :end
    )
    echo Verificando status do repositorio...
    git status
    echo.
    set /p confirm="Deseja prosseguir com o commit e push? (S/N): "
    if /i "%confirm%"=="S" (
        git add .
        set /p msg="Mensagem do commit: "
        if "%msg%"=="" set msg=Atualizacao do acervo historico de Evren
        git commit -m "%msg%"
        git push origin main
        echo [OK] Publicacao concluida com sucesso.
    ) else (
        echo Operacao cancelada pelo desenvolvedor.
    )
    pause
    goto :end
)

:end
endlocal
