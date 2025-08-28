const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Correct photo URLs from the Boulder government website
const photoUrls = {
  'Aaron Brockett': 'https://bouldercolorado.gov/sites/default/files/styles/person_detail_172x172/public/2024-02/aaron-brockett-headshot_3.jpg?itok=vvLFzkh6',
  'Matt Benjamin': 'https://bouldercolorado.gov/sites/default/files/styles/person_detail_172x172/public/2023-12/matt-benjamin.jpg?itok=CehTprC1',
  'Lauren Folkerts': 'https://bouldercolorado.gov/sites/default/files/styles/person_detail_172x172/public/2023-12/lauren-folkerts.jpg?itok=8x_QY6v1',
  'Tina Marquis': 'https://bouldercolorado.gov/sites/default/files/styles/person_detail_172x172/public/2023-12/tina-marquis_1.jpg?itok=sfxmEabq',
  'Ryan Schuchard': 'https://bouldercolorado.gov/sites/default/files/styles/person_detail_172x172/public/2023-12/ryan-schchard.jpg?itok=qZWk2VKA',
  'Nicole Speer': 'https://bouldercolorado.gov/sites/default/files/styles/person_detail_172x172/public/2023-12/nicole-speer.jpg?itok=an71Qte5',
  'Mark Wallach': 'https://bouldercolorado.gov/sites/default/files/styles/person_detail_172x172/public/2023-12/mark-wallach.jpg?itok=Wq-imp70',
  'Tara Winer': 'https://bouldercolorado.gov/sites/default/files/styles/person_detail_172x172/public/2023-12/tara-winer.jpg?itok=soyvMjit',
  'Taishya Adams': 'https://bouldercolorado.gov/sites/default/files/styles/person_detail_172x172/public/2023-12/taishya-adams.jpg?itok=Y2Jx8Q4a'
}

async function updatePhotoUrls() {
  console.log('Updating photo URLs in the database...')
  
  try {
    // Get all council members
    const { data: members, error: fetchError } = await supabase
      .from('council_members')
      .select('id, name')
      .eq('is_active', true)
    
    if (fetchError) {
      console.error('Error fetching members:', fetchError)
      return
    }
    
    console.log(`Found ${members.length} active council members`)
    
    // Update each member's photo URL
    for (const member of members) {
      const correctUrl = photoUrls[member.name]
      
      if (correctUrl) {
        const { error: updateError } = await supabase
          .from('council_members')
          .update({ photo_url: correctUrl })
          .eq('id', member.id)
        
        if (updateError) {
          console.error(`Error updating ${member.name}:`, updateError)
        } else {
          console.log(`✅ Updated ${member.name} with photo URL`)
        }
      } else {
        console.log(`⚠️  No photo URL found for ${member.name}`)
      }
    }
    
    console.log('\nPhoto URL update completed!')
    
    // Verify the updates
    const { data: updatedMembers, error: verifyError } = await supabase
      .from('council_members')
      .select('name, photo_url')
      .eq('is_active', true)
    
    if (verifyError) {
      console.error('Error verifying updates:', verifyError)
      return
    }
    
    console.log('\nVerification - Current photo URLs:')
    updatedMembers.forEach(member => {
      console.log(`${member.name}: ${member.photo_url ? '✅ Has URL' : '❌ No URL'}`)
    })
    
  } catch (error) {
    console.error('Error updating photo URLs:', error)
  }
}

updatePhotoUrls()
