# Таза қазақша — серверге шығару

## Бір рет баптау

1. DuckDNS-те subdomain жасаңыз, мысалы `tazaqazaqsha`. Сайт адресі `https://tazaqazaqsha.duckdns.org` болады (`.com` емес, DuckDNS домені `.org`).
2. `.env.example` файлын `.env` деп көшіріңіз. `DOMAIN`, `DUCKDNS_SUBDOMAIN` және `DUCKDNS_TOKEN` мәндерін толтырыңыз.
3. Үй роутерінде TCP `80` және `443` порттарын Docker істеп тұрған компьютердің жергілікті IP-іне бағыттаңыз. Компьютерге тұрақты LAN IP берген дұрыс.
4. Іске қосыңыз: `docker compose up -d --build`.

DuckDNS контейнері public IP-ді әр бес минут сайын тексеріп, өзгерсе автоматты жаңартады. Caddy TLS сертификатын шығарады, ұзартады және HTTP-ден HTTPS-ке бағыттайды.

## Хостинг таңдауы

- **Үй сервері / VPS / AWS EC2:** толық `compose.yaml` stack-ін қолданыңыз. Онда офлайн CPU Piper TTS жұмыс істейді.
- **Vercel:** Vercel-ге тек Next.js жіберіледі; Piper контейнерін AWS ECS/EC2-ге жеке орналастырып, Vercel env ішіне `TTS_SERVICE_URL=https://tts.example.com` жазыңыз. Vercel-ге Caddy мен DuckDNS қажет емес.

## Жаңарту

`git pull` алған соң: `docker compose up -d --build`
