-- Drop existing tables if they exist
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Set up extensions and configurations
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- Create ENUM types
CREATE TYPE public.bidstatus AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE public.methodology AS ENUM (
    'quant',
    'qual',
    'both'
);

CREATE TYPE public.mode_type AS ENUM (
    'Online',
    'Offline',
    'Both'
);

CREATE TYPE public.region AS ENUM (
    'north',
    'south',
    'east',
    'west'
);

CREATE TYPE public.ta_category AS ENUM (
    'B2B',
    'B2C',
    'HC - HCP',
    'HC - Patient'
);

CREATE TYPE public.userrole AS ENUM (
    'admin',
    'user',
    'manager'
);

CREATE TYPE public.userstatus AS ENUM (
    'active',
    'inactive'
);

CREATE TYPE public.userteam AS ENUM (
    'sales',
    'marketing',
    'engineering'
);

-- Create tables
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role userrole DEFAULT 'user'::userrole,
    status userstatus DEFAULT 'active'::userstatus,
    employee_id VARCHAR(50) UNIQUE,
    team userteam,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.vendor_managers (
    id SERIAL PRIMARY KEY,
    vm_id VARCHAR(50) UNIQUE NOT NULL,
    vm_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    contact_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.sales (
    id SERIAL PRIMARY KEY,
    sales_id VARCHAR(50) UNIQUE NOT NULL,
    sales_person VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    reporting_manager VARCHAR(255),
    region region,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.bids (
    id SERIAL PRIMARY KEY,
    bid_number VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    methodology methodology NOT NULL,
    mode mode_type NOT NULL,
    status bidstatus DEFAULT 'DRAFT'::bidstatus,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.bid_target_audiences (
    id SERIAL PRIMARY KEY,
    bid_id INTEGER REFERENCES bids(id),
    name VARCHAR(255) NOT NULL,
    category ta_category NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.bid_audience_countries (
    id SERIAL PRIMARY KEY,
    bid_id INTEGER REFERENCES bids(id),
    audience_id INTEGER REFERENCES bid_target_audiences(id),
    country TEXT NOT NULL,
    sample_size INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.partners (
    id SERIAL PRIMARY KEY,
    partner_id VARCHAR(50) UNIQUE NOT NULL,
    partner_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    contact_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.bid_partners (
    id SERIAL PRIMARY KEY,
    bid_id INTEGER REFERENCES bids(id),
    partner_id INTEGER REFERENCES partners(id),
    loi INTEGER NOT NULL,
    has_allocation BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.partner_responses (
    id SERIAL PRIMARY KEY,
    bid_id INTEGER REFERENCES bids(id),
    partner_id INTEGER REFERENCES partners(id),
    loi INTEGER NOT NULL,
    final_loi INTEGER,
    final_ir DECIMAL,
    final_timeline INTEGER,
    quality_rejects INTEGER,
    communication INTEGER,
    engagement INTEGER,
    problem_solving INTEGER,
    additional_feedback TEXT,
    invoice_date DATE,
    invoice_sent BOOLEAN DEFAULT false,
    invoice_serial VARCHAR(50),
    invoice_number VARCHAR(50),
    invoice_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.partner_response_countries (
    id SERIAL PRIMARY KEY,
    response_id INTEGER REFERENCES partner_responses(id),
    country TEXT NOT NULL,
    n_delivered INTEGER DEFAULT 0,
    cpi DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX ix_bids_bid_number ON public.bids(bid_number);
CREATE INDEX ix_bids_client_name ON public.bids(client_name);
CREATE INDEX ix_partners_partner_id ON public.partners(partner_id);
CREATE INDEX ix_partners_partner_name ON public.partners(partner_name);
CREATE INDEX ix_sales_sales_id ON public.sales(sales_id);
CREATE INDEX ix_sales_sales_person ON public.sales(sales_person);
CREATE INDEX ix_vendor_managers_vm_id ON public.vendor_managers(vm_id);
CREATE INDEX ix_vendor_managers_vm_name ON public.vendor_managers(vm_name);

-- Insert initial admin user (password: admin123)
INSERT INTO users (email, name, password_hash, role, employee_id, team) 
VALUES ('admin@example.com', 'Admin User', 'pbkdf2:sha256:600000$dZOF3Hk0$a8e647e6a9d6f68b910cd71f4069736e6a0b6b1c3c4f5d6e7f8a9b0c1d2e3f4', 'admin', 'EMP001', 'engineering'); 