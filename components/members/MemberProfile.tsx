'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { VoteBadge } from '@/components/votes/VoteBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ProfileImage } from '@/components/ui/ProfileImage'

interface MemberProfileProps {
  memberId: string
}

interface MemberData {
  id: string
  name: string
  title: string
  seat: string
  bio: string
  photo_url: string | null
  is_active: boolean
  created_at: string
  cities: {
    name: string
    state: string
  }
}

interface VoteData {
  id: string
  vote_value: 'YEA' | 'NAY' | 'ABSTAIN'
  created_at: string
  agenda_items: {
    id: string
    title: string
    category: string
    tags: string[]
    meetings: {
      id: string
      date: string
      title: string
    }
  }
}

interface VoteStats {
  total: number
  yea: number
  nay: number
  abstain: number
  categories: Record<string, { total: number; yea: number; nay: number; abstain: number }>
}

export function MemberProfile({ memberId }: MemberProfileProps) {
  const { supabase } = useSupabase()
  const [member, setMember] = useState<MemberData | null>(null)
  const [votes, setVotes] = useState<VoteData[]>([])
  const [stats, setStats] = useState<VoteStats>({
    total: 0,
    yea: 0,
    nay: 0,
    abstain: 0,
    categories: {}
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMemberData()
  }, [memberId, supabase])

  async function fetchMemberData() {
    try {
      setLoading(true)

      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from('council_members')
        .select(`
          *,
          cities (
            name,
            state
          )
        `)
        .eq('id', memberId)
        .single()

      if (memberError) throw memberError
      setMember(memberData)

      // Fetch all votes for this member
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select(`
          id,
          vote_value,
          created_at,
          agenda_items (
            id,
            title,
            category,
            tags,
            meetings (
              id,
              date,
              title
            )
          )
        `)
        .eq('council_member_id', memberId)
        .order('created_at', { ascending: false })

      if (votesError) throw votesError
      setVotes(votesData || [])

      // Calculate statistics
      const total = votesData?.length || 0
      const yea = votesData?.filter(v => v.vote_value === 'YEA').length || 0
      const nay = votesData?.filter(v => v.vote_value === 'NAY').length || 0
      const abstain = votesData?.filter(v => v.vote_value === 'ABSTAIN').length || 0

      // Calculate category breakdown
      const categories: Record<string, { total: number; yea: number; nay: number; abstain: number }> = {}
      
      votesData?.forEach(vote => {
        const category = vote.agenda_items?.category || 'Unknown'
        if (!categories[category]) {
          categories[category] = { total: 0, yea: 0, nay: 0, abstain: 0 }
        }
        categories[category].total++
        categories[category][vote.vote_value.toLowerCase() as 'yea' | 'nay' | 'abstain']++
      })

      setStats({ total, yea, nay, abstain, categories })

    } catch (error) {
      console.error('Error fetching member data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!member) {
    return <div className="text-center text-gray-500">Member not found</div>
  }

  const approvalRate = stats.total > 0 ? Math.round((stats.yea / stats.total) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Member Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Member Info */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-start space-x-6 mb-6">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                <ProfileImage 
                  src={member.photo_url} 
                  alt={member.name} 
                  size="lg" 
                />
              </div>
              
              {/* Member Details */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About {member.name}</h2>
                <div className="space-y-4">
                  <div>
                    <span className="font-medium text-gray-700">Position:</span>
                    <span className="ml-2 text-gray-900">{member.title}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Seat:</span>
                    <span className="ml-2 text-gray-900">{member.seat}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      member.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {member.bio && (
                    <div>
                      <span className="font-medium text-gray-700">Bio:</span>
                      <p className="mt-1 text-gray-900">{member.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voting Statistics */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Voting Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Votes:</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Approval Rate:</span>
                <span className="font-medium text-vote-yea">{approvalRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Yes Votes:</span>
                <span className="font-medium text-vote-yea">{stats.yea}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">No Votes:</span>
                <span className="font-medium text-vote-nay">{stats.nay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Abstentions:</span>
                <span className="font-medium text-vote-abstain">{stats.abstain}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Voting by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(stats.categories)
            .sort(([,a], [,b]) => b.total - a.total)
            .map(([category, categoryStats]) => {
              const categoryApprovalRate = categoryStats.total > 0 
                ? Math.round((categoryStats.yea / categoryStats.total) * 100) 
                : 0
              
              return (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 capitalize">
                    {category.replace(/_/g, ' ')}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">{categoryStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approval Rate:</span>
                      <span className={`font-medium ${
                        categoryApprovalRate >= 70 ? 'text-vote-yea' : 
                        categoryApprovalRate >= 40 ? 'text-vote-abstain' : 'text-vote-nay'
                      }`}>
                        {categoryApprovalRate}%
                      </span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <div className="flex-1 bg-vote-yea/20 rounded h-2 flex items-center justify-center text-xs">
                        {categoryStats.yea}
                      </div>
                      <div className="flex-1 bg-vote-nay/20 rounded h-2 flex items-center justify-center text-xs">
                        {categoryStats.nay}
                      </div>
                      <div className="flex-1 bg-vote-abstain/20 rounded h-2 flex items-center justify-center text-xs">
                        {categoryStats.abstain}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Recent Voting History */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Voting History</h2>
        <div className="space-y-4">
          {votes.slice(0, 20).map((vote) => (
            <div key={vote.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {vote.agenda_items?.title}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{vote.agenda_items?.meetings?.date}</span>
                    <span className="capitalize">{vote.agenda_items?.category}</span>
                    {vote.agenda_items?.tags && vote.agenda_items.tags.length > 0 && (
                      <span>{vote.agenda_items.tags.join(', ')}</span>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <VoteBadge vote={vote.vote_value} />
                </div>
              </div>
            </div>
          ))}
        </div>
        {votes.length > 20 && (
          <div className="mt-6 text-center">
            <a 
              href={`/votes?member=${encodeURIComponent(member.name)}`}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All {votes.length} Votes →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
