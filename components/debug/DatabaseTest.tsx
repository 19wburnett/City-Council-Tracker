'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'

export function DatabaseTest() {
  const { supabase } = useSupabase()
  const [status, setStatus] = useState<string>('Testing...')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        setStatus('Testing Supabase connection...')
        
        // Test 1: Check if we can connect
        const { data: cities, error: citiesError } = await supabase
          .from('cities')
          .select('*')
          .limit(1)
        
        if (citiesError) {
          throw new Error(`Cities error: ${citiesError.message}`)
        }
        
        setStatus('Testing council members...')
        
        // Test 2: Check council members
        const { data: members, error: membersError } = await supabase
          .from('council_members')
          .select('*')
          .limit(3)
        
        if (membersError) {
          throw new Error(`Members error: ${membersError.message}`)
        }
        
        setStatus('Testing votes...')
        
        // Test 3: Check votes
        const { data: votes, error: votesError } = await supabase
          .from('votes')
          .select('*')
          .limit(3)
        
        if (votesError) {
          throw new Error(`Votes error: ${votesError.message}`)
        }
        
        setStatus('✅ All tests passed!')
        setData({
          cities: cities?.length || 0,
          members: members?.length || 0,
          votes: votes?.length || 0
        })
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setStatus('❌ Test failed')
      }
    }

    testConnection()
  }, [supabase])

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Database Connection Test</h3>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600">{status}</p>
        
        {error && (
          <div className="text-red-600 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {data && (
          <div className="text-sm text-gray-700">
            <p><strong>Cities:</strong> {data.cities}</p>
            <p><strong>Members:</strong> {data.members}</p>
            <p><strong>Votes:</strong> {data.votes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
