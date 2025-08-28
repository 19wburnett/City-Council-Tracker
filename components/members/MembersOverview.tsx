'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { MemberCard } from './MemberCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

type Member = {
  id: string
  name: string
  seat: string
  bio: string
  photo_url: string | null
  contact_info: any
  committees: string[]
  stance_scores: any
}

export function MembersOverview() {
  const { supabase } = useSupabase()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMembers() {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('seat')
        
        if (error) throw error
        
        setMembers(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch members')
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [supabase])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading members: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">No council members found.</p>
        <p className="text-sm text-gray-500">
          The scraper may need to run to populate this data.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((member) => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  )
}
