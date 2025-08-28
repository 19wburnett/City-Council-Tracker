import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberProfile } from '@/components/members/MemberProfile'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface MemberPageProps {
  params: {
    id: string
  }
}

async function getMember(id: string) {
  const supabase = createClient()
  
  const { data: member, error } = await supabase
    .from('council_members')
    .select(`
      *,
      cities (
        name,
        state
      )
    `)
    .eq('id', id)
    .single()

  if (error || !member) {
    return null
  }

  return member
}

export default async function MemberPage({ params }: MemberPageProps) {
  const member = await getMember(params.id)

  if (!member) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-4">
          <a href="/members" className="hover:text-gray-700">← Back to Council Members</a>
        </nav>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {member.name}
        </h1>
        <p className="text-lg text-gray-600">
          {member.title} • {member.cities?.name}, {member.cities?.state}
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <MemberProfile memberId={params.id} />
      </Suspense>
    </div>
  )
}
