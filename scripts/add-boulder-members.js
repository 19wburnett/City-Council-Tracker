const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const boulderCouncilMembers = [
  {
    name: 'Aaron Brockett',
    seat: 'Mayor',
    title: 'Mayor',
    bio: 'Aaron Brockett has served on Boulder City Council since 2015 and as Mayor since 2021.',
    is_active: true
  },
  {
    name: 'Lauren Folkerts',
    seat: 'Mayor Pro Tem',
    title: 'Mayor Pro Tem',
    bio: 'Lauren Folkerts was elected to Boulder City Council in 2021 and serves as Mayor Pro Tem.',
    is_active: true
  },
  {
    name: 'Matt Benjamin',
    seat: 'Council Member',
    title: 'City Council Member',
    bio: 'Matt Benjamin was elected to Boulder City Council in 2021.',
    is_active: true
  },
  {
    name: 'Tara Winer',
    seat: 'Council Member',
    title: 'City Council Member',
    bio: 'Tara Winer was elected to Boulder City Council in 2021.',
    is_active: true
  },
  {
    name: 'Tina Marquis',
    seat: 'Council Member',
    title: 'City Council Member',
    bio: 'Tina Marquis was elected to Boulder City Council in 2021.',
    is_active: true
  },
  {
    name: 'Taishya Adams',
    seat: 'Council Member',
    title: 'City Council Member',
    bio: 'Taishya Adams was elected to Boulder City Council in 2021.',
    is_active: true
  },
  {
    name: 'Bob Yates',
    seat: 'Council Member',
    title: 'City Council Member',
    bio: 'Bob Yates has served on Boulder City Council since 2015.',
    is_active: true
  },
  {
    name: 'Mark Wallach',
    seat: 'Council Member',
    title: 'City Council Member',
    bio: 'Mark Wallach was elected to Boulder City Council in 2019.',
    is_active: true
  },
  {
    name: 'Nicole Speer',
    seat: 'Council Member',
    title: 'City Council Member',
    bio: 'Nicole Speer was elected to Boulder City Council in 2021.',
    is_active: true
  }
];

async function addBoulderMembers() {
  console.log('🚀 Adding Boulder City Council members...');

  try {
    // First, get the Boulder city ID
    const { data: cities, error: cityError } = await supabase
      .from('cities')
      .select('id')
      .eq('name', 'Boulder')
      .single();

    if (cityError || !cities) {
      console.error('❌ Could not find Boulder city:', cityError);
      return;
    }

    const boulderCityId = cities.id;
    console.log('✅ Found Boulder city ID:', boulderCityId);

    // Add each council member
    for (const member of boulderCouncilMembers) {
      const { data, error } = await supabase
        .from('council_members')
        .insert({
          city_id: boulderCityId,
          ...member
        })
        .select();

      if (error) {
        console.error(`❌ Error adding ${member.name}:`, error);
      } else {
        console.log(`✅ Added ${member.name} (${member.title})`);
      }
    }

    console.log('🎉 Boulder council members added successfully!');

  } catch (error) {
    console.error('❌ Error adding Boulder members:', error);
  }
}

addBoulderMembers();
