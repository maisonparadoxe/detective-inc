#!/usr/bin/env python3
"""
Script pour convertir un CSV Google Sheets en JSON pour Détectives Inc.

Usage:
1. Exporter votre Google Sheet en CSV
2. python csv_to_json.py crimes_sheet.csv data/crimes.json
"""

import csv
import json
import sys

def csv_to_crimes_json(csv_file, json_file):
    """Convertit un CSV de crimes en JSON"""
    crimes = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            crime = {
                "id": int(row['id']),
                "titre": row['titre'],
                "type": row['type'],
                "desc": row['desc'],
                "action": int(row['action']),
                "reflexion": int(row['reflexion']),
                "danger": int(row['danger']),
                "recompense": int(row['recompense']),
                "temps": int(row['temps']),
                "tag": row['tag'],
                "histoire": row['histoire'],
                "fins": {
                    "succes": row['fin_succes'],
                    "echec": row['fin_echec']
                }
            }
            crimes.append(crime)
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(crimes, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {len(crimes)} crimes convertis → {json_file}")

def csv_to_detectives_json(csv_file, json_file):
    """Convertit un CSV de détectives en JSON"""
    detectives = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse traits (format: "Nom:effet:bonus:tooltip:type|Nom2:...")
            traits = []
            if row.get('traits'):
                for trait_str in row['traits'].split('|'):
                    parts = trait_str.split(':')
                    trait = {
                        "nom": parts[0],
                        "effet": parts[1],
                        "tooltip": parts[3],
                        "type": parts[4]
                    }
                    if parts[2]:  # bonus
                        trait["bonus"] = int(parts[2])
                    traits.append(trait)
            
            detective = {
                "id": int(row['id']),
                "nom": row['nom'],
                "age": int(row['age']),
                "action": int(row['action']),
                "reflexion": int(row['reflexion']),
                "danger": int(row['danger']),
                "salaire": int(row['salaire']),
                "corrompu": row['corrompu'].lower() == 'true',
                "malade": row['malade'].lower() == 'true',
                "traits": traits,
                "bio": row['bio']
            }
            detectives.append(detective)
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(detectives, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {len(detectives)} détectives convertis → {json_file}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python csv_to_json.py <input.csv> <output.json>")
        print("\nExemples:")
        print("  python csv_to_json.py crimes.csv data/crimes.json")
        print("  python csv_to_json.py detectives.csv data/detectives.json")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    # Détection auto du type
    if 'crime' in input_file.lower():
        csv_to_crimes_json(input_file, output_file)
    elif 'detective' in input_file.lower():
        csv_to_detectives_json(input_file, output_file)
    else:
        print("⚠️  Type non détecté. Nom de fichier doit contenir 'crime' ou 'detective'")
        sys.exit(1)
