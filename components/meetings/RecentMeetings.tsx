'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Calendar, FileText, Video, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

type Meeting = {
  id: string
  date: string
  agenda_url: string | null
  minutes_url: string | null
  video_url: string | null
}

export function RecentMeetings() {
  const { supabase } = useSupabase()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMeetings() {
      try {
        const { data, error } = await supabase
          .from('meetings')
          .select('*')
          .order('date', { ascending: false })
          .limit(5)
        
        if (error) throw error
        
        setMeetings(data || [])
      } catch (err) {
        console.error('Error fetching meetings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMeetings()
  }, [supabase])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (meetings.length === 0) {
    return (
      <div className="text-center py-6">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No meetings found</p>
        <p className="text-sm text-gray-500 mt-1">
          Check back later for upcoming meetings
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => (
        <div key={meeting.id} className="card p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">
                  {format(new Date(meeting.date), 'MMM d, yyyy')}
                </span>
              </div>
              
              {/* Meeting Links */}
              <div className="flex flex-wrap gap-2">
                {meeting.agenda_url && (
                  <a
                    href={meeting.agenda_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Agenda</span>
                  </a>
                )}
                
                {meeting.minutes_url && (
                  <a
                    href={meeting.minutes_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Minutes</span>
                  </a>
                )}
                
                {meeting.video_url && (
                  <a
                    href={meeting.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Video className="w-4 h-4" />
                    <span>Video</span>
                  </a>
                )}
              </div>
            </div>
            
            <a
              href={`/meetings/${meeting.id}`}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      ))}
      
      <div className="text-center">
        <a
          href="/meetings"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          View All Meetings →
        </a>
      </div>
    </div>
  )
}
