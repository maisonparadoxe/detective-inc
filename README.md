# Détectives Inc. - Structure du projet

## 📁 Structure des fichiers

```
detective-inc/
├── index.html          # Page principale du jeu
├── style.css           # Tous les styles CSS
├── game.js             # Logique du jeu + chargement JSON
└── data/               # Données du jeu (JSON)
    ├── crimes.json     # Toutes les enquêtes (10 actuellement)
    ├── detectives.json # Tous les détectives (8 actuellement)
    ├── bonus.json      # Cartes bonus (8 actuellement)
    ├── events.json     # Événements quotidiens (8 actuellement)
    └── hire.json       # Candidats à recruter (4 actuellement)
```

## 🚀 Déploiement sur GitHub Pages

1. **Créer un nouveau dépôt** (ou utiliser l'existant)
2. **Upload tous les fichiers** en respectant la structure
3. **Activer GitHub Pages** dans Settings → Pages → Source: main branch
4. **C'est prêt !** Le jeu sera accessible à `https://[username].github.io/[repo]/`

## ✏️ Ajouter du contenu

### Ajouter une nouvelle enquête

Éditez `data/crimes.json` et ajoutez :

```json
{
  "id": 11,
  "titre": "Le Vol du Manuscrit",
  "type": "reflexion",
  "desc": "Un manuscrit rare a disparu de la Bibliothèque Nationale.",
  "action": 2,
  "reflexion": 4,
  "danger": 1,
  "recompense": 350,
  "temps": 1,
  "tag": "Réaliste",
  "histoire": "Les portes étaient fermées, mais une fenêtre était entrouverte.",
  "fins": {
    "succes": "Le manuscrit est retrouvé chez un collectionneur privé.",
    "echec": "Le manuscrit est perdu à jamais."
  }
}
```

### Ajouter un nouveau détective

Éditez `data/detectives.json` :

```json
{
  "id": 9,
  "nom": "Sophie Mercier",
  "age": 33,
  "action": 3,
  "reflexion": 4,
  "danger": 2,
  "salaire": 110,
  "corrompu": false,
  "malade": false,
  "traits": [
    {
      "nom": "Intuitive",
      "effet": "reflexion",
      "bonus": 5,
      "tooltip": "+5% sur crimes de Réflexion",
      "type": "positive"
    }
  ],
  "bio": "Ancienne profileuse. Comprend les motivations cachées."
}
```

### Ajouter un événement

Éditez `data/events.json` :

```json
{
  "id": 9,
  "titre": "Épidémie de grippe",
  "desc": "Une grippe sévit dans la ville. Un détective aléatoire tombe malade.",
  "effet": "random-sick"
}
```

## 🎯 Avantages de cette structure

✅ **Facile à éditer** - Les données sont en JSON lisible
✅ **Scalable** - Ajoutez 100+ crimes sans ralentir le jeu
✅ **Modulaire** - Changez les données sans toucher au code
✅ **Gratuit** - Hébergement 100% gratuit sur GitHub Pages
✅ **Collaboratif** - Facile de déléguer l'écriture de contenu
✅ **Versionné** - Git track tous les changements

## 🔧 Développement local

Pour tester localement, vous avez besoin d'un serveur web (à cause de fetch() sur les JSON).

**Option 1 : Python**
```bash
cd detective-inc
python -m http.server 8000
# Ouvrir http://localhost:8000
```

**Option 2 : Node.js**
```bash
npm install -g http-server
cd detective-inc
http-server
```

**Option 3 : VS Code**
Installez l'extension "Live Server" et clic-droit → "Open with Live Server"

## 📊 Statistiques actuelles

- **10 enquêtes** (5 Réalistes, 5 Fantastiques)
- **8 détectives** (dont 2 corrompus, 1 malade)
- **8 cartes bonus**
- **8 événements**
- **4 candidats recrutables**

**Potentiel de croissance :** Facile d'atteindre 100+ enquêtes !

## 🎨 Personnalisation

- **Styles** → `style.css`
- **Logique** → `game.js`
- **Contenu** → `data/*.json`

Séparation claire = maintenance facile !
