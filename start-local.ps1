# =========================================================
# ТАЗА ҚАЗАҚША / КӨНЕ СӨЗДЕР - ЖЕРГІЛІКТІ ІСКЕ ҚОСУ СКРИПТІ
# Windows PowerShell (start-local.ps1)
# =========================================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  ТАЗА ҚАЗАҚША - Жергілікті іске қосу  " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

# 1. .env тексеру
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "[+] .env файлы табылмады, .env.example көшірілуде..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
    } else {
        Write-Host "[-] .env файлы жоқ! Жоба баптауларын тексеріңіз." -ForegroundColor Red
    }
}

# 2. Параметрлерді тексеру
param (
    [switch]$Docker = $false
)

if ($Docker) {
    Write-Host "[*] Docker Compose арқылы іске қосылуда (Caddy/DNS жоқ)..." -ForegroundColor Magenta
    docker compose -f compose.local.yaml up --build
} else {
    # 3. Node.js арқылы жылдам әрі жеңіл іске қосу
    Write-Host "[*] Тәуелділіктерді тексеру..." -ForegroundColor Yellow
    if (-not (Test-Path "node_modules")) {
        Write-Host "[+] node_modules орнатылуда (npm install)..." -ForegroundColor Yellow
        npm install
    }

    Write-Host ""
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host "  Сайт мына мекенжайда қолжетімді: http://localhost:3000 " -ForegroundColor White -BackgroundColor DarkGreen
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host ""

    # Браузерді автоматты түрде ашу
    Start-Process "http://localhost:3000"

    # Next.js серверін іске қосу
    npm run dev
}
