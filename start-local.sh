#!/bin/bash
# =========================================================
# ТАЗА ҚАЗАҚША / КӨНЕ СӨЗДЕР - ЖЕРГІЛІКТІ ІСКЕ ҚОСУ СКРИПТІ
# macOS & Linux Bash (start-local.sh)
# =========================================================

set -e

echo "========================================="
echo "  ТАЗА ҚАЗАҚША - Жергілікті іске қосу  "
echo "========================================="

# 1. .env тексеру
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "[+] .env файлы табылмады, .env.example көшірілуде..."
        cp .env.example .env
    else
        echo "[-] .env файлы жоқ!"
    fi
fi

# 2. Docker немесе Node.js арқылы іске қосу
if [ "$1" = "--docker" ]; then
    echo "[*] Docker Compose арқылы іске қосылуда (Caddy/DNS жоқ)..."
    docker compose -f compose.local.yaml up --build
else
    echo "[*] Тәуелділіктерді тексеру..."
    if [ ! -d "node_modules" ]; then
        echo "[+] npm install орындалуда..."
        npm install
    fi

    echo ""
    echo "========================================================="
    echo "  Сайт мына мекенжайда қолжетімді: http://localhost:3000 "
    echo "========================================================="
    echo ""

    # macOS / Linux браузерін ашу
    if command -v xdg-open > /dev/null; then
        xdg-open "http://localhost:3000" &
    elif command -v open > /dev/null; then
        open "http://localhost:3000" &
    fi

    # Серверді бастау
    npm run dev
fi
