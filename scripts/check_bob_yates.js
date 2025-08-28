const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBobYates() {
  console.log('Checking Bob Yates in the database...')
  
  try {
    // Check for Bob Yates in council_members table
    const { data: bobYates, error: error1 } = await supabase
      .from('council_members')
      .select('*')
      .ilike('name', '%bob%')
      .or('name.ilike.%yates%')
    
    if (error1) {
      console.error('Error querying council_members:', error1)
    } else {
      console.log('\nBob Yates in council_members table:')
      console.log(JSON.stringify(bobYates, null, 2))
    }
    
    // Also check the members table (old schema)
    const { data: bobYatesOld, error: error2 } = await supabase
      .from('members')
      .select('*')
      .ilike('name', '%bob%')
      .or('name.ilike.%yates%')
    
    if (error2) {
      console.error('Error querying members table:', error2)
    } else {
      console.log('\nBob Yates in members table (old schema):')
      console.log(JSON.stringify(bobYatesOld, null, 2))
    }
    
    // Check all council members to see the full list
    const { data: allMembers, error: error3 } = await supabase
      .from('council_members')
      .select('name, title, is_active, created_at')
      .order('name')
    
    if (error3) {
      console.error('Error querying all members:', error3)
    } else {
      console.log('\nAll council members in database:')
      allMembers.forEach(member => {
        console.log(`${member.name} - ${member.title} (Active: ${member.is_active})`)
      })
    }
    
  } catch (error) {
    console.error('Error checking Bob Yates:', error)
  }
}

checkBobYates()
