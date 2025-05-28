<?php
require_once 'config/config.php';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= APP_NAME ?></title>
    <link rel="stylesheet" href="assets/css/finder.css">
</head>
<body>
    <div class="finder-container">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <h1><?= APP_NAME ?></h1>
            </div>
            
            <div class="search-box">
                <input type="text" class="search-input" placeholder="Rechercher...">
            </div>
            
            <div class="sidebar-section">
                <!-- Les disques seront chargés ici -->
            </div>
        </div>
        
        <!-- Main content -->
        <div class="main-content">
            <div class="toolbar">
                <div class="breadcrumb">
                    <!-- Breadcrumb sera mis à jour ici -->
                </div>
                
                <div class="view-controls">
                    <button class="view-btn active" data-view="grid">Grille</button>
                    <button class="view-btn" data-view="list">Liste</button>
                    <button class="view-btn" data-view="tree">Arbre</button>
                    <button class="view-btn expand-all-btn">Tout déplier</button>
                </div>
            </div>
            
            <div class="content-area">
                <div class="loading">
                    <div class="spinner"></div>
                    Chargement...
                </div>
            </div>
        </div>
    </div>
    
    <script src="assets/js/finder.js"></script>
</body>
</html>
