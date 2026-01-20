#!/bin/bash
# Script pour résoudre les conflits de build Xcode

LOG_FILE="/Users/fahd/myApp/PosDolibarr/.cursor/debug.log"

log_entry() {
  local action=$1
  local result=$2
  echo "{\"timestamp\":$(date +%s000),\"location\":\"fix-build-locks.sh\",\"message\":\"$action\",\"data\":{\"result\":\"$result\"},\"sessionId\":\"debug-session\",\"runId\":\"fix\"}" >> "$LOG_FILE"
}

echo "Arrêt des processus expo en double..."
expo_pids=$(ps aux | grep -i "expo\|react-native\|metro" | grep -v grep | awk '{print $2}')
if [ -n "$expo_pids" ]; then
  for pid in $expo_pids; do
    kill -9 "$pid" 2>/dev/null && log_entry "kill_expo_process" "killed_$pid" || log_entry "kill_expo_process" "failed_$pid"
  done
  echo "Processus expo arrêtés"
else
  log_entry "kill_expo_process" "no_processes"
  echo "Aucun processus expo trouvé"
fi

echo "Nettoyage des DerivedData pour éviter les verrous..."
derived_data_path="/Users/fahd/Library/Developer/Xcode/DerivedData/DolibarrPOS-camlumkvmpzwzxefpnztoyocffqo"
if [ -d "$derived_data_path" ]; then
  rm -rf "$derived_data_path" 2>/dev/null && log_entry "clean_derived_data" "success" || log_entry "clean_derived_data" "failed"
  echo "DerivedData nettoyé"
else
  log_entry "clean_derived_data" "not_found"
  echo "DerivedData introuvable (déjà nettoyé)"
fi

echo "Nettoyage des processus xcodebuild orphelins..."
pkill -9 -f xcodebuild 2>/dev/null && log_entry "kill_xcodebuild" "killed" || log_entry "kill_xcodebuild" "no_processes"

echo "Vérification finale..."
xcodebuild_count=$(ps aux | grep -i xcodebuild | grep -v grep | wc -l | tr -d ' ')
expo_count=$(ps aux | grep -i "expo\|react-native\|metro" | grep -v grep | wc -l | tr -d ' ')
log_entry "final_check" "{\"xcodebuild\":$xcodebuild_count,\"expo\":$expo_count}"

echo "=== Nettoyage terminé ==="
echo "Processus xcodebuild restants: $xcodebuild_count"
echo "Processus expo restants: $expo_count"
echo ""
echo "⚠️  Note: Si Xcode.app est ouvert, fermez-le ou fermez le projet avant de relancer le build."
