#!/bin/bash

# NPC World - Quick Start Script
# This script helps you quickly start the NPC World services

set -e

echo "🌍 NPC World - Quick Start"
echo "=========================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created. You can edit it to customize your configuration."
    echo ""
fi

# Start services
echo "🚀 Starting NPC World services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to initialize (30 seconds)..."
sleep 30

# Check service status
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "✅ NPC World is ready!"
echo ""
echo "🌐 Access points:"
echo "  - Web Home:         http://localhost:8080/"
echo "  - Registration:     http://localhost:8080/register.php"
echo "  - WebSocket Client: http://localhost:8080/client.html"
echo "  - REST API:         http://localhost:3000/"
echo "  - WebSocket:        ws://localhost:3000/ws"
echo ""
echo "📚 Documentation: See README.md for API documentation and usage examples"
echo ""
echo "🛠️  Useful commands:"
echo "  - View logs:        docker compose logs -f"
echo "  - Stop services:    docker compose down"
echo "  - Restart services: docker compose restart"
echo ""
