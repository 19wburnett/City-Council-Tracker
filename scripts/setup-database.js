#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script helps set up the initial database schema for the Boulder City Council Tracker.
 * Run this after creating your Supabase project and before starting development.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function setupDatabase() {
  console.log('🚀 Setting up Boulder City Council Tracker database...\n')

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nPlease check your .env.local file and try again.')
    process.exit(1)
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Connected to Supabase')

    // Read and execute schema
    const fs = require('fs')
    const path = require('path')
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql')
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found at:', schemaPath)
      process.exit(1)
    }

    const schema = fs.readFileSync(schemaPath, 'utf8')
    console.log('📖 Schema file loaded')

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📝 Executing ${statements.length} SQL statements...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          if (error) {
            console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message)
          }
        } catch (err) {
          console.warn(`⚠️  Warning on statement ${i + 1}:`, err.message)
        }
      }
    }

    console.log('\n✅ Database setup completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Run the Python scraper to populate data:')
    console.log('   cd scraper && python scrape_members.py')
    console.log('2. Start the development server:')
    console.log('   npm run dev')
    console.log('\n🎉 Happy coding!')

  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    console.error('\nTroubleshooting tips:')
    console.error('1. Check your Supabase credentials')
    console.error('2. Ensure your Supabase project is active')
    console.error('3. Verify you have the correct permissions')
    process.exit(1)
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase()
}

module.exports = { setupDatabase }
