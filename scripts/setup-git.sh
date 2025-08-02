#!/bin/bash
# Git setup script for private repository
# This script clones the repository and configures GitHub token

set -e

echo "🔐 Git yapılandırması başlatılıyor..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "📦 Git kuruluyor..."
    sudo apt-get update
    sudo apt-get install -y git
fi

# Default token
# Get token from environment, file, or use default
if [ -n "$GITHUB_TOKEN" ]; then
    DEFAULT_TOKEN="$GITHUB_TOKEN"
elif [ -f ".github-secret-token.txt" ]; then
    DEFAULT_TOKEN=$(cat .github-secret-token.txt | tr -d '\n' | tr -d ' ')
else
    DEFAULT_TOKEN="your-github-token-here"
    echo "⚠️  Token bulunamadı! .github-secret-token.txt dosyası oluşturun veya GITHUB_TOKEN env var ayarlayın"
fi

# Configure GitHub token in shell config
if [ -z "$GITHUB_TOKEN" ]; then
    token="$DEFAULT_TOKEN"
    
    # Determine shell config file
    SHELL_RC="$HOME/.bashrc"
    if [ -n "$ZSH_VERSION" ]; then
        SHELL_RC="$HOME/.zshrc"
    fi
    
    # Remove old token if exists
    if grep -q "GITHUB_TOKEN" "$SHELL_RC" 2>/dev/null; then
        sed -i '/export GITHUB_TOKEN=/d' "$SHELL_RC"
    fi
    
    # Add token to shell config
    echo "" >> "$SHELL_RC"
    echo "# GitHub Personal Access Token" >> "$SHELL_RC"
    echo "export GITHUB_TOKEN=$token" >> "$SHELL_RC"
    echo "✅ Token $SHELL_RC dosyasına eklendi"
    
    export GITHUB_TOKEN="$token"
else
    token="$GITHUB_TOKEN"
    echo "✅ GITHUB_TOKEN environment variable bulundu"
fi

# Check if already in a git repository
if [ -d ".git" ]; then
    echo "✅ Zaten bir git repository içindesiniz"
    git remote -v
    exit 0
fi

# Get repository info
read -p "GitHub kullanıcı adı: " username
read -p "Repository adı (örn: sanayicin): " repo_name

# Clone repository
echo "📥 Repository klonlanıyor..."
git clone "https://${token}@github.com/${username}/${repo_name}.git" .

# Configure credential helper
git config --global credential.helper store
echo "✅ Credential helper yapılandırıldı"

echo ""
echo "✅ Git yapılandırması tamamlandı!"
echo ""
echo "📋 Repository bilgileri:"
git remote -v
