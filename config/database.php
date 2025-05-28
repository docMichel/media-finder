<?php
class Database {
    private $host = 'localhost';
    private $db_name = 'media_catalog';
    private $username = 'cataloguer';
    private $password = 'sync2025';
    private $charset = 'utf8mb4';
    public $pdo;
    
    public function connect() {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->pdo = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $e) {
            die("Erreur DB: " . $e->getMessage());
        }
        return $this->pdo;
    }
}
?>
