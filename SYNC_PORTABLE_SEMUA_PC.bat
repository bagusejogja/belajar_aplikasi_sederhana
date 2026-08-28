@echo off
title Sinkronisasi Portable Lampiran Cloudflare R2 (Semua PC)
color 0B
cls

echo ====================================================================
echo   SINKRONISASI PORTABLE LAMPIRAN CLOUDFLARE R2 (SEMUA PC)
echo   * Tidak butuh Node.js / Python / Coding (100%% Bawaan Windows)
echo   * Otomatis mengunduh ke: D:\backup_lampiran_r2
echo ====================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\sync-portable.ps1"

echo.
echo ====================================================================
echo   Proses Selesai!
echo ====================================================================
pause
