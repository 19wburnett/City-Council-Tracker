import { Suspense } from 'react'
import { MembersList } from '@/components/members/MembersList'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function MembersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Council Members
        </h1>
        <p className="text-lg text-gray-600">
          Explore Boulder City Council members and their voting patterns
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <MembersList />
      </Suspense>
    </div>
  )
}
