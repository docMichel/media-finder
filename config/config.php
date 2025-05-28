<?php
// Configuration du visualiseur
define('APP_NAME', 'Media Finder');
define('APP_VERSION', '1.0.0');
define('BASE_PATH', dirname(__DIR__));

// Pagination
define('ITEMS_PER_PAGE', 200);
define('MAX_SEARCH_RESULTS', 500);

// Types de fichiers et icônes
define('FILE_ICONS', [
    'VIDEO' => '🎬',
    'AUDIO' => '🎵', 
    'PHOTO' => '🖼️',
    'DOCUMENT' => '📄',
    'ARCHIVE' => '📦',
    'FOLDER' => '📁',
    'FOLDER_OPEN' => '📂'
]);

define('DISK_ICONS', [
    'USB' => '🔌',
    'INTERNAL' => '💽',
    'NETWORK' => '🌐',
    'EXTERNAL' => '💾',
    'SMB' => '🌐'
]);

// Commandes système (sera utilisé plus tard)
define('RSYNC_PATH', '/usr/bin/rsync');
define('COMMANDS_QUEUE_DIR', BASE_PATH . '/cache/commands');
?>
