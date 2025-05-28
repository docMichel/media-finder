<?php
require_once __DIR__ . '/../config/database.php';

class MediaModel
{
    private $db;

    public function __construct()
    {
        $database = new Database();
        $this->db = $database->connect();
    }

    /**
     * Récupère tous les disques actifs
     */
    public function getDisks()
    {
        $sql = "SELECT d.*,
       COALESCE(dos.nb_dossiers, 0) AS nb_dossiers,
       COALESCE(f.nb_fichiers, 0) AS nb_fichiers,
       COALESCE(f.taille_totale, 0) AS taille_totale
FROM disques d
LEFT JOIN (
    SELECT disque_id, COUNT(*) AS nb_dossiers
    FROM dossiers
    GROUP BY disque_id
) dos ON d.id = dos.disque_id
LEFT JOIN (
    SELECT disque_id, COUNT(*) AS nb_fichiers, SUM(taille) AS taille_totale
    FROM fichiers
    WHERE statut = 'OK'
    GROUP BY disque_id
) f ON d.id = f.disque_id
WHERE d.actif = TRUE
ORDER BY d.nom;";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Récupère les dossiers d'un disque ou d'un parent
     */
    public function getFolders($disk_id, $parent_id = null)
    {
        $sql = "SELECT d.id, d.uuid, d.nom_dossier, d.chemin_complet, d.niveau,
                       d.parent_id, d.disque_id,
                       COUNT(DISTINCT sd.id) as nb_sous_dossiers,
                       COUNT(DISTINCT f.id) as nb_fichiers_directs,
                       COALESCE(SUM(f.taille), 0) as taille_totale
                FROM dossiers d
                LEFT JOIN dossiers sd ON d.id = sd.parent_id
                LEFT JOIN fichiers f ON d.id = f.dossier_id AND f.statut = 'OK'
                WHERE d.disque_id = :disk_id";

        if ($parent_id === null) {
            $sql .= " AND d.parent_id IS NULL";
        } else {
            $sql .= " AND d.parent_id = :parent_id";
        }

        $sql .= " GROUP BY d.id ORDER BY d.nom_dossier";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':disk_id', $disk_id, PDO::PARAM_INT);
        if ($parent_id !== null) {
            $stmt->bindParam(':parent_id', $parent_id, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Récupère les fichiers d'un dossier
     */
    public function getFiles($folder_id, $limit = null)
    {
        $sql = "SELECT f.*, d.nom as disque_nom
                FROM fichiers f
                JOIN disques d ON f.disque_id = d.id
                WHERE f.dossier_id = :folder_id AND f.statut = 'OK'
                ORDER BY f.nom_fichier";

        if ($limit) {
            $sql .= " LIMIT :limit";
        }

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':folder_id', $folder_id, PDO::PARAM_INT);
        if ($limit) {
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Recherche dans les fichiers
     */
    public function searchFiles($query, $disk_id = null, $type = null, $limit = null)
    {
        $sql = "SELECT f.*, d.nom as disque_nom, dos.nom_dossier, dos.chemin_complet as dossier_chemin
                FROM fichiers f
                JOIN disques d ON f.disque_id = d.id
                JOIN dossiers dos ON f.dossier_id = dos.id
                WHERE f.statut = 'OK' AND f.nom_fichier LIKE :query";

        if ($disk_id) {
            $sql .= " AND f.disque_id = :disk_id";
        }
        if ($type) {
            $sql .= " AND f.type_media = :type";
        }

        $sql .= " ORDER BY f.nom_fichier";
        if ($limit) {
            $sql .= " LIMIT :limit";
        }

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':query', $query);
        if ($disk_id) {
            $stmt->bindParam(':disk_id', $disk_id, PDO::PARAM_INT);
        }
        if ($type) {
            $stmt->bindParam(':type', $type);
        }
        if ($limit) {
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Récupère l'arbre complet d'un dossier (pour "tout déplier")
     */
    public function getFolderTree($disk_id, $parent_id = null)
    {
        // Requête récursive pour récupérer toute la hiérarchie
        $sql = "WITH RECURSIVE folder_tree AS (
                    SELECT id, parent_id, nom_dossier, chemin_complet, niveau, disque_id,
                           0 as depth
                    FROM dossiers 
                    WHERE disque_id = :disk_id AND parent_id " . ($parent_id ? "= :parent_id" : "IS NULL") . "
                    
                    UNION ALL
                    
                    SELECT d.id, d.parent_id, d.nom_dossier, d.chemin_complet, d.niveau, d.disque_id,
                           ft.depth + 1
                    FROM dossiers d
                    INNER JOIN folder_tree ft ON d.parent_id = ft.id
                )
                SELECT ft.*, 
                       COUNT(DISTINCT f.id) as nb_fichiers_directs
                FROM folder_tree ft
                LEFT JOIN fichiers f ON ft.id = f.dossier_id AND f.statut = 'OK'
                GROUP BY ft.id
                ORDER BY ft.niveau, ft.nom_dossier";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':disk_id', $disk_id, PDO::PARAM_INT);
        if ($parent_id) {
            $stmt->bindParam(':parent_id', $parent_id, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Obtient le chemin complet d'un élément (breadcrumb)
     */
    public function getBreadcrumb($type, $id)
    {
        if ($type === 'disk') {
            $sql = "SELECT id, nom as name, 'disk' as type FROM disques WHERE id = :id";
        } else {
            // Pour les dossiers, on remonte la hiérarchie
            $sql = "WITH RECURSIVE breadcrumb AS (
                        SELECT id, parent_id, nom_dossier as name, disque_id, 'folder' as type, 0 as level
                        FROM dossiers WHERE id = :id
                        
                        UNION ALL
                        
                        SELECT d.id, d.parent_id, d.nom_dossier, d.disque_id, 'folder', b.level + 1
                        FROM dossiers d
                        INNER JOIN breadcrumb b ON d.id = b.parent_id
                    )
                    SELECT b.*, dis.nom as disk_name
                    FROM breadcrumb b
                    JOIN disques dis ON b.disque_id = dis.id
                    ORDER BY b.level DESC";
        }

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
