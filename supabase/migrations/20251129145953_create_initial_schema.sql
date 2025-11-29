/*
  # Schéma initial pour site artisan impression 3D

  1. Nouvelles tables
    - `realizations` (réalisations)
      - `id` (uuid, clé primaire)
      - `title` (text, titre de la réalisation)
      - `description` (text, description détaillée)
      - `image_url` (text, URL de l'image principale)
      - `category` (text, catégorie: prototypage, figurine, pièce technique, etc.)
      - `created_at` (timestamptz, date de création)
      - `published` (boolean, statut de publication)
      - `order_position` (integer, ordre d'affichage)
    
    - `quote_requests` (demandes de devis)
      - `id` (uuid, clé primaire)
      - `name` (text, nom du client)
      - `email` (text, email du client)
      - `phone` (text, téléphone optionnel)
      - `message` (text, message/description du projet)
      - `file_url` (text, URL du fichier uploadé)
      - `file_name` (text, nom du fichier original)
      - `status` (text, statut: nouveau, en cours, traité)
      - `created_at` (timestamptz, date de création)
    
  2. Sécurité
    - Activer RLS sur toutes les tables
    - Les réalisations publiées sont lisibles par tous
    - Seuls les utilisateurs authentifiés peuvent gérer les réalisations
    - Les demandes de devis sont créables par tous, mais lisibles uniquement par les admins
*/

CREATE TABLE IF NOT EXISTS realizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  published boolean DEFAULT false,
  order_position integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  file_url text,
  file_name text,
  status text DEFAULT 'nouveau',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE realizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut voir les réalisations publiées"
  ON realizations FOR SELECT
  USING (published = true);

CREATE POLICY "Admins peuvent voir toutes les réalisations"
  ON realizations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins peuvent créer des réalisations"
  ON realizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins peuvent modifier des réalisations"
  ON realizations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins peuvent supprimer des réalisations"
  ON realizations FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Tout le monde peut créer une demande de devis"
  ON quote_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins peuvent voir les demandes de devis"
  ON quote_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins peuvent modifier les demandes de devis"
  ON quote_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS realizations_published_idx ON realizations(published);
CREATE INDEX IF NOT EXISTS realizations_order_idx ON realizations(order_position);
CREATE INDEX IF NOT EXISTS quote_requests_status_idx ON quote_requests(status);
CREATE INDEX IF NOT EXISTS quote_requests_created_idx ON quote_requests(created_at DESC);