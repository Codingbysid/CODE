#!/bin/bash

# CODE - Cognitive Dissonance Engine Installation Script
# This script helps users set up CODE on their system

echo "🚀 CODE - Cognitive Dissonance Engine Setup"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    echo "Please update Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed."
    echo "Installing Ollama..."
    
    # Install Ollama based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ollama
        else
            echo "Please install Homebrew first: https://brew.sh"
            echo "Then run: brew install ollama"
            exit 1
        fi
    else
        echo "Please install Ollama from https://ollama.com"
        exit 1
    fi
fi

echo "✅ Ollama detected"

# Start Ollama service
echo "🔄 Starting Ollama service..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    brew services start ollama
else
    ollama serve &
fi

# Wait for Ollama to start
sleep 3

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/version > /dev/null; then
    echo "❌ Ollama service failed to start"
    echo "Please start Ollama manually: ollama serve"
    exit 1
fi

echo "✅ Ollama service is running"

# Install npm dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Pull default model
echo "🤖 Pulling default model (llama3:8b)..."
ollama pull llama3:8b

if [ $? -ne 0 ]; then
    echo "⚠️  Failed to pull llama3:8b model"
    echo "You can try other models: ollama pull gpt-oss-20b"
fi

echo "✅ Setup complete!"
echo ""
echo "🎉 CODE is ready to use!"
echo "Run: npm start"
echo ""
echo "📖 For more information, see README.md"
echo "🐛 Report issues: https://github.com/Codingbysid/CODE/issues"
