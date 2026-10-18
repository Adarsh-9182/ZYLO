CREATE SEQUENCE IF NOT EXISTS admin_product_id_seq START WITH 10000;
SELECT setval('admin_product_id_seq', greatest((SELECT coalesce(max(id),0)+1 FROM products), (SELECT last_value FROM admin_product_id_seq)), false);
ALTER TABLE products ALTER COLUMN id SET DEFAULT nextval('admin_product_id_seq');
ALTER TABLE products ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku varchar(80);
ALTER TABLE products ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_active_idx ON products(active);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status varchar(20) NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier varchar(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number varchar(120);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS internal_note text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS orders_placed_at_idx ON orders(placed_at DESC);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders(lower(email));
CREATE TABLE IF NOT EXISTS admin_users (
 id integer PRIMARY KEY CHECK (id = 1), email varchar(200) UNIQUE, password_hash text,
 setup_token_hash text, setup_expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_sessions (
 token_hash text PRIMARY KEY, admin_id integer NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx ON admin_sessions(expires_at);
CREATE TABLE IF NOT EXISTS admin_login_attempts (
 key text PRIMARY KEY, attempts integer NOT NULL DEFAULT 1, reset_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS store_settings (
 id integer PRIMARY KEY CHECK (id = 1), store_name varchar(120) NOT NULL DEFAULT 'Zylo',
 support_email varchar(200) NOT NULL DEFAULT '', support_phone varchar(30) NOT NULL DEFAULT '',
 business_address text NOT NULL DEFAULT '', low_stock_threshold integer NOT NULL DEFAULT 10,
 shipping_paise integer NOT NULL DEFAULT 0, free_shipping_above_paise integer NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO store_settings(id) VALUES(1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS inventory_movements (
 id serial PRIMARY KEY, product_id integer NOT NULL, product_title varchar(256) NOT NULL,
 delta integer NOT NULL, reason text NOT NULL, order_id integer REFERENCES orders(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_movements_product_idx ON inventory_movements(product_id, created_at DESC);
CREATE TABLE IF NOT EXISTS order_events (
 id serial PRIMARY KEY, order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 status varchar(20) NOT NULL, note text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_activity (
 id serial PRIMARY KEY, action text NOT NULL, detail text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS request_key varchar(64);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS request_hash varchar(64);
CREATE UNIQUE INDEX IF NOT EXISTS orders_request_key_unique ON orders(request_key) WHERE request_key IS NOT NULL;
CREATE TABLE IF NOT EXISTS order_access (
 token_hash text PRIMARY KEY, order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS product_media (
 id uuid PRIMARY KEY, content_type varchar(32) NOT NULL, image_base64 text NOT NULL,
 byte_size integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
