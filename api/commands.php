<?php
/*
 * API pour les commandes de déplacement/copie (à implémenter plus tard)
 * Génère des commandes rsync qui seront exécutées en différé
 */
header('Content-Type: application/json');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'move':
            // TODO: Générer commande de déplacement
            $source = $_POST['source'] ?? '';
            $target = $_POST['target'] ?? '';
            
            // Ici on générera la commande rsync et on la stockera
            $command_id = generateMoveCommand($source, $target);
            
            echo json_encode([
                'success' => true, 
                'command_id' => $command_id,
                'message' => 'Commande de déplacement générée'
            ]);
            break;
            
        case 'copy':
            // TODO: Générer commande de copie
            echo json_encode(['success' => true, 'message' => 'À implémenter']);
            break;
            
        case 'status':
            // TODO: Vérifier le statut d'une commande
            $command_id = $_GET['command_id'] ?? '';
            echo json_encode(['success' => true, 'status' => 'pending']);
            break;
            
        default:
            throw new Exception('Action non supportée');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function generateMoveCommand($source, $target) {
    // TODO: Implémenter la génération de commandes rsync
    // Stocker dans COMMANDS_QUEUE_DIR
    return uniqid('cmd_');
}
?>
