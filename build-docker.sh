#!/bin/bash

# CloudVPS - Docker Build Script
# This script builds the Docker image for CloudVPS

echo "🐳 Building CloudVPS Docker Image..."
echo "===================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your actual values."
    echo ""
    echo "🔑 Required environment variables:"
    echo "   - GOOGLE_CLIENT_ID (from Google Cloud Console)"
    echo "   - GOOGLE_CLIENT_SECRET (from Google Cloud Console)"
    echo "   - NEXTAUTH_SECRET (random secret key)"
    echo "   - HOSTBILL_API_ID (from HostBill admin)"
    echo "   - HOSTBILL_API_KEY (from HostBill admin)"
    echo ""
    echo "⚠️  Please configure these values before running the container!"
    echo ""
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t cloudvps:latest .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Docker image built successfully!"
    echo ""
    echo "🚀 To run the container:"
    echo "   docker-compose up -d"
    echo ""
    echo "🌐 Or run directly:"
    echo "   docker run -p 3000:3000 --env-file .env cloudvps:latest"
    echo ""
    echo "📊 CloudVPS will be available at:"
    echo "   http://localhost:3000"
    echo ""
    echo "🔗 Key endpoints:"
    echo "   http://localhost:3000/vps - VPS selection"
    echo "   http://localhost:3000/billing - Billing form"
    echo "   http://localhost:3000/api/auth/signin - Google OAuth login"
    echo ""
    echo "⚠️  Important notes:"
    echo "   - Google OAuth requires proper domain configuration"
    echo "   - Middleware must be running on port 3005"
    echo "   - HostBill API credentials must be valid"
    echo ""
else
    echo ""
    echo "❌ Docker build failed!"
    echo "Please check the error messages above."
    exit 1
fi
