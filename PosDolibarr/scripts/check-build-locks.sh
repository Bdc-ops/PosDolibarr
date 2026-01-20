#!/bin/bash
# Script pour vérifier les processus et verrous liés aux builds Xcode

LOG_FILE="/Users/fahd/myApp/PosDolibarr/.cursor/debug.log"

log_entry() {
  local hypothesis=$1
  local check=$2
  local result=$3
  echo "{\"timestamp\":$(date +%s000),\"location\":\"check-build-locks.sh\",\"message\":\"$check\",\"data\":{\"hypothesisId\":\"$hypothesis\",\"result\":\"$result\"},\"sessionId\":\"debug-session\",\"runId\":\"pre-fix\"}" >> "$LOG_FILE"
}

echo "Vérification des processus xcodebuild..."
xcodebuild_count=$(ps aux | grep -i xcodebuild | grep -v grep | wc -l | tr -d ' ')
log_entry "H1" "xcodebuild_process_count" "$xcodebuild_count"

echo "Vérification des processus Xcode..."
xcode_count=$(ps aux | grep -i "Xcode.app" | grep -v grep | wc -l | tr -d ' ')
log_entry "H2" "xcode_app_process_count" "$xcode_count"

echo "Vérification des processus expo..."
expo_count=$(ps aux | grep -i "expo" | grep -v grep | wc -l | tr -d ' ')
log_entry "H5" "expo_process_count" "$expo_count"

echo "Vérification de l'existence du fichier build.db..."
if [ -f "/Users/fahd/Library/Developer/Xcode/DerivedData/DolibarrPOS-camlumkvmpzwzxefpnztoyocffqo/Build/Intermediates.noindex/XCBuildData/build.db" ]; then
  db_exists="true"
  db_size=$(ls -lh "/Users/fahd/Library/Developer/Xcode/DerivedData/DolibarrPOS-camlumkvmpzwzxefpnztoyocffqo/Build/Intermediates.noindex/XCBuildData/build.db" | awk '{print $5}')
  log_entry "H3" "build_db_exists" "{\"exists\":\"$db_exists\",\"size\":\"$db_size\"}"
else
  db_exists="false"
  log_entry "H3" "build_db_exists" "{\"exists\":\"$db_exists\"}"
fi

echo "Vérification des lsof sur build.db..."
if [ -f "/Users/fahd/Library/Developer/Xcode/DerivedData/DolibarrPOS-camlumkvmpzwzxefpnztoyocffqo/Build/Intermediates.noindex/XCBuildData/build.db" ]; then
  locked_by=$(lsof "/Users/fahd/Library/Developer/Xcode/DerivedData/DolibarrPOS-camlumkvmpzwzxefpnztoyocffqo/Build/Intermediates.noindex/XCBuildData/build.db" 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')
  log_entry "H3" "build_db_locked_by" "$locked_by"
fi

echo "Vérification de l'état des DerivedData..."
derived_data_path="/Users/fahd/Library/Developer/Xcode/DerivedData/DolibarrPOS-camlumkvmpzwzxefpnztoyocffqo"
if [ -d "$derived_data_path" ]; then
  derived_data_size=$(du -sh "$derived_data_path" 2>/dev/null | awk '{print $1}')
  log_entry "H4" "derived_data_exists" "{\"exists\":\"true\",\"size\":\"$derived_data_size\"}"
else
  log_entry "H4" "derived_data_exists" "{\"exists\":\"false\"}"
fi

echo "=== Résumé ==="
echo "Processus xcodebuild: $xcodebuild_count"
echo "Processus Xcode.app: $xcode_count"
echo "Processus expo: $expo_count"
echo "Fichier build.db existe: $db_exists"
if [ -f "/Users/fahd/Library/Developer/Xcode/DerivedData/DolibarrPOS-camlumkvmpzwzxefpnztoyocffqo/Build/Intermediates.noindex/XCBuildData/build.db" ]; then
  echo "Fichiers verrouillant build.db: $locked_by"
fi
