# Test SSH Connection Script
# Rychlý test připojení na Linux server

param(
    [string]$ServerIP = "10.233.1.136",
    [string]$Username = "root"
)

Write-Host "🔍 Testing SSH Connection to $ServerIP" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Yellow

# Test 1: Ping server
Write-Host "`n1️⃣ Testing network connectivity..." -ForegroundColor Cyan
try {
    $pingResult = Test-Connection -ComputerName $ServerIP -Count 2 -Quiet
    if ($pingResult) {
        Write-Host "✅ Server is reachable" -ForegroundColor Green
    } else {
        Write-Host "❌ Server is not reachable" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Network test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: SSH port check
Write-Host "`n2️⃣ Testing SSH port (22)..." -ForegroundColor Cyan
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.ConnectAsync($ServerIP, 22).Wait(5000)
    if ($tcpClient.Connected) {
        Write-Host "✅ SSH port 22 is open" -ForegroundColor Green
        $tcpClient.Close()
    } else {
        Write-Host "❌ SSH port 22 is not accessible" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ SSH port test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: SSH client availability
Write-Host "`n3️⃣ Testing SSH client..." -ForegroundColor Cyan
try {
    $sshVersion = ssh -V 2>&1
    Write-Host "✅ SSH client available: $sshVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ SSH client not found. Please install OpenSSH Client." -ForegroundColor Red
    Write-Host "Run: Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0" -ForegroundColor Yellow
    exit 1
}

# Test 4: SSH connection test
Write-Host "`n4️⃣ Testing SSH connection..." -ForegroundColor Cyan
Write-Host "You will be prompted for password: Obchudek2017" -ForegroundColor Yellow

try {
    $testCommand = "echo 'SSH connection successful'"
    $result = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$Username@$ServerIP" $testCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SSH connection successful!" -ForegroundColor Green
        Write-Host "Server response: $result" -ForegroundColor Green
    } else {
        Write-Host "❌ SSH connection failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ SSH connection test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 5: HostBill directory check
Write-Host "`n5️⃣ Checking HostBill installation..." -ForegroundColor Cyan
try {
    $hostbillCheck = ssh -o ConnectTimeout=10 "$Username@$ServerIP" "ls -la /home/hostbill/public_html/ | head -5"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ HostBill directory accessible" -ForegroundColor Green
        Write-Host "Directory contents:" -ForegroundColor Cyan
        Write-Host $hostbillCheck -ForegroundColor Gray
    } else {
        Write-Host "❌ HostBill directory not found or not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ HostBill check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 SSH Connection Test Complete!" -ForegroundColor Green
Write-Host "You can now proceed with module installation." -ForegroundColor Yellow
Write-Host "`nNext step: Run install-hostbill-modules.ps1" -ForegroundColor Cyan
