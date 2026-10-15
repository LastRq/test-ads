@echo off
setlocal
cd /d "%~dp0"
title Servidor WhatsApp - Gabriel Miranda

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"

if %errorlevel% neq 0 (
    echo.
    echo ===================================================
    echo Ocurrio un error al ejecutar el servidor.
    echo ===================================================
    pause
)
