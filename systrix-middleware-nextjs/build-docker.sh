#!/bin/bash

# Systrix Middleware NextJS - Docker Build Script
# This script builds the Docker image for the middleware

echo "🐳 Building Systrix Middleware NextJS Docker Image..."
echo "=================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your actual values."
    echo ""
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t systrix-middleware-nextjs:latest .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Docker image built successfully!"
    echo ""
    echo "🚀 To run the container:"
    echo "   docker-compose up -d"
    echo ""
    echo "🌐 Or run directly:"
    echo "   docker run -p 3005:3005 --env-file .env systrix-middleware-nextjs:latest"
    echo ""
    echo "📊 Dashboard will be available at:"
    echo "   http://localhost:3005/dashboard"
    echo ""
    echo "🔗 API endpoints:"
    echo "   http://localhost:3005/api/status"
    echo "   http://localhost:3005/api/health"
    echo "   http://localhost:3005/api/orders/create"
    echo ""
else
    echo ""
    echo "❌ Docker build failed!"
    echo "Please check the error messages above."
    exit 1
fi
