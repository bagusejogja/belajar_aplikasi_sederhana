@echo off
title Sinkronisasi Backup Lampiran Cloudflare R2 ke Drive D
color 0A

echo ========================================================
echo   SINKRONISASI PINTAR LAMPIRAN CLOUDFLARE R2
echo   Folder Tujuan: D:\backup_lampiran_r2
echo ========================================================
echo.
echo Sedang memeriksa dan mengunduh file baru...
echo.

node scripts/sync-r2-local.js

echo.
echo ========================================================
echo   Proses Selesai!
echo ========================================================
pause
