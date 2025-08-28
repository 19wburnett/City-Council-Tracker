'use client'

import { useState } from 'react'
import { User, Mail, Phone, MapPin, ExternalLink } from 'lucide-react'
import { ProfileImage } from '@/components/ui/ProfileImage'

type Member = {
  id: string
  name: string
  seat: string
  bio: string
  photo_url: string | null
  title?: string
  is_active?: boolean
  contact_info: {
    email?: string
    phone?: string
    linkedin?: string
    twitter?: string
  }
  committees: string[]
  stance_scores: any
}

interface MemberCardProps {
  member: Member
}

export function MemberCard({ member }: MemberCardProps) {
  const [showFullBio, setShowFullBio] = useState(false)

  const truncateBio = (bio: string, maxLength: number = 120) => {
    if (bio.length <= maxLength) return bio
    return bio.substring(0, maxLength) + '...'
  }

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start space-x-4 mb-4">
        {/* Photo */}
        <div className="flex-shrink-0">
          <ProfileImage 
            src={member.photo_url} 
            alt={member.name} 
            size="sm" 
            className="rounded-full"
          />
        </div>

        {/* Name and Seat */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {member.name}
          </h3>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-1" />
            {member.seat}
          </div>
        </div>
      </div>

      {/* Bio */}
      {member.bio && (
        <div className="mb-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            {showFullBio ? member.bio : truncateBio(member.bio)}
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

      {/* Committees */}
      {member.committees && member.committees.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Committees</h4>
          <div className="flex flex-wrap gap-2">
            {member.committees.map((committee, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {committee}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contact Info */}
      {(member.contact_info?.email || member.contact_info?.phone) && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Contact</h4>
          <div className="space-y-2">
            {member.contact_info.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                <a
                  href={`mailto:${member.contact_info.email}`}
                  className="hover:text-primary-600 transition-colors"
                >
                  {member.contact_info.email}
                </a>
              </div>
            )}
            {member.contact_info.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <a
                  href={`tel:${member.contact_info.phone}`}
                  className="hover:text-primary-600 transition-colors"
                >
                  {member.contact_info.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social Links */}
      {(member.contact_info?.linkedin || member.contact_info?.twitter) && (
        <div className="flex space-x-3">
          {member.contact_info.linkedin && (
            <a
              href={member.contact_info.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
          {member.contact_info.twitter && (
            <a
              href={member.contact_info.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-400 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
        </div>
      )}

      {/* View Details Link */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <a
          href={`/members/${member.id}`}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
        >
          View Details
          <ExternalLink className="w-4 h-4 ml-1" />
        </a>
      </div>
    </div>
  )
}
