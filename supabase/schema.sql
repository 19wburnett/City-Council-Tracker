-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE vote_value AS ENUM ('YEA', 'NAY', 'ABSTAIN', 'ABSENT');

-- Cities table (new - for multi-city support)
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    state VARCHAR(100) NOT NULL,
    timezone VARCHAR(100) DEFAULT 'UTC',
    website_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Council members table (normalized)
CREATE TABLE council_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    seat VARCHAR(100),
    title VARCHAR(100), -- Mayor, Council Member, etc.
    bio TEXT,
    contact_info JSONB,
    photo_url TEXT,
    committees TEXT[],
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings table (normalized)
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title VARCHAR(500),
    meeting_type VARCHAR(100), -- Regular, Special, Work Session, etc.
    agenda_url TEXT,
    minutes_url TEXT,
    video_url TEXT,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agenda items table (normalized)
CREATE TABLE agenda_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    item_number INTEGER,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- Budget, Zoning, Public Safety, etc.
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table (normalized)
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE CASCADE,
    council_member_id UUID REFERENCES council_members(id) ON DELETE CASCADE,
    vote_value vote_value NOT NULL,
    source_url TEXT,
    source_name VARCHAR(100), -- 'BRL Vote Tracker', 'Official Minutes', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agenda_item_id, council_member_id) -- One vote per member per agenda item
);

-- Quotes table (normalized)
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    council_member_id UUID REFERENCES council_members(id) ON DELETE CASCADE,
    agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    source_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_council_members_city_id ON council_members(city_id);
CREATE INDEX idx_council_members_active ON council_members(is_active);
CREATE INDEX idx_meetings_city_id ON meetings(city_id);
CREATE INDEX idx_meetings_date ON meetings(date);
CREATE INDEX idx_agenda_items_meeting_id ON agenda_items(meeting_id);
CREATE INDEX idx_votes_agenda_item_id ON votes(agenda_item_id);
CREATE INDEX idx_votes_council_member_id ON votes(council_member_id);
CREATE INDEX idx_quotes_council_member_id ON quotes(council_member_id);
CREATE INDEX idx_quotes_agenda_item_id ON quotes(agenda_item_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_council_members_updated_at BEFORE UPDATE ON council_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agenda_items_updated_at BEFORE UPDATE ON agenda_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Allow public read access to council_members" ON council_members FOR SELECT USING (true);
CREATE POLICY "Allow public read access to meetings" ON meetings FOR SELECT USING (true);
CREATE POLICY "Allow public read access to agenda_items" ON agenda_items FOR SELECT USING (true);
CREATE POLICY "Allow public read access to votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to quotes" ON quotes FOR SELECT USING (true);

-- Create policies for authenticated users to insert/update (for admin functions)
CREATE POLICY "Allow authenticated users to insert cities" ON cities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update cities" ON cities FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert council_members" ON council_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update council_members" ON council_members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert meetings" ON meetings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update meetings" ON meetings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert agenda_items" ON agenda_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update agenda_items" ON agenda_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert votes" ON votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update votes" ON votes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert quotes" ON quotes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update quotes" ON quotes FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert Boulder as the first city
INSERT INTO cities (name, state, timezone, website_url) 
VALUES ('Boulder', 'Colorado', 'America/Denver', 'https://bouldercolorado.gov');
