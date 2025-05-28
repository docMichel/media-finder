<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../models/MediaModel.php';
require_once __DIR__ . '/../config/config.php';

$model = new MediaModel();
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'disks':
            $data = $model->getDisks();
            break;

        case 'folders':
            $disk_id = $_GET['disk_id'] ?? null;
            $parent_id = $_GET['parent_id'] ?? null;
            if ($parent_id === 'null') $parent_id = null;
            $data = $model->getFolders($disk_id, $parent_id);
            break;

        case 'files':
            $folder_id = $_GET['folder_id'] ?? null;
            $limit = $_GET['limit'] ?? ITEMS_PER_PAGE;
            $data = $model->getFiles($folder_id, $limit);
            break;

        case 'search':
            $query = '%' . ($_GET['q'] ?? '') . '%';
            $disk_id = $_GET['disk_id'] ?? null;
            $type = $_GET['type'] ?? null;
            $limit = $_GET['limit'] ?? MAX_SEARCH_RESULTS;
            $data = $model->searchFiles($query, $disk_id, $type, $limit);
            break;

        case 'tree':
            $disk_id = $_GET['disk_id'] ?? null;
            $parent_id = $_GET['parent_id'] ?? null;
            if ($parent_id === 'null') $parent_id = null;
            $data = $model->getFolderTree($disk_id, $parent_id);
            break;

        case 'breadcrumb':
            $type = $_GET['type'] ?? 'folder';
            $id = $_GET['id'] ?? null;
            $data = $model->getBreadcrumb($type, $id);
            break;

        default:
            throw new Exception('Action non supportée');
    }

    echo json_encode(['success' => true, 'data' => $data]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
