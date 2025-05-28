<?php
// Test de l'installation
require_once 'config/database.php';

echo "<h1>Test de l'installation Media Finder</h1>";

// Test connexion base
try {
    $db = new Database();
    $conn = $db->connect();
    echo "<p>✅ Connexion à la base de données : OK</p>";
    
    // Test des tables
    $tables = ['disques', 'dossiers', 'fichiers'];
    foreach ($tables as $table) {
        $stmt = $conn->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "<p>✅ Table '$table' : OK</p>";
        } else {
            echo "<p>❌ Table '$table' : MANQUANTE</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p>❌ Erreur base de données : " . $e->getMessage() . "</p>";
}

// Test permissions
$dirs = ['cache', 'logs'];
foreach ($dirs as $dir) {
    if (is_writable($dir)) {
        echo "<p>✅ Dossier '$dir' : Accessible en écriture</p>";
    } else {
        echo "<p>⚠️ Dossier '$dir' : Permissions à vérifier</p>";
    }
}

echo "<hr>";
echo "<p><a href='index.php'>→ Accéder au Media Finder</a></p>";
?>
