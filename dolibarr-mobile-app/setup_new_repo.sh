#!/bin/bash

echo "📦 Configuration d'un nouveau dépôt Git"
echo ""
echo "Pour créer un nouveau dépôt GitHub :"
echo "1. Allez sur https://github.com/new"
echo "2. Créez un nouveau dépôt (ex: dolibarr-mobile-app)"
echo "3. Ne cochez PAS 'Initialize with README'"
echo "4. Copiez l'URL du dépôt (ex: https://github.com/VOTRE_USERNAME/dolibarr-mobile-app.git)"
echo ""
read -p "Entrez l'URL de votre nouveau dépôt GitHub: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ URL non fournie. Annulation."
    exit 1
fi

echo ""
echo "🔗 Configuration du remote 'origin'..."
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

echo "✅ Remote configuré: $REPO_URL"
echo ""
echo "📤 Poussage des branches..."
git push -u origin lockfile-cleanup
git push -u origin main

echo ""
echo "✅ Configuration terminée !"
echo "Votre dépôt est maintenant connecté à: $REPO_URL"
