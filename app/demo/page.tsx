import { Suspense } from 'react'
import { ComparativeAnalysis } from '@/components/analytics/ComparativeAnalysis'
import { MembersOverview } from '@/components/members/MembersOverview'
import { RecentMeetings } from '@/components/meetings/RecentMeetings'
import { VoteSummary } from '@/components/votes/VoteSummary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function DemoPage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl text-white">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Boulder City Council Tracker
        </h1>
        <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8">
          AI-Powered Government Transparency Platform
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">3x</div>
            <div className="text-sm">More Comprehensive</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">Real-time</div>
            <div className="text-sm">Updates</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">API-First</div>
            <div className="text-sm">Architecture</div>
          </div>
        </div>
      </section>

      {/* Comparative Analysis */}
      <section>
        <Suspense fallback={<LoadingSpinner />}>
          <ComparativeAnalysis />
        </Suspense>
      </section>

      {/* Live Data Showcase */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Live Data from Boulder City Council
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            See our system in action with real data from Boulder, Colorado. 
            This demonstrates the comprehensive coverage and real-time updates our platform provides.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Council Members */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Council Members
            </h3>
            <Suspense fallback={<LoadingSpinner />}>
              <MembersOverview />
            </Suspense>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Recent Activity
            </h3>
            <div className="space-y-6">
              <Suspense fallback={<LoadingSpinner />}>
                <RecentMeetings />
              </Suspense>
              <Suspense fallback={<LoadingSpinner />}>
                <VoteSummary />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="bg-gray-50 p-8 rounded-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Technical Architecture
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Built with modern technologies for scalability, reliability, and performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Frontend</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Next.js 14 with App Router</li>
              <li>• TypeScript for type safety</li>
              <li>• Tailwind CSS for styling</li>
              <li>• Responsive design</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Backend</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Supabase PostgreSQL</li>
              <li>• Edge Functions</li>
              <li>• Row Level Security</li>
              <li>• Real-time subscriptions</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Data Pipeline</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Python scrapers</li>
              <li>• Playwright automation</li>
              <li>• GitHub Actions</li>
              <li>• AI text parsing</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Perfect For
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our platform serves multiple stakeholders in the government transparency ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🏛️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Municipal Governments</h3>
            <p className="text-gray-600">
              Automated transparency reporting that scales beyond manual processes. 
              Provide citizens with real-time access to government decisions.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📰</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">News Organizations</h3>
            <p className="text-gray-600">
              AI-powered investigative tools for government accountability. 
              Track voting patterns and extract quotes automatically.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🌐</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Civic Tech</h3>
            <p className="text-gray-600">
              Scalable solution for multiple municipalities. 
              Open source architecture for community collaboration.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center bg-gradient-to-r from-green-600 to-blue-600 text-white p-12 rounded-2xl">
        <h2 className="text-4xl font-bold mb-6">
          Ready to Transform Government Transparency?
        </h2>
        <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
          Join the growing number of municipalities and organizations using our platform 
          to provide comprehensive, real-time government accountability.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-50 transition-colors">
            Schedule a Demo
          </button>
          <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-green-600 transition-colors">
            View Documentation
          </button>
          <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-green-600 transition-colors">
            Contact Sales
          </button>
        </div>
      </section>
    </div>
  )
}
