'use client'

import { useState } from 'react'
import { User, Mail, Phone, MapPin, ExternalLink, TrendingUp, TrendingDown, Minus, Vote, Calendar } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

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

interface MemberProfileCardProps {
  member: MemberWithStats
}

export function MemberProfileCard({ member }: MemberProfileCardProps) {
  const [showFullBio, setShowFullBio] = useState(false)
  const [showRecentVotes, setShowRecentVotes] = useState(false)

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

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start space-x-4">
          {/* Photo */}
          <div className="flex-shrink-0">
            {member.photo_url ? (
              <Image
                src={member.photo_url}
                alt={member.name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-gray-400" />
              </div>
            )}
          </div>

          {/* Name and Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{member.name}</h2>
              <span className="px-2 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                {member.title}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <MapPin className="w-4 h-4 mr-1" />
              Boulder City Council
            </div>
            
            {/* Bio */}
            {member.bio && (
              <div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {showFullBio ? member.bio : truncateText(member.bio)}
                </p>
                {member.bio.length > 120 && (
                  <button
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2"
                  >
                    {showFullBio ? 'Show Less' : 'Read More'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Voting Statistics */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Voting Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{member.voting_stats.total_votes}</div>
            <div className="text-sm text-gray-600">Total Votes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-vote-yea">{member.voting_stats.yea_percentage}%</div>
            <div className="text-sm text-gray-600">Yes Votes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-vote-nay">{member.voting_stats.nay_votes}</div>
            <div className="text-sm text-gray-600">No Votes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-vote-abstain">{member.voting_stats.abstain_votes}</div>
            <div className="text-sm text-gray-600">Abstentions</div>
          </div>
        </div>
      </div>

      {/* Recent Votes */}
      {member.recent_votes.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Votes</h3>
            <button
              onClick={() => setShowRecentVotes(!showRecentVotes)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {showRecentVotes ? 'Hide' : 'Show'} Recent Votes
            </button>
          </div>
          
          {showRecentVotes && (
            <div className="space-y-3">
              {member.recent_votes.map((vote) => (
                <div key={vote.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getVoteIcon(vote.vote_value)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-sm font-medium ${getVoteColor(vote.vote_value)}`}>
                        {vote.vote_value}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">{vote.category}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {vote.date}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">
                      {truncateText(vote.agenda_item_title, 100)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/members/${member.id}`}
            className="btn-primary text-center"
          >
            View Full Profile
          </Link>
          <Link
            href={`/votes?member=${member.id}`}
            className="btn-secondary text-center"
          >
            View All Votes
          </Link>
          <button className="btn-secondary text-center">
            <Mail className="w-4 h-4 mr-2 inline" />
            Contact Member
          </button>
        </div>
      </div>
    </div>
  )
}
