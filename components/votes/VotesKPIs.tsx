'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'

interface VotesKPIsProps {
  filters: {
    search: string
    category: string
    member: string
    voteValue: string
  }
}

export function VotesKPIs({ filters }: VotesKPIsProps) {
  const { supabase } = useSupabase()
  const [stats, setStats] = useState({
    total: 0,
    yea: 0,
    nay: 0,
    abstain: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [filters, supabase])

  async function fetchStats() {
    try {
      setLoading(true)
      
      // Get all votes first
      const { data: allVotes, error } = await supabase
        .from('votes')
        .select(`
          vote_value,
          agenda_items (
            title,
            category,
            tags
          ),
          council_members (
            name
          )
        `)

      if (error) throw error

      // Apply filters to the data
      let filteredVotes = allVotes || []

      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredVotes = filteredVotes.filter(vote => 
          vote.agenda_items?.title?.toLowerCase().includes(searchLower) ||
          vote.council_members?.name?.toLowerCase().includes(searchLower) ||
          vote.agenda_items?.category?.toLowerCase().includes(searchLower) ||
          vote.agenda_items?.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        )
      }

      // Apply category filter
      if (filters.category) {
        filteredVotes = filteredVotes.filter(vote => 
          vote.agenda_items?.category?.toLowerCase() === filters.category.toLowerCase()
        )
      }

      // Apply member filter
      if (filters.member) {
        filteredVotes = filteredVotes.filter(vote => 
          vote.council_members?.name?.toLowerCase().includes(filters.member.toLowerCase())
        )
      }

      // Apply vote value filter
      if (filters.voteValue) {
        filteredVotes = filteredVotes.filter(vote => 
          vote.vote_value === filters.voteValue
        )
      }

      // Calculate statistics
      const total = filteredVotes.length
      const yea = filteredVotes.filter(v => v.vote_value === 'YEA').length
      const nay = filteredVotes.filter(v => v.vote_value === 'NAY').length
      const abstain = filteredVotes.filter(v => v.vote_value === 'ABSTAIN').length

      setStats({ total, yea, nay, abstain })
    } catch (err) {
      console.error('Error fetching vote stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card text-center animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="card text-center">
        <div className="text-3xl font-bold text-primary-600 mb-2">
          {stats.total.toLocaleString()}
        </div>
        <div className="text-gray-600">
          Total Votes
          {(filters.search || filters.category || filters.member || filters.voteValue) && (
            <span className="text-xs text-gray-500 block">(filtered)</span>
          )}
        </div>
      </div>
      <div className="card text-center">
        <div className="text-3xl font-bold text-vote-yea mb-2">
          {stats.yea.toLocaleString()}
        </div>
        <div className="text-gray-600">
          Yes Votes
          {stats.total > 0 && (
            <span className="text-xs text-gray-500 block">
              ({Math.round((stats.yea / stats.total) * 100)}%)
            </span>
          )}
        </div>
      </div>
      <div className="card text-center">
        <div className="text-3xl font-bold text-vote-nay mb-2">
          {stats.nay.toLocaleString()}
        </div>
        <div className="text-gray-600">
          No Votes
          {stats.total > 0 && (
            <span className="text-xs text-gray-500 block">
              ({Math.round((stats.nay / stats.total) * 100)}%)
            </span>
          )}
        </div>
      </div>
      <div className="card text-center">
        <div className="text-3xl font-bold text-vote-abstain mb-2">
          {stats.abstain.toLocaleString()}
        </div>
        <div className="text-gray-600">
          Abstentions
          {stats.total > 0 && (
            <span className="text-xs text-gray-500 block">
              ({Math.round((stats.abstain / stats.total) * 100)}%)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
