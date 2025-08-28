import { Suspense } from 'react'
import { MembersOverview } from '@/components/members/MembersOverview'
import { RecentMeetings } from '@/components/meetings/RecentMeetings'
import { VoteSummary } from '@/components/votes/VoteSummary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-boulder-600 to-primary-600 rounded-2xl text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Boulder City Council Tracker
        </h1>
        <p className="text-xl md:text-2xl text-boulder-100 max-w-3xl mx-auto">
          Stay informed about your local government. Track council members, 
          meeting agendas, and voting records in real-time.
        </p>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">9</div>
          <div className="text-gray-600">Council Members</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-boulder-600 mb-2">2x</div>
          <div className="text-gray-600">Meetings per Month</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-vote-yea mb-2">100%</div>
          <div className="text-gray-600">Vote Transparency</div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Council Members */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Council Members
          </h2>
          <Suspense fallback={<LoadingSpinner />}>
            <MembersOverview />
          </Suspense>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recent Activity
          </h2>
          <div className="space-y-6">
            <Suspense fallback={<LoadingSpinner />}>
              <RecentMeetings />
            </Suspense>
            <Suspense fallback={<LoadingSpinner />}>
              <VoteSummary />
            </Suspense>
          </div>
        </section>
      </div>
      


      {/* Call to Action */}
      <section className="text-center py-12 bg-gray-100 rounded-2xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Get Involved
        </h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Democracy works best when citizens are informed and engaged. 
          Track important decisions, understand your representatives' positions, 
          and make your voice heard.
        </p>
        <div className="space-x-4">
          <a href="/members" className="btn-primary">
            View Members
          </a>
          <a href="/votes" className="btn-secondary">
            Browse Votes
          </a>
          <a href="/meetings" className="btn-secondary">
            View Meetings
          </a>
          <a href="/demo" className="btn-primary bg-blue-600 hover:bg-blue-700">
            View Demo
          </a>
        </div>
      </section>
    </div>
  )
}
