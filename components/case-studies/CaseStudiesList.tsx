'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { TrendingUp, TrendingDown, Minus, Vote, Calendar, Users, Tag } from 'lucide-react'

type CaseStudy = {
  id: string
  title: string
  description: string
  category: string
  date: string
  outcome: string
  impact_level: 'high' | 'medium' | 'low'
  votes: Array<{
    member_name: string
    vote_value: string
    title: string
  }>
  tags: string[]
}

export function CaseStudiesList() {
  const { supabase } = useSupabase()
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCaseStudies() {
      try {
        // Get recent votes grouped by agenda items to create case studies
        const { data: votesData, error } = await supabase
          .from('votes')
          .select(`
            id,
            vote_value,
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
          .limit(100)

        if (error) throw error

        // Group votes by agenda item to create case studies
        const agendaItemGroups = votesData?.reduce((groups: any, vote) => {
          const agendaTitle = vote.agenda_items?.title || 'Unknown'
          if (!groups[agendaTitle]) {
            groups[agendaTitle] = {
              title: agendaTitle,
              category: vote.agenda_items?.category || 'General',
              date: vote.agenda_items?.meetings?.date || vote.created_at,
              tags: vote.agenda_items?.tags || [],
              votes: []
            }
          }
          groups[agendaTitle].votes.push({
            member_name: vote.council_members?.name || 'Unknown',
            vote_value: vote.vote_value,
            title: vote.council_members?.title || ''
          })
          return groups
        }, {})

        // Convert to case studies format
        const studies = Object.values(agendaItemGroups || {}).map((group: any) => {
          const yeaVotes = group.votes.filter((v: any) => v.vote_value === 'YEA').length
          const totalVotes = group.votes.length
          const outcome = yeaVotes > totalVotes / 2 ? 'Approved' : 'Denied'
          
          return {
            id: group.title,
            title: group.title,
            description: `Council vote on ${group.title} with ${totalVotes} members participating.`,
            category: group.category,
            date: group.date,
            outcome,
            impact_level: totalVotes >= 7 ? 'high' : totalVotes >= 5 ? 'medium' : 'low',
            votes: group.votes,
            tags: group.tags
          }
        })

        // Take the first 6 as featured case studies
        setCaseStudies(studies.slice(0, 6))
      } catch (err) {
        console.error('Error fetching case studies:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCaseStudies()
  }, [supabase])

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

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  return (
    <div className="space-y-6">
      {caseStudies.map((study) => (
        <div key={study.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{study.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(study.impact_level)}`}>
                  {study.impact_level.toUpperCase()} IMPACT
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center">
                  <Tag className="w-3 h-3 mr-1" />
                  {study.category}
                </span>
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(study.date)}
                </span>
                <span className={`font-medium ${study.outcome === 'Approved' ? 'text-vote-yea' : 'text-vote-nay'}`}>
                  {study.outcome}
                </span>
              </div>

              <p className="text-gray-700 mb-4">{study.description}</p>

              {/* Tags */}
              {study.tags && study.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {study.tags.slice(0, 5).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Voting Breakdown */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Council Vote Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {study.votes.map((vote, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <div className="flex-shrink-0">
                    {getVoteIcon(vote.vote_value)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {vote.member_name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {vote.title}
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${getVoteColor(vote.vote_value)}`}>
                    {vote.vote_value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200">
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View Full Details
            </button>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Similar Cases
            </button>
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Contact Members
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
