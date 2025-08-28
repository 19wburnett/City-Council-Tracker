'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { TrendingUp, TrendingDown, Minus, Vote, Calendar, User, Tag } from 'lucide-react'

type VoteRecord = {
  id: string
  vote_value: 'YEA' | 'NAY' | 'ABSTAIN' | 'ABSENT'
  created_at: string
  source_name: string
  agenda_items: {
    title: string
    category: string
    tags: string[]
    meetings: {
      date: string
      title: string
    }
  }
  council_members: {
    name: string
    title: string
  }
}

interface VotesAnalysisProps {
  filters?: {
    search: string
    category: string
    member: string
    voteValue: string
  }
}

export function VotesAnalysis({ filters = { search: '', category: '', member: '', voteValue: '' } }: VotesAnalysisProps) {
  const { supabase } = useSupabase()
  const [votes, setVotes] = useState<VoteRecord[]>([])
  const [allVotes, setAllVotes] = useState<VoteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVotes()
  }, [supabase])

  useEffect(() => {
    applyFilters()
  }, [filters, allVotes])

  async function fetchVotes() {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select(`
          id,
          vote_value,
          created_at,
          source_name,
          agenda_items (
            title,
            category,
            tags,
            meetings (
              date,
              title
            )
          ),
          council_members (
            name,
            title
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200) // Get more votes for filtering

      if (error) throw error

      setAllVotes(data || [])
      setVotes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch votes')
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filteredData = [...allVotes]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredData = filteredData.filter(vote => 
        vote.agenda_items?.title?.toLowerCase().includes(searchLower) ||
        vote.council_members?.name?.toLowerCase().includes(searchLower) ||
        vote.agenda_items?.category?.toLowerCase().includes(searchLower) ||
        vote.agenda_items?.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Apply category filter
    if (filters.category) {
      filteredData = filteredData.filter(vote => 
        vote.agenda_items?.category?.toLowerCase() === filters.category.toLowerCase()
      )
    }

    // Apply member filter
    if (filters.member) {
      filteredData = filteredData.filter(vote => 
        vote.council_members?.name?.toLowerCase().includes(filters.member.toLowerCase())
      )
    }

    // Apply vote value filter
    if (filters.voteValue) {
      filteredData = filteredData.filter(vote => 
        vote.vote_value === filters.voteValue
      )
    }

    setVotes(filteredData)
  }

  const getVoteIcon = (value: string) => {
    switch (value) {
      case 'YEA':
        return <TrendingUp className="w-4 h-4 text-vote-yea" />
      case 'NAY':
        return <TrendingDown className="w-4 h-4 text-vote-nay" />
      case 'ABSTAIN':
        return <Minus className="w-4 h-4 text-vote-abstain" />
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
      default:
        return 'text-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading votes: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Voting Records
        </h2>
        <div className="text-sm text-gray-600">
          Showing {votes.length} of {allVotes.length} votes
          {filters.search || filters.category || filters.member || filters.voteValue ? ' (filtered)' : ''}
        </div>
      </div>

      {/* Votes List */}
      <div className="space-y-4">
        {votes.map((vote) => (
          <div key={vote.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start space-x-4">
              {/* Vote Icon */}
              <div className="flex-shrink-0 mt-1">
                {getVoteIcon(vote.vote_value)}
              </div>

              {/* Vote Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`text-sm font-medium ${getVoteColor(vote.vote_value)}`}>
                    {vote.vote_value}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600 flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {vote.council_members?.name}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(vote.agenda_items?.meetings?.date || vote.created_at)}
                  </span>
                </div>

                {/* Agenda Item Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {vote.agenda_items?.title || 'Unknown Agenda Item'}
                </h3>

                {/* Category and Tags */}
                <div className="flex items-center space-x-4 mb-3">
                  {vote.agenda_items?.category && (
                    <div className="flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {vote.agenda_items.category}
                      </span>
                    </div>
                  )}
                  {vote.source_name && (
                    <span className="text-sm text-gray-500">
                      Source: {vote.source_name}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {vote.agenda_items?.tags && vote.agenda_items.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {vote.agenda_items.tags.slice(0, 5).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {vote.agenda_items.tags.length > 5 && (
                      <span className="text-xs text-gray-500">
                        +{vote.agenda_items.tags.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    View Meeting Details
                  </button>
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Similar Votes
                  </button>
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Contact Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {votes.length >= 50 && (
        <div className="text-center">
          <button className="btn-secondary">
            Load More Votes
          </button>
        </div>
      )}

      {/* No Results */}
      {votes.length === 0 && (
        <div className="text-center py-12">
          <Vote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No votes found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      )}
    </div>
  )
}
