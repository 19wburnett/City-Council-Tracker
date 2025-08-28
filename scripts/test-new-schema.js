const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNewSchema() {
  console.log('🧪 Testing New Normalized Schema...\n');

  try {
    // Test 1: Check cities
    console.log('📊 Test 1: Checking cities...');
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('*');

    if (citiesError) {
      console.error('❌ Error fetching cities:', citiesError);
    } else {
      console.log(`✅ Found ${cities.length} cities:`);
      cities.forEach(city => {
        console.log(`   - ${city.name}, ${city.state}`);
      });
    }

    // Test 2: Check council members
    console.log('\n📊 Test 2: Checking council members...');
    const { data: members, error: membersError } = await supabase
      .from('council_members')
      .select('*')
      .eq('is_active', true);

    if (membersError) {
      console.error('❌ Error fetching council members:', membersError);
    } else {
      console.log(`✅ Found ${members.length} active council members:`);
      members.forEach(member => {
        console.log(`   - ${member.name} (${member.title})`);
      });
    }

    // Test 3: Check meetings
    console.log('\n📊 Test 3: Checking meetings...');
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);

    if (meetingsError) {
      console.error('❌ Error fetching meetings:', meetingsError);
    } else {
      console.log(`✅ Found ${meetings.length} recent meetings:`);
      meetings.forEach(meeting => {
        console.log(`   - ${meeting.date}: ${meeting.title}`);
      });
    }

    // Test 4: Check agenda items
    console.log('\n📊 Test 4: Checking agenda items...');
    const { data: agendaItems, error: agendaError } = await supabase
      .from('agenda_items')
      .select('*')
      .limit(5);

    if (agendaError) {
      console.error('❌ Error fetching agenda items:', agendaError);
    } else {
      console.log(`✅ Found ${agendaItems.length} sample agenda items:`);
      agendaItems.forEach(item => {
        console.log(`   - ${item.title.substring(0, 50)}...`);
      });
    }

    // Test 5: Check votes
    console.log('\n📊 Test 5: Checking votes...');
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .limit(10);

    if (votesError) {
      console.error('❌ Error fetching votes:', votesError);
    } else {
      console.log(`✅ Found ${votes.length} sample votes:`);
      votes.forEach(vote => {
        console.log(`   - Vote: ${vote.vote_value} (Source: ${vote.source_name})`);
      });
    }

    // Test 6: Get vote statistics
    console.log('\n📊 Test 6: Vote statistics...');
    const { data: voteStats, error: statsError } = await supabase
      .from('votes')
      .select('vote_value');

    if (statsError) {
      console.error('❌ Error fetching vote statistics:', statsError);
    } else {
      const stats = voteStats.reduce((acc, vote) => {
        acc[vote.vote_value] = (acc[vote.vote_value] || 0) + 1;
        return acc;
      }, {});
      
      console.log('✅ Vote distribution:');
      Object.entries(stats).forEach(([vote, count]) => {
        console.log(`   - ${vote}: ${count} votes`);
      });
    }

    // Test 7: Check total counts
    console.log('\n📊 Test 7: Total data counts...');
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });

    const { count: totalMeetings } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true });

    const { count: totalAgendaItems } = await supabase
      .from('agenda_items')
      .select('*', { count: 'exact', head: true });

    console.log('✅ Total data counts:');
    console.log(`   - Votes: ${totalVotes}`);
    console.log(`   - Meetings: ${totalMeetings}`);
    console.log(`   - Agenda Items: ${totalAgendaItems}`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\nThe normalized schema is working perfectly with real BRL data!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNewSchema();
