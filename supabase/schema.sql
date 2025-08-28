-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE vote_value AS ENUM ('YEA', 'NAY', 'ABSTAIN', 'ABSENT');

-- Members table
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    seat VARCHAR(100) NOT NULL,
    bio TEXT,
    contact_info JSONB,
    photo_url TEXT,
    committees TEXT[],
    stance_scores JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings table
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    title VARCHAR(500),
    agenda_url TEXT,
    minutes_url TEXT,
    video_url TEXT,D
    meeting_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agenda items table
CREATE TABLE agenda_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    issue_tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decisions table (new)
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    decision_type VARCHAR(100), -- 'motion', 'resolution', 'ordinance', 'proclamation', etc.
    outcome VARCHAR(100), -- 'approved', 'denied', 'tabled', 'referred', etc.
    vote_count_yea INTEGER DEFAULT 0,
    vote_count_nay INTEGER DEFAULT 0,
    vote_count_abstain INTEGER DEFAULT 0,
    vote_count_absent INTEGER DEFAULT 0,
    source_text TEXT, -- The actual text from the minutes
    page_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decision members table (new) - tracks which members were involved in each decision
CREATE TABLE decision_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id UUID REFERENCES decisions(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    role VARCHAR(100), -- 'mover', 'seconder', 'voter', 'speaker', etc.
    vote_value vote_value,
    quote TEXT, -- Any notable quotes from the member about this decision
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES agenda_items(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    value vote_value NOT NULL,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes table
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    item_id UUID REFERENCES agenda_items(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    source_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_members_seat ON members(seat);
CREATE INDEX idx_meetings_date ON meetings(date);
CREATE INDEX idx_agenda_items_meeting_id ON agenda_items(meeting_id);
CREATE INDEX idx_decisions_meeting_id ON decisions(meeting_id);
CREATE INDEX idx_decisions_agenda_item_id ON decisions(agenda_item_id);
CREATE INDEX idx_decision_members_decision_id ON decision_members(decision_id);
CREATE INDEX idx_decision_members_member_id ON decision_members(member_id);
CREATE INDEX idx_votes_item_id ON votes(item_id);
CREATE INDEX idx_votes_member_id ON votes(member_id);
CREATE INDEX idx_quotes_member_id ON quotes(member_id);
CREATE INDEX idx_quotes_item_id ON quotes(item_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agenda_items_updated_at BEFORE UPDATE ON agenda_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON decisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_decision_members_updated_at BEFORE UPDATE ON decision_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to members" ON members FOR SELECT USING (true);
CREATE POLICY "Allow public read access to meetings" ON meetings FOR SELECT USING (true);
CREATE POLICY "Allow public read access to agenda_items" ON agenda_items FOR SELECT USING (true);
CREATE POLICY "Allow public read access to decisions" ON decisions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to decision_members" ON decision_members FOR SELECT USING (true);
CREATE POLICY "Allow public read access to votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to quotes" ON quotes FOR SELECT USING (true);

-- Create policies for authenticated users to insert/update (for admin functions)
CREATE POLICY "Allow authenticated users to insert members" ON members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update members" ON members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert meetings" ON meetings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update meetings" ON meetings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert agenda_items" ON agenda_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update agenda_items" ON agenda_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert decisions" ON decisions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update decisions" ON decisions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert decision_members" ON decision_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update decision_members" ON decision_members FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert votes" ON votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update votes" ON votes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert quotes" ON quotes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update quotes" ON quotes FOR UPDATE USING (auth.role() = 'authenticated');
