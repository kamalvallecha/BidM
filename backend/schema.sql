-- Database Schema for BidM

-- Enums
CREATE TYPE region AS ENUM ('north', 'south', 'east', 'west');
CREATE TYPE bid_status AS ENUM ('draft', 'submitted', 'infield', 'closure', 'ready_for_invoice', 'invoiced');
CREATE TYPE methodology AS ENUM ('online', 'offline', 'mixed');

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    team VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients Table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    sales_id VARCHAR(50) UNIQUE NOT NULL,
    sales_person VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    reporting_manager VARCHAR(255) NOT NULL,
    region region NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Managers Table
CREATE TABLE vendor_managers (
    id SERIAL PRIMARY KEY,
    vm_id VARCHAR(50) UNIQUE NOT NULL,
    vm_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partners Table
CREATE TABLE partners (
    id SERIAL PRIMARY KEY,
    partner_id VARCHAR(50) UNIQUE NOT NULL,
    partner_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bids Table
CREATE TABLE bids (
    id SERIAL PRIMARY KEY,
    bid_number VARCHAR(50) UNIQUE NOT NULL,
    bid_date DATE NOT NULL,
    study_name VARCHAR(255) NOT NULL,
    methodology methodology NOT NULL,
    status bid_status DEFAULT 'draft',
    client INTEGER REFERENCES clients(id),
    sales_contact INTEGER REFERENCES sales(id),
    vm_contact INTEGER REFERENCES vendor_managers(id),
    project_requirement TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bid Target Audiences Table
CREATE TABLE bid_target_audiences (
    id SERIAL PRIMARY KEY,
    bid_id INTEGER REFERENCES bids(id) ON DELETE CASCADE,
    audience_name VARCHAR(255) NOT NULL,
    ta_category VARCHAR(100),
    broader_category VARCHAR(100),
    exact_ta_definition TEXT,
    mode VARCHAR(50),
    sample_required INTEGER,
    ir DECIMAL(5,2),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bid Audience Countries Table
CREATE TABLE bid_audience_countries (
    id SERIAL PRIMARY KEY,
    audience_id INTEGER REFERENCES bid_target_audiences(id) ON DELETE CASCADE,
    bid_id INTEGER REFERENCES bids(id) ON DELETE CASCADE,
    country VARCHAR(100) NOT NULL,
    sample_size INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bid Partners Table
CREATE TABLE bid_partners (
    id SERIAL PRIMARY KEY,
    bid_id INTEGER REFERENCES bids(id) ON DELETE CASCADE,
    partner_id INTEGER REFERENCES partners(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bid_id, partner_id)
);

-- Bid PO Numbers Table
CREATE TABLE bid_po_numbers (
    id SERIAL PRIMARY KEY,
    bid_id INTEGER REFERENCES bids(id) ON DELETE CASCADE,
    po_number VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partner Responses Table
CREATE TABLE partner_responses (
    id SERIAL PRIMARY KEY,
    bid_id INTEGER REFERENCES bids(id) ON DELETE CASCADE,
    partner_id INTEGER REFERENCES partners(id),
    response_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bid_id, partner_id)
);

-- Partner Audience Responses Table
CREATE TABLE partner_audience_responses (
    id SERIAL PRIMARY KEY,
    partner_response_id INTEGER REFERENCES partner_responses(id) ON DELETE CASCADE,
    bid_id INTEGER REFERENCES bids(id) ON DELETE CASCADE,
    audience_id INTEGER REFERENCES bid_target_audiences(id) ON DELETE CASCADE,
    country VARCHAR(100) NOT NULL,
    allocation INTEGER NOT NULL,
    n_delivered INTEGER DEFAULT 0,
    quality_rejects INTEGER DEFAULT 0,
    final_loi DECIMAL(5,2),
    final_ir DECIMAL(5,2),
    final_timeline INTEGER,
    final_cpi DECIMAL(10,2),
    cpi DECIMAL(10,2),
    communication TEXT,
    engagement TEXT,
    problem_solving TEXT,
    additional_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_bids_client ON bids(client);
CREATE INDEX idx_bids_sales_contact ON bids(sales_contact);
CREATE INDEX idx_bids_vm_contact ON bids(vm_contact);
CREATE INDEX idx_bid_target_audiences_bid_id ON bid_target_audiences(bid_id);
CREATE INDEX idx_bid_audience_countries_bid_id ON bid_audience_countries(bid_id);
CREATE INDEX idx_bid_audience_countries_audience_id ON bid_audience_countries(audience_id);
CREATE INDEX idx_bid_partners_bid_id ON bid_partners(bid_id);
CREATE INDEX idx_bid_partners_partner_id ON bid_partners(partner_id);
CREATE INDEX idx_partner_responses_bid_id ON partner_responses(bid_id);
CREATE INDEX idx_partner_responses_partner_id ON partner_responses(partner_id);
CREATE INDEX idx_partner_audience_responses_bid_id ON partner_audience_responses(bid_id);
CREATE INDEX idx_partner_audience_responses_audience_id ON partner_audience_responses(audience_id);
CREATE INDEX idx_partner_audience_responses_partner_response_id ON partner_audience_responses(partner_response_id);

-- Initial Data
-- Default admin user
INSERT INTO users (email, name, employee_id, password_hash, role, team)
VALUES (
    'admin@example.com',
    'Admin User',
    'ADMIN001',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- password: admin
    'admin',
    'Administration'
);

-- Default sales user
INSERT INTO users (email, name, employee_id, password_hash, role, team)
VALUES (
    'sales@example.com',
    'Sales User',
    'SALES001',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- password: admin
    'sales',
    'Sales'
);

-- Default VM user
INSERT INTO users (email, name, employee_id, password_hash, role, team)
VALUES (
    'vm@example.com',
    'VM User',
    'VM001',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- password: admin
    'VM',
    'Vendor Management'
);

-- Default PM user
INSERT INTO users (email, name, employee_id, password_hash, role, team)
VALUES (
    'pm@example.com',
    'PM User',
    'PM001',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- password: admin
    'PM',
    'Project Management'
);

-- Sample Clients Data
INSERT INTO clients (client_id, client_name, contact_person, email, phone, country)
VALUES 
    ('CL001', 'Acme Corporation', 'John Smith', 'john.smith@acme.com', '+1-555-123-4567', 'USA'),
    ('CL002', 'Tech Solutions Inc', 'Sarah Johnson', 'sarah.j@techsolutions.com', '+44-20-7123-4567', 'UK'),
    ('CL003', 'Global Industries', 'Michael Chen', 'm.chen@globalind.com', '+86-10-1234-5678', 'China'),
    ('CL004', 'Innovate Research', 'Emma Wilson', 'emma.w@innovaters.com', '+61-2-9876-5432', 'Australia'),
    ('CL005', 'Market Insights Ltd', 'David Brown', 'd.brown@marketinsights.com', '+1-416-555-7890', 'Canada');

-- Sample Sales Data
INSERT INTO sales (sales_id, sales_person, contact_person, reporting_manager, region)
VALUES 
    ('S001', 'Robert Taylor', 'Robert Taylor', 'James Wilson', 'north'),
    ('S002', 'Lisa Anderson', 'Lisa Anderson', 'James Wilson', 'south'),
    ('S003', 'Mark Johnson', 'Mark Johnson', 'Sarah Davis', 'east'),
    ('S004', 'Emily White', 'Emily White', 'Sarah Davis', 'west'),
    ('S005', 'Daniel Lee', 'Daniel Lee', 'James Wilson', 'north');

-- Sample Vendor Managers Data
INSERT INTO vendor_managers (vm_id, vm_name, email, phone)
VALUES 
    ('VM001', 'James Wilson', 'james.w@company.com', '+1-555-234-5678'),
    ('VM002', 'Sarah Davis', 'sarah.d@company.com', '+1-555-345-6789'),
    ('VM003', 'Michael Brown', 'michael.b@company.com', '+1-555-456-7890'),
    ('VM004', 'Jennifer Lee', 'jennifer.l@company.com', '+1-555-567-8901'),
    ('VM005', 'David Miller', 'david.m@company.com', '+1-555-678-9012');

-- Sample Partners Data
INSERT INTO partners (partner_id, partner_name, contact_person, email, phone, country)
VALUES 
    ('P001', 'Research Partners Inc', 'Thomas Clark', 't.clark@researchpartners.com', '+1-555-789-0123', 'USA'),
    ('P002', 'Global Research Solutions', 'Anna Schmidt', 'a.schmidt@globalresearch.com', '+49-30-1234-5678', 'Germany'),
    ('P003', 'Asia Research Network', 'Hiroshi Tanaka', 'h.tanaka@asianetwork.com', '+81-3-1234-5678', 'Japan'),
    ('P004', 'European Research Group', 'Maria Garcia', 'm.garcia@europeanresearch.com', '+34-91-123-4567', 'Spain'),
    ('P005', 'Latin America Research', 'Carlos Rodriguez', 'c.rodriguez@latinresearch.com', '+55-11-1234-5678', 'Brazil'); 