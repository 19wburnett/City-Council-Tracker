const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateBobYatesStatus() {
  console.log('Updating Bob Yates status...')
  
  try {
    // Update Bob Yates to inactive
    const { data, error } = await supabase
      .from('council_members')
      .update({ 
        is_active: false,
        end_date: new Date().toISOString(),
        bio: 'Bob Yates served on Boulder City Council from 2015 to 2024. He is no longer an active council member.'
      })
      .eq('name', 'Bob Yates')
    
    if (error) {
      console.error('Error updating Bob Yates:', error)
      return
    }
    
    console.log('✅ Successfully updated Bob Yates status to inactive')
    
    // Verify the update
    const { data: bobYates, error: verifyError } = await supabase
      .from('council_members')
      .select('name, is_active, end_date, bio')
      .eq('name', 'Bob Yates')
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError)
      return
    }
    
    console.log('\nUpdated Bob Yates record:')
    console.log(JSON.stringify(bobYates[0], null, 2))
    
    // Show current active council members
    const { data: activeMembers, error: activeError } = await supabase
      .from('council_members')
      .select('name, title')
      .eq('is_active', true)
      .order('name')
    
    if (activeError) {
      console.error('Error fetching active members:', activeError)
      return
    }
    
    console.log('\nCurrent active council members:')
    activeMembers.forEach(member => {
      console.log(`- ${member.name} (${member.title})`)
    })
    
  } catch (error) {
    console.error('Error updating Bob Yates status:', error)
  }
}

updateBobYatesStatus()
