# SINKRONISASI PORTABLE LAMPIRAN CLOUDFLARE R2 (UNTUK SEMUA PC WINDOWS)
# Tidak membutuhkan Node.js, Python, atau tools eksternal. 100% menggunakan bawaan Windows.

$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Kredensial Cloudflare R2
$AccountId = "f1d5d9635b2a504db4cf8195d06f65a5"
$AccessKey = "d8eb7d37a12f4c09e347cee4b6a16e95"
$SecretKey = "04fe9b273bf61c63aa7ec6d7ed58849339bc123f25616e44c8eb5b5d4e4e8a16"
$BucketName = "lampiran-aplikasi"
$PublicDomain = "https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev"
$EndpointHost = "$AccountId.r2.cloudflarestorage.com"

# Tentukan folder target (Gunakan Drive D jika ada, atau Drive C)
$TargetDir = "D:\backup_lampiran_r2"
if (!(Test-Path "D:\")) {
    $TargetDir = "$env:USERPROFILE\Downloads\backup_lampiran_r2"
}

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  SINKRONISASI PORTABLE LAMPIRAN CLOUDFLARE R2" -ForegroundColor Cyan
Write-Host "  Folder Tujuan : $TargetDir" -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    Write-Host "[+] Membuat folder baru: $TargetDir" -ForegroundColor Green
}

function HmacSHA256 ($keyBytes, $dataStr) {
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = $keyBytes
    return $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($dataStr))
}

function Get-S3Headers ($method, $uriPath, $queryParams) {
    $now = [DateTime]::UtcNow
    $amzDate = $now.ToString('yyyyMMddTHHmmssZ')
    $dateStamp = $now.ToString('yyyyMMdd')
    $region = "auto"
    $service = "s3"

    $canonicalHeaders = "host:$EndpointHost`nx-amz-content-sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`nx-amz-date:$amzDate`n"
    $signedHeaders = "host;x-amz-content-sha256;x-amz-date"
    $payloadHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

    $canonicalRequest = "$method`n$uriPath`n$queryParams`n$canonicalHeaders`n$signedHeaders`n$payloadHash"

    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $reqHashBytes = $sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($canonicalRequest))
    $reqHashHex = [System.BitConverter]::ToString($reqHashBytes).Replace("-", "").ToLower()

    $algorithm = "AWS4-HMAC-SHA256"
    $credentialScope = "$dateStamp/$region/$service/aws4_request"
    $stringToSign = "$algorithm`n$amzDate`n$credentialScope`n$reqHashHex"

    $kSecret = [System.Text.Encoding]::UTF8.GetBytes("AWS4" + $SecretKey)
    $kDate = HmacSHA256 $kSecret $dateStamp
    $kRegion = HmacSHA256 $kDate $region
    $kService = HmacSHA256 $kRegion $service
    $kSigning = HmacSHA256 $kService "aws4_request"

    $signatureBytes = HmacSHA256 $kSigning $stringToSign
    $signature = [System.BitConverter]::ToString($signatureBytes).Replace("-", "").ToLower()

    $authHeader = "$algorithm Credential=$AccessKey/$credentialScope, SignedHeaders=$signedHeaders, Signature=$signature"

    return @{
        "x-amz-date" = $amzDate
        "x-amz-content-sha256" = $payloadHash
        "Authorization" = $authHeader
    }
}

Write-Host "[*] Menghubungkan langsung ke Cloudflare R2 API..." -ForegroundColor Yellow
$AllObjects = @()
$ContinuationToken = ""

do {
    $queryParams = "list-type=2"
    if ($ContinuationToken) {
        $encodedToken = [System.Uri]::EscapeDataString($ContinuationToken)
        $queryParams = "continuation-token=$encodedToken&list-type=2"
    }

    $uriPath = "/$BucketName"
    $requestUrl = "https://$EndpointHost$uriPath`?$queryParams"
    $headers = Get-S3Headers "GET" $uriPath $queryParams

    try {
        $xmlResp = Invoke-RestMethod -Uri $requestUrl -Method Get -Headers $headers -TimeoutSec 30
        if ($xmlResp.ListBucketResult.Contents) {
            $AllObjects += @($xmlResp.ListBucketResult.Contents)
        }
        if ($xmlResp.ListBucketResult.IsTruncated -eq "true") {
            $ContinuationToken = $xmlResp.ListBucketResult.NextContinuationToken
        } else {
            $ContinuationToken = ""
        }
    } catch {
        Write-Host "[X] Gagal membaca bucket: $_" -ForegroundColor Red
        break
    }
} while ($ContinuationToken)

