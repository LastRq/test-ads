$Host.UI.RawUI.WindowTitle = "Servidor WhatsApp y CAPI - Gabriel Miranda"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "===========================================================" -ForegroundColor Green
Write-Host "    KINDEV META ADS - SERVIDOR WHATSAPP Y CAPI" -ForegroundColor Cyan
Write-Host "    Cliente: Gabriel Miranda (gabriel_miranda_gi1yk)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Green
Write-Host ""

# Variables de entorno dedicadas para Gabriel Miranda
$env:TENANT_ID = "gabriel_miranda_gi1yk"
$env:META_DATASET_ID = "974926099026870"
$env:META_ACCESS_TOKEN = "EAAWpFsDB89MBSrFpQWk7DOnpYeLZBCPg7DUqmZBG2TSoruQBLotW8fHiZBfJuCld4f7t4S8iCRUbod0jtTOjt3G92si2umks8w0eNIZBQEkGKCIGWeHXiQWXSEu6Kdk5eM7Ej0L2BHFxv9abT1EhKEuUZAdD1G4pWZAf1dkEcaaLUCBbLefbHYQeTpPBJ5tu7rPAZDZD"
$env:PORT = "3000"

# 1. Comprobar Node.js
$runtimeNode = Join-Path $scriptDir "runtime\node.exe"
if (Test-Path $runtimeNode) {
    $env:Path = (Join-Path $scriptDir "runtime") + ";" + $env:Path
}

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "[1/3] Node.js no detectado en el sistema." -ForegroundColor Yellow
    Write-Host "      Descargando motor portable oficial (28 MB)..." -ForegroundColor Cyan
    Write-Host "      Por favor espera unos segundos..." -ForegroundColor Gray
    
    $zipPath = Join-Path $env:TEMP "node_portable.zip"
    $tempExtract = Join-Path $env:TEMP "node_extract"
    $targetRuntime = Join-Path $scriptDir "runtime"

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $client = New-Object System.Net.WebClient
        $client.DownloadFile("https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip", $zipPath)

        Write-Host "      Extrayendo motor de ejecucion..." -ForegroundColor Cyan
        if (Test-Path $tempExtract) { Remove-Item $tempExtract -Recurse -Force }
        Expand-Archive -Path $zipPath -DestinationPath $tempExtract -Force

        if (-not (Test-Path $targetRuntime)) { New-Item -ItemType Directory -Path $targetRuntime -Force | Out-Null }
        Copy-Item -Path "$tempExtract\node-v20.18.0-win-x64\*" -Destination $targetRuntime -Recurse -Force
        
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
        Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue

        $env:Path = $targetRuntime + ";" + $env:Path
        Write-Host "      [OK] Node.js instalado con exito!" -ForegroundColor Green
    } catch {
        Write-Host "      [ERROR] Fallo la descarga automatica: $_" -ForegroundColor Red
        Write-Host "      Por favor instala Node.js LTS manualmente desde https://nodejs.org/" -ForegroundColor Yellow
        Read-Host "Presiona Enter para salir..."
        exit 1
    }
} else {
    Write-Host "[OK] Node.js activo y listo: $($nodeCmd.Source)" -ForegroundColor Green
}

# 2. Comprobar dependencias
$nodeModules = Join-Path $scriptDir "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host "[2/3] Instalando dependencias de WhatsApp (unos 15 segundos)..." -ForegroundColor Cyan
    cmd /c "npm install --prefer-offline --no-audit --no-fund"
    Write-Host "[OK] Dependencias instaladas con exito." -ForegroundColor Green
}

# 3. Liberar puerto 3000 si esta ocupado
$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    Write-Host "[INFO] Liberando puerto 3000 ocupado previamente..." -ForegroundColor Yellow
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# 4. Lanzador de codigo QR en navegador
Start-Process powershell -ArgumentList "-NoProfile -Command `"Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000/qr'`"" -WindowStyle Hidden

Write-Host ""
Write-Host "[3/3] Servidor activo en puerto 3000!" -ForegroundColor Green
Write-Host "      Se abrira automaticamente el navegador con el Codigo QR." -ForegroundColor Cyan
Write-Host "      Escanea el QR con tu WhatsApp para vincularlo." -ForegroundColor White
Write-Host ""
Write-Host "Presiona Ctrl + C si deseas apagar el bot." -ForegroundColor Gray
Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

# Iniciar servidor Node.js
& node (Join-Path $scriptDir "server.js")

Read-Host "El servidor se ha detenido. Presiona Enter para salir..."
