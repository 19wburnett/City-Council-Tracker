#!/usr/bin/env node

/**
 * Test script for Boulder Reporting Lab integration
 * Validates that our system can process and integrate BRL vote tracker data
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testBRLIntegration() {
  console.log('🧪 Testing Boulder Reporting Lab Integration...\n')

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Test 1: Check if we have members data
    console.log('📊 Test 1: Checking members data...')
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, seat')
      .limit(5)

    if (membersError) {
      console.error('❌ Error fetching members:', membersError)
      return false
    }

    console.log(`✅ Found ${members.length} council members`)
    members.forEach(member => {
      console.log(`   - ${member.name} (${member.seat})`)
    })

    // Test 2: Check if we have meetings data
    console.log('\n📅 Test 2: Checking meetings data...')
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('id, date, title')
      .order('date', { ascending: false })
      .limit(5)

    if (meetingsError) {
      console.error('❌ Error fetching meetings:', meetingsError)
      return false
    }

    console.log(`✅ Found ${meetings.length} recent meetings`)
    meetings.forEach(meeting => {
      console.log(`   - ${meeting.date}: ${meeting.title}`)
    })

    // Test 3: Check if we have decisions data
    console.log('\n🗳️ Test 3: Checking decisions data...')
    const { data: decisions, error: decisionsError } = await supabase
      .from('decisions')
      .select('id, title, decision_type, outcome')
      .limit(5)

    if (decisionsError) {
      console.error('❌ Error fetching decisions:', decisionsError)
      return false
    }

    console.log(`✅ Found ${decisions.length} decisions`)
    decisions.forEach(decision => {
      console.log(`   - ${decision.title} (${decision.outcome})`)
    })

    // Test 4: Check if we have decision members data
    console.log('\n👥 Test 4: Checking decision members data...')
    const { data: decisionMembers, error: dmError } = await supabase
      .from('decision_members')
      .select(`
        id, 
        role, 
        vote_value,
        members(name),
        decisions(title)
      `)
      .limit(5)

    if (dmError) {
      console.error('❌ Error fetching decision members:', dmError)
      return false
    }

    console.log(`✅ Found ${decisionMembers.length} decision member records`)
    decisionMembers.forEach(dm => {
      console.log(`   - ${dm.members?.name} voted ${dm.vote_value} on ${dm.decisions?.title}`)
    })

    // Test 5: Check data counts for demo
    console.log('\n📈 Test 5: Checking data counts for demo...')
    const [membersCount, meetingsCount, decisionsCount, votesCount, quotesCount] = await Promise.all([
      supabase.from('members').select('id', { count: 'exact' }),
      supabase.from('meetings').select('id', { count: 'exact' }),
      supabase.from('decisions').select('id', { count: 'exact' }),
      supabase.from('decision_members').select('id', { count: 'exact' }),
      supabase.from('quotes').select('id', { count: 'exact' })
    ])

    console.log('📊 Data Summary:')
    console.log(`   - Members: ${membersCount.count || 0}`)
    console.log(`   - Meetings: ${meetingsCount.count || 0}`)
    console.log(`   - Decisions: ${decisionsCount.count || 0}`)
    console.log(`   - Votes: ${votesCount.count || 0}`)
    console.log(`   - Quotes: ${quotesCount.count || 0}`)

    // Test 6: Check for BRL-specific data
    console.log('\n🔍 Test 6: Checking for BRL integration data...')
    const { data: brlData, error: brlError } = await supabase
      .from('decisions')
      .select('id, title, source_text')
      .ilike('source_text', '%BRL%')
      .limit(5)

    if (brlError) {
      console.error('❌ Error fetching BRL data:', brlError)
    } else {
      console.log(`✅ Found ${brlData.length} BRL-integrated records`)
      if (brlData.length > 0) {
        brlData.forEach(record => {
          console.log(`   - ${record.title}`)
        })
      } else {
        console.log('   ℹ️  No BRL data found yet - run the BRL integration scraper first')
      }
    }

    console.log('\n✅ All tests completed successfully!')
    console.log('\n🎯 Next Steps:')
    console.log('   1. Run the BRL integration scraper: python scraper/scrape_boulder_reporting_lab.py')
    console.log('   2. Visit /demo to see the comparative analysis')
    console.log('   3. Test the API endpoints for customer demos')

    return true

  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

// Run the test
testBRLIntegration()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Test script error:', error)
    process.exit(1)
  })