# Filter keluar file database backups/
$FilesToSync = $AllObjects | Where-Object { $_.Key -and -not $_.Key.StartsWith("backups/") }

Write-Host "[+] Ditemukan $($FilesToSync.Count) file lampiran di Cloudflare R2." -ForegroundColor Green
Write-Host "--------------------------------------------------------------------"

$Downloaded = 0
$Skipped = 0
$Errors = 0
$Index = 0

foreach ($item in $FilesToSync) {
    $Index++
    $key = $item.Key
    $size = [int64]$item.Size

    # Encode URL agar spasi dan karakter khusus aman
    $encodedKey = [System.Uri]::EscapeUriString($key)
    $url = "$PublicDomain/$encodedKey"

    # Bersihkan path lokal dan ekstensi
    $localPath = ""
    if ($key -match '^([^/]+)/(migrated_[a-zA-Z0-9_]+)\.com/.+') {
        $folder = $matches[1]
        $baseName = $matches[2]
        $folderDir = Join-Path $TargetDir $folder
        
        # Cek jika sudah ada dengan ekstensi apa pun (.png / .jpg / .pdf)
        $existing = Get-ChildItem -Path $folderDir -Filter "$baseName.*" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($existing) {
            $Skipped++
            Write-Host -NoNewline "`r[>] [$Index/$($FilesToSync.Count)] Sudah ada: $($existing.Name)"
            continue
        }
        $localPath = Join-Path $folderDir "$baseName.jpg"
    } elseif ($key.EndsWith('/view')) {
        $cleanKey = $key.Substring(0, $key.Length - 5)
        $folderDir = Split-Path -Parent (Join-Path $TargetDir $cleanKey)
        $baseName = Split-Path -Leaf $cleanKey
        $existing = Get-ChildItem -Path $folderDir -Filter "$baseName.*" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($existing) {
            $Skipped++
            Write-Host -NoNewline "`r[>] [$Index/$($FilesToSync.Count)] Sudah ada: $($existing.Name)"
            continue
        }
        $localPath = Join-Path $TargetDir ($cleanKey + ".jpg")
    } elseif (![System.IO.Path]::HasExtension($key)) {
        $folderDir = Split-Path -Parent (Join-Path $TargetDir $key)
        $baseName = Split-Path -Leaf $key
        $existing = Get-ChildItem -Path $folderDir -Filter "$baseName.*" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($existing) {
            $Skipped++
            Write-Host -NoNewline "`r[>] [$Index/$($FilesToSync.Count)] Sudah ada: $($existing.Name)"
            continue
        }
        $localPath = Join-Path $TargetDir ($key + ".jpg")
    } else {
        $localPath = Join-Path $TargetDir $key
    }

    $localDir = Split-Path -Parent $localPath
    if (!(Test-Path $localDir)) {
        New-Item -ItemType Directory -Path $localDir -Force | Out-Null
    }

    # Cek apakah file sudah ada
    if (Test-Path $localPath) {
        $existingSize = (Get-Item $localPath).Length
        if ($existingSize -eq $size -or $existingSize -gt 0) {
            $Skipped++
            Write-Host -NoNewline "`r[>] [$Index/$($FilesToSync.Count)] Sudah ada: $(Split-Path -Leaf $localPath)"
            continue
        }
    }

    # Unduh file baru
    try {
        $wc = New-Object System.Net.WebClient
        $wc.DownloadFile($url, $localPath)
        $Downloaded++
        $sizeKb = [math]::Round($size / 1024, 1)
        Write-Host "`n[+] [$Index/$($FilesToSync.Count)] Baru: $(Split-Path -Leaf $localPath) ($sizeKb KB)" -ForegroundColor Cyan
    } catch {
        $Errors++
        Write-Host "`n[X] Gagal unduh $(Split-Path -Leaf $localPath): $_" -ForegroundColor Red
    }
}

Write-Host "`n====================================================================" -ForegroundColor Green
Write-Host "  SINKRONISASI SELESAI!" -ForegroundColor Green
Write-Host "  File Baru Terunduh : $Downloaded" -ForegroundColor Green
Write-Host "  File Dilewati (Ada) : $Skipped" -ForegroundColor Yellow
Write-Host "  File Gagal         : $Errors" -ForegroundColor $(if ($Errors -gt 0) { 'Red' } else { 'Gray' })
Write-Host "  Lokasi Penyimpanan : $TargetDir" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Green
