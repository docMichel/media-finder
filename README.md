# 📁 Media Finder - Visualiseur Finder-like

Interface web de visualisation de catalogues multimédias avec navigation Finder-like.

## 🚀 Installation

1. **Prérequis**
   - PHP 8.0+
   - MySQL 8.0+
   - Apache avec mod_rewrite

2. **Configuration**
   - Modifier `config/database.php` avec vos paramètres MySQL
   - Assurer que la base `media_catalog` existe avec la structure appropriée

3. **Permissions**
   ```bash
   chmod 755 .
   chmod 777 cache logs
   ```

## 🎯 Fonctionnalités

- **Vue Grille** : Icônes comme le Finder Mac
- **Vue Liste** : Tableau détaillé avec colonnes
- **Vue Arbre** : Hiérarchie complète avec dépliage
- **Recherche** : Recherche en temps réel dans les fichiers
- **Navigation** : Breadcrumb cliquable
- **Sélection** : Multiple avec Cmd/Ctrl+clic

## 🎮 Raccourcis clavier

- `Cmd/Ctrl + F` : Focus sur la recherche
- `Cmd/Ctrl + A` : Sélectionner tout
- `Échap` : Désélectionner
- `Double-clic` : Ouvrir dossier/fichier

## 🔧 Structure de la base

Le visualiseur s'attend à trouver ces tables :
- `disques` : Disques/volumes
- `dossiers` : Structure hiérarchique des dossiers
- `fichiers` : Fichiers avec métadonnées

## 📈 TODO

- [ ] Drag & drop pour déplacer fichiers/dossiers
- [ ] Génération commandes rsync
- [ ] Queue d'exécution différée
- [ ] Prévisualisation fichiers
- [ ] Mode sombre

## 🛠️ API

Endpoints disponibles :
- `GET api/data.php?action=disks` : Liste des disques
- `GET api/data.php?action=folders&disk_id=X` : Dossiers d'un disque
- `GET api/data.php?action=files&folder_id=X` : Fichiers d'un dossier
- `GET api/data.php?action=search&q=terme` : Recherche
- `GET api/data.php?action=tree&disk_id=X` : Arbre complet

Réponse format : `{"success": true, "data": [...]}`
