@echo off
chcp 65001 >nul
title Servidor WhatsApp & CAPI — Gabriel Miranda
color 0A
cls

set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo ===================================================================
echo     KINDEV META ADS — SERVIDOR WHATSAPP (GABRIEL MIRANDA)
echo ===================================================================
echo.
echo  Cliente Activo : Gabriel Miranda
echo  Tenant ID      : gabriel_miranda_gi1yk
echo  Dataset CAPI   : 974926099026870
echo  Puerto Local   : 3000
echo.
echo ===================================================================
echo.

:: 1. Variables de entorno dedicadas para Gabriel Miranda
set TENANT_ID=gabriel_miranda_gi1yk
set META_DATASET_ID=974926099026870
set META_ACCESS_TOKEN=EAAWpFsDB89MBSrFpQWk7DOnpYeLZBCPg7DUqmZBG2TSoruQBLotW8fHiZBfJuCld4f7t4S8iCRUbod0jtTOjt3G92si2umks8w0eNIZBQEkGKCIGWeHXiQWXSEu6Kdk5eM7Ej0L2BHFxv9abT1EhKEuUZAdD1G4pWZAf1dkEcaaLUCBbLefbHYQeTpPBJ5tu7rPAZDZD
set PORT=3000

:: 2. Verificar Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado en este equipo.
    echo Por favor descarga e instala Node.js LTS desde: https://nodejs.org/
    echo.
    pause
    exit /b
)

:: 3. Verificar dependencias
if not exist "node_modules\" (
    echo [INFO] Instalando dependencias necesarias por primera vez...
    call npm install --prefer-offline --no-audit --no-fund
    echo.
)

:: 4. Liberar puerto 3000 si está ocupado previamente
powershell -NoProfile -Command "$conns = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: 5. Abrir la página del Código QR tras 3 segundos
start "" cmd /c "timeout /t 3 >nul & start http://localhost:3000/qr"

echo [INICIANDO] Servidor de WhatsApp arrancando...
echo [INFO] Se abrirá automáticamente la ventana para escanear el Código QR.
echo.
echo Presiona Ctrl + C para detener el servidor en cualquier momento.
echo -------------------------------------------------------------------
echo.

node server.js

pause
