'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { MemberProfileCard } from './MemberProfileCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

type MemberWithStats = {
  id: string
  name: string
  title: string
  bio: string
  photo_url: string | null
  is_active: boolean
  voting_stats: {
    total_votes: number
    yea_votes: number
    nay_votes: number
    abstain_votes: number
    yea_percentage: number
    voting_frequency: number
  }
  recent_votes: Array<{
    id: string
    vote_value: string
    agenda_item_title: string
    date: string
    category: string
  }>
}

export function MembersList() {
  const { supabase } = useSupabase()
  const [members, setMembers] = useState<MemberWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMembersWithStats() {
      try {
        // First, get all active council members
        const { data: membersData, error: membersError } = await supabase
          .from('council_members')
          .select('id, name, title, seat, bio, photo_url, is_active')
          .eq('is_active', true)
          .order('name')

        if (membersError) throw membersError

        // For each member, get their voting statistics
        const membersWithStats = await Promise.all(
          membersData.map(async (member) => {
            // Get voting statistics
            const { data: votesData, error: votesError } = await supabase
              .from('votes')
              .select(`
                id,
                vote_value,
                created_at,
                agenda_items (
                  title,
                  category,
                  meetings (
                    date
                  )
                )
              `)
              .eq('council_member_id', member.id)
              .order('created_at', { ascending: false })

            if (votesError) {
              console.error(`Error fetching votes for ${member.name}:`, votesError)
              return {
                ...member,
                voting_stats: {
                  total_votes: 0,
                  yea_votes: 0,
                  nay_votes: 0,
                  abstain_votes: 0,
                  yea_percentage: 0,
                  voting_frequency: 0
                },
                recent_votes: []
              }
            }

            // Calculate statistics
            const totalVotes = votesData?.length || 0
            const yeaVotes = votesData?.filter(v => v.vote_value === 'YEA').length || 0
            const nayVotes = votesData?.filter(v => v.vote_value === 'NAY').length || 0
            const abstainVotes = votesData?.filter(v => v.vote_value === 'ABSTAIN').length || 0
            const yeaPercentage = totalVotes > 0 ? Math.round((yeaVotes / totalVotes) * 100) : 0

            // Get recent votes (last 5)
            const recentVotes = votesData
              ?.slice(0, 5)
              .map(vote => ({
                id: vote.id,
                vote_value: vote.vote_value,
                agenda_item_title: vote.agenda_items?.title || 'Unknown',
                date: vote.agenda_items?.meetings?.date || 'Unknown',
                category: vote.agenda_items?.category || 'General'
              })) || []

            return {
              ...member,
              voting_stats: {
                total_votes: totalVotes,
                yea_votes: yeaVotes,
                nay_votes: nayVotes,
                abstain_votes: abstainVotes,
                yea_percentage: yeaPercentage,
                voting_frequency: totalVotes // Simplified for now
              },
              recent_votes: recentVotes
            }
          })
        )

        setMembers(membersWithStats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch members')
      } finally {
        setLoading(false)
      }
    }

    fetchMembersWithStats()
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {members.map((member) => (
        <MemberProfileCard key={member.id} member={member} />
      ))}
    </div>
  )
}
