@echo off
setlocal enabledelayedexpansion

:: Reads .env and starts docker compose with the correct profiles.
::
:: Usage:
::   docker-start.cmd            — start (build + up)
::   docker-start.cmd down       — stop everything
::   docker-start.cmd logs       — tail logs
::   docker-start.cmd restart    — down + up

:: ── Check Docker is installed ───────────────────────────────────────────────
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   Docker is not installed or not in PATH.
    echo.
    echo   Install Docker Desktop:
    echo     https://www.docker.com/products/docker-desktop/
    echo.
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   Docker is installed but not running.
    echo   Start Docker Desktop and try again.
    echo.
    exit /b 1
)

:: ── Parse .env ──────────────────────────────────────────────────────────────
set "KOKORO_ENABLED=false"
set "KOKORO_DEVICE=cpu"

if exist "%~dp0.env" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%~dp0.env") do (
        set "line=%%a"
        if not "!line:~0,1!"=="#" (
            if "%%a"=="TTS_KOKORO_ENABLED" set "KOKORO_ENABLED=%%b"
            if "%%a"=="KOKORO_DEVICE" set "KOKORO_DEVICE=%%b"
        )
    )
)

:: ── Build compose command ───────────────────────────────────────────────────
set "FILES=-f docker-compose.yml"
set "PROFILES="

if "%KOKORO_ENABLED%"=="true" (
    set "PROFILES=--profile kokoro"
    if "%KOKORO_DEVICE%"=="gpu" (
        set "FILES=!FILES! -f docker-compose.gpu.yml"
    )
)

set "BASE=docker compose %FILES% %PROFILES%"

:: ── Action ──────────────────────────────────────────────────────────────────
set "ACTION=%~1"
if "%ACTION%"=="" set "ACTION=up"

if "%ACTION%"=="up" goto :action_up
if "%ACTION%"=="down" goto :action_down
if "%ACTION%"=="restart" goto :action_restart
if "%ACTION%"=="logs" goto :action_logs
if "%ACTION%"=="build" goto :action_build
goto :action_passthrough

:action_up
call :check_kokoro_image
echo ^> %BASE% up -d --build
%BASE% up -d --build
goto :eof

:action_down
echo ^> %BASE% down
%BASE% down
goto :eof

:action_restart
call :check_kokoro_image
echo ^> %BASE% down
%BASE% down
echo ^> %BASE% up -d --build
%BASE% up -d --build
goto :eof

:action_logs
%BASE% logs -f --tail 50
goto :eof

:action_build
echo ^> %BASE% build
%BASE% build
goto :eof

:action_passthrough
echo ^> %BASE% %*
%BASE% %*
goto :eof

:: ── Kokoro first-time download check ────────────────────────────────────────
:check_kokoro_image
if not "%KOKORO_ENABLED%"=="true" goto :eof
if "%ACTION%"=="down" goto :eof
if "%ACTION%"=="logs" goto :eof

set "IMAGE=ghcr.io/remsky/kokoro-fastapi-%KOKORO_DEVICE%:v0.2.4-master"
docker image inspect "%IMAGE%" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   Kokoro TTS ^(%KOKORO_DEVICE%^) image not found locally.
    echo   The image is ~4GB and will be downloaded on first run.
    echo   This may take a while depending on your connection.
    echo.
    set /p "CONFIRM=  Continue? [Y/n] "
    if /i "!CONFIRM!"=="n" (
        echo   Aborted.
        exit /b 0
    )
    echo.
)
goto :eof
