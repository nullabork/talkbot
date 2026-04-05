#!/usr/bin/env bash

# Reads .env and starts docker compose with the correct profiles.
#
# Usage:
#   ./docker-start.sh            — start (build + up)
#   ./docker-start.sh down       — stop everything
#   ./docker-start.sh logs       — tail logs
#   ./docker-start.sh restart    — down + up

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Check Docker is installed ────────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
    echo ""
    echo "  Docker is not installed or not in PATH."
    echo ""
    echo "  Install Docker Desktop:"
    echo "    Windows/Mac: https://www.docker.com/products/docker-desktop/"
    echo "    Linux:       https://docs.docker.com/engine/install/"
    echo ""
    exit 1
fi

if ! docker info &> /dev/null; then
    echo ""
    echo "  Docker is installed but not running."
    echo "  Start Docker Desktop and try again."
    echo ""
    exit 1
fi

# ── Parse .env ───────────────────────────────────────────────────────────────
get_env() {
    local key="$1"
    local default="$2"
    if [ -f "$SCRIPT_DIR/.env" ]; then
        local val
        val=$(grep -E "^${key}=" "$SCRIPT_DIR/.env" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '\r')
        if [ -n "$val" ]; then echo "$val"; return; fi
    fi
    echo "$default"
}

KOKORO_ENABLED=$(get_env "TTS_KOKORO_ENABLED" "false")
KOKORO_DEVICE=$(get_env "KOKORO_DEVICE" "cpu")
ACTION="${1:-up}"

# ── Build compose command ────────────────────────────────────────────────────
FILES="-f docker-compose.yml"
PROFILES=""

if [ "$KOKORO_ENABLED" = "true" ]; then
    PROFILES="--profile kokoro"
    if [ "$KOKORO_DEVICE" = "gpu" ]; then
        FILES="$FILES -f docker-compose.gpu.yml"
    fi
fi

BASE="docker compose $FILES $PROFILES"

# ── Kokoro first-time download check ────────────────────────────────────────
check_kokoro_image() {
    if [ "$KOKORO_ENABLED" != "true" ]; then return; fi
    if [ "$ACTION" != "up" ] && [ "$ACTION" != "restart" ]; then return; fi

    local image="ghcr.io/remsky/kokoro-fastapi-${KOKORO_DEVICE}:v0.2.4-master"

    if ! docker image inspect "$image" &> /dev/null; then
        echo ""
        echo "  Kokoro TTS ($KOKORO_DEVICE) image not found locally."
        echo "  The image is ~4GB and will be downloaded on first run."
        echo "  This may take a while depending on your connection."
        echo ""
        read -r -p "  Continue? [Y/n] " response
        case "$response" in
            [nN]|[nN][oO])
                echo "  Aborted."
                exit 0
                ;;
        esac
        echo ""
    fi
}

# ── Run ──────────────────────────────────────────────────────────────────────
case "$ACTION" in
    up)
        check_kokoro_image
        echo "> $BASE up -d --build"
        $BASE up -d --build
        ;;
    down)
        echo "> $BASE down"
        $BASE down
        ;;
    restart)
        check_kokoro_image
        echo "> $BASE down"
        $BASE down
        echo "> $BASE up -d --build"
        $BASE up -d --build
        ;;
    logs)
        $BASE logs -f --tail 50
        ;;
    build)
        echo "> $BASE build"
        $BASE build
        ;;
    *)
        echo "> $BASE $*"
        $BASE "$@"
        ;;
esac
