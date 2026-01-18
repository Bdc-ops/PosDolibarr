#!/bin/bash
# Script pour augmenter la limite de fichiers ouverts sur macOS

echo "Augmentation de la limite de fichiers ouverts..."

# Augmenter la limite pour la session actuelle
ulimit -n 4096

# Vérifier la limite actuelle
echo "Limite actuelle: $(ulimit -n)"

# Pour macOS, créer un fichier de configuration système
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Configuration pour macOS..."
    
    # Créer le fichier de configuration si nécessaire
    if [ ! -f ~/.zshrc ] || ! grep -q "ulimit -n" ~/.zshrc; then
        echo "" >> ~/.zshrc
        echo "# Augmenter la limite de fichiers ouverts pour Expo/Metro" >> ~/.zshrc
        echo "ulimit -n 4096" >> ~/.zshrc
        echo "Ajouté à ~/.zshrc"
    else
        echo "Configuration déjà présente dans ~/.zshrc"
    fi
    
    # Pour une solution permanente, créer un fichier launchd
    echo ""
    echo "Pour une solution permanente, exécutez:"
    echo "sudo sysctl -w kern.maxfiles=65536"
    echo "sudo sysctl -w kern.maxfilesperproc=65536"
fi

echo ""
echo "✅ Configuration terminée!"
echo "Redémarrez votre terminal ou exécutez: source ~/.zshrc"
