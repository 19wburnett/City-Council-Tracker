'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Vote, TrendingUp, TrendingDown, Minus, User } from 'lucide-react'

type VoteData = {
  id: string
  value: 'YEA' | 'NAY' | 'ABSTAIN' | 'ABSENT'
  agenda_items: {
    title: string
    issue_tags: string[]
  }
  members: {
    name: string
  }
}

export function VoteSummary() {
  const { supabase } = useSupabase()
  const [recentVotes, setRecentVotes] = useState<VoteData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentVotes() {
      try {
        const { data, error } = await supabase
          .from('votes')
          .select(`
            id,
            value,
            agenda_items (
              title,
              issue_tags
            ),
            members (
              name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(8)
        
        if (error) throw error
        
        setRecentVotes(data || [])
      } catch (err) {
        console.error('Error fetching votes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentVotes()
  }, [supabase])

  const getVoteIcon = (value: string) => {
    switch (value) {
      case 'YEA':
        return <TrendingUp className="w-4 h-4 text-vote-yea" />
      case 'NAY':
        return <TrendingDown className="w-4 h-4 text-vote-nay" />
      case 'ABSTAIN':
        return <Minus className="w-4 h-4 text-vote-abstain" />
      case 'ABSENT':
        return <User className="w-4 h-4 text-vote-absent" />
      default:
        return <Vote className="w-4 h-4 text-gray-400" />
    }
  }

  const getVoteColor = (value: string) => {
    switch (value) {
      case 'YEA':
        return 'text-vote-yea'
      case 'NAY':
        return 'text-vote-nay'
      case 'ABSTAIN':
        return 'text-vote-abstain'
      case 'ABSENT':
        return 'text-vote-absent'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (recentVotes.length === 0) {
    return (
      <div className="text-center py-6">
        <Vote className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No recent votes</p>
        <p className="text-sm text-gray-500 mt-1">
          Check back after meetings for voting records
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {recentVotes.map((vote) => (
        <div key={vote.id} className="card p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getVoteIcon(vote.value)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`text-sm font-medium ${getVoteColor(vote.value)}`}>
                  {vote.value}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">
                  {vote.members.name}
                </span>
              </div>
              
              <p className="text-sm text-gray-900 mb-2">
                {vote.agenda_items.title}
              </p>
              
              {vote.agenda_items.issue_tags && vote.agenda_items.issue_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {vote.agenda_items.issue_tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {vote.agenda_items.issue_tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{vote.agenda_items.issue_tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      <div className="text-center">
        <a
          href="/votes"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          View All Votes →
        </a>
      </div>
    </div>
  )
}
