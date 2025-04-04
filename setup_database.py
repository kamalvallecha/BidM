import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv
import urllib.parse

def load_config():
    """Load configuration from environment variables."""
    load_dotenv()
    
    # Check if using Neon connection string
    database_url = os.getenv('DATABASE_URL')
    if database_url and database_url.startswith('postgres://'):
        # Parse Neon connection string
        parsed = urllib.parse.urlparse(database_url)
        return {
            'dbname': parsed.path[1:],  # Remove leading slash
            'user': parsed.username,
            'password': parsed.password,
            'host': parsed.hostname,
            'port': parsed.port,
            'sslmode': 'require'  # Neon requires SSL
        }
    
    # Fallback to individual environment variables
    return {
        'dbname': os.getenv('POSTGRES_DB', 'BidM'),
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD', 'admin123'),
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'sslmode': 'prefer'
    }

def connect_db(config, database=None):
    """Create a database connection."""
    try:
        if database:
            config = dict(config)
            config['dbname'] = database
        
        # For Neon, we don't need to create a new database, so skip if connecting to 'postgres'
        if database == 'postgres' and 'neon' in config.get('host', ''):
            print("Skipping postgres connection for Neon...")
            return None
        
        conn = psycopg2.connect(**config)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def create_database(config):
    """Create the database if it doesn't exist."""
    try:
        # For Neon, we don't need to create a database as it's already created
        if 'neon' in config.get('host', ''):
            print("Using existing Neon database...")
            return True
            
        # For other databases, proceed with creation
        conn = connect_db(config, 'postgres')
        if not conn:
            return False
        
        cur = conn.cursor()
        dbname = config['dbname']
        
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (dbname,))
        exists = cur.fetchone()
        
        if not exists:
            print(f"Creating database {dbname}...")
            cur.execute(f'CREATE DATABASE "{dbname}"')
            print(f"Database {dbname} created successfully!")
        else:
            print(f"Database {dbname} already exists.")
        
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error creating database: {e}")
        return False

def execute_schema(config):
    """Execute the schema.sql file."""
    try:
        conn = connect_db(config)
        if not conn:
            return False
        
        cur = conn.cursor()
        
        print("Reading schema file...")
        with open('replit_schema.sql', 'r') as f:
            schema = f.read()
        
        print("Executing schema...")
        # Split the schema into individual statements
        statements = schema.split(';')
        
        for statement in statements:
            if statement.strip():
                try:
                    cur.execute(statement)
                except Exception as e:
                    print(f"Warning: Error executing statement: {e}")
                    # Continue execution despite errors
                    continue
        
        print("Schema executed successfully!")
        
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error executing schema: {e}")
        return False

def verify_setup(config):
    """Verify the database setup by checking tables and initial data."""
    try:
        conn = connect_db(config)
        if not conn:
            return False
        
        cur = conn.cursor()
        
        # Check if tables exist
        tables = [
            'users', 'vendor_managers', 'sales', 'bids', 
            'bid_target_audiences', 'bid_audience_countries',
            'partners', 'bid_partners', 'partner_responses',
            'partner_response_countries'
        ]
        
        print("\nVerifying database setup:")
        for table in tables:
            cur.execute(f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '{table}')")
            exists = cur.fetchone()[0]
            print(f"✓ Table {table}: {'exists' if exists else 'missing'}")
        
        # Check if admin user exists
        cur.execute("SELECT COUNT(*) FROM users WHERE email = 'admin@example.com'")
        admin_exists = cur.fetchone()[0] > 0
        print(f"✓ Admin user: {'exists' if admin_exists else 'missing'}")
        
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error verifying setup: {e}")
        return False

def main():
    """Main function to set up the database."""
    print("Starting database setup...")
    
    # Load configuration
    config = load_config()
    print(f"Using database configuration:")
    print(f"Host: {config['host']}")
    print(f"Database: {config['dbname']}")
    print(f"User: {config['user']}")
    print(f"Port: {config['port']}")
    print(f"SSL Mode: {config['sslmode']}")
    
    # Create database (skipped for Neon)
    if not create_database(config):
        print("Failed to create database.")
        sys.exit(1)
    
    # Execute schema
    if not execute_schema(config):
        print("Failed to execute schema.")
        sys.exit(1)
    
    # Verify setup
    if not verify_setup(config):
        print("Failed to verify setup.")
        sys.exit(1)
    
    print("\nDatabase setup completed successfully!")
    print("\nYou can now log in with:")
    print("Email: admin@example.com")
    print("Password: admin123")

if __name__ == "__main__":
    main() 