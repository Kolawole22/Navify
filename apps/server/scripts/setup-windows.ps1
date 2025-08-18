# Navify Backend Setup Script for Windows
# Run this script in PowerShell as Administrator

param(
    [switch]$Dev,
    [switch]$Prod,
    [switch]$Clean,
    [switch]$Help
)

function Show-Help {
    Write-Host "Navify Backend Docker Setup for Windows" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\setup-windows.ps1 [OPTIONS]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Dev      Start development environment"
    Write-Host "  -Prod     Start production environment"
    Write-Host "  -Clean    Clean up containers and volumes"
    Write-Host "  -Help     Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\setup-windows.ps1 -Dev      # Start development"
    Write-Host "  .\setup-windows.ps1 -Prod     # Start production"
    Write-Host "  .\setup-windows.ps1 -Clean    # Clean up"
}

function Test-DockerInstallation {
    Write-Host "Checking Docker installation..." -ForegroundColor Blue
    
    try {
        $dockerVersion = docker --version
        Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Docker not found. Please install Docker Desktop." -ForegroundColor Red
        Write-Host "Download from: https://docs.docker.com/desktop/windows/install/" -ForegroundColor Yellow
        exit 1
    }
    
    try {
        $composeVersion = docker-compose --version
        Write-Host "✅ Docker Compose found: $composeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Docker Compose not found." -ForegroundColor Red
        exit 1
    }
}

function Initialize-Environment {
    Write-Host "Setting up environment..." -ForegroundColor Blue
    
    # Check if .env exists, if not copy from env.example
    if (-not (Test-Path ".env")) {
        if (Test-Path "env.example") {
            Copy-Item "env.example" ".env"
            Write-Host "✅ Created .env file from env.example" -ForegroundColor Green
            Write-Host "⚠️  Please edit .env file with your configuration" -ForegroundColor Yellow
        }
        else {
            Write-Host "❌ env.example file not found" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "✅ .env file already exists" -ForegroundColor Green
    }
}

function Start-Development {
    Write-Host "Starting development environment..." -ForegroundColor Blue
    Write-Host "This will start PostgreSQL, Redis, and the API with hot reload" -ForegroundColor Yellow
    Write-Host ""
    
    docker-compose -f docker-compose.dev.yml up --build
}

function Start-Production {
    Write-Host "Starting production environment..." -ForegroundColor Blue
    Write-Host "⚠️  Make sure you've set proper environment variables!" -ForegroundColor Yellow
    Write-Host ""
    
    # Check for required production environment variables
    if (-not $env:JWT_SECRET) {
        Write-Host "❌ JWT_SECRET environment variable not set" -ForegroundColor Red
        Write-Host "Set it with: `$env:JWT_SECRET='your-secret-key'" -ForegroundColor Yellow
        exit 1
    }
    
    docker-compose up --build
}

function Clean-Docker {
    Write-Host "Cleaning up Docker containers and volumes..." -ForegroundColor Blue
    
    # Stop and remove containers
    docker-compose down -v --remove-orphans
    docker-compose -f docker-compose.dev.yml down -v --remove-orphans
    
    # Clean up unused Docker resources
    docker system prune -f
    
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
}

function Show-Status {
    Write-Host "Docker Container Status:" -ForegroundColor Blue
    docker-compose ps
    Write-Host ""
    
    Write-Host "Development Container Status:" -ForegroundColor Blue
    docker-compose -f docker-compose.dev.yml ps
}

function Show-Logs {
    Write-Host "Recent logs from all services:" -ForegroundColor Blue
    docker-compose logs --tail=50
}

# Main execution
Write-Host "=== Navify Backend Docker Setup ===" -ForegroundColor Cyan
Write-Host ""

if ($Help) {
    Show-Help
    exit 0
}

# Test Docker installation
Test-DockerInstallation

# Initialize environment
Initialize-Environment

# Execute based on parameters
if ($Clean) {
    Clean-Docker
}
elseif ($Dev) {
    Start-Development
}
elseif ($Prod) {
    Start-Production
}
else {
    Write-Host "No action specified. Use -Help for usage information." -ForegroundColor Yellow
    Write-Host ""
    Show-Status
    Write-Host ""
    Write-Host "Quick commands:" -ForegroundColor Yellow
    Write-Host "  Development: .\setup-windows.ps1 -Dev"
    Write-Host "  Production:  .\setup-windows.ps1 -Prod"
    Write-Host "  Cleanup:     .\setup-windows.ps1 -Clean"
} 