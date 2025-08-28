import { Suspense } from 'react'
import { MembersList } from '@/components/members/MembersList'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function MembersPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Boulder City Council Members
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Research voting patterns, policy positions, and contact information for each council member. 
          Find case studies relevant to your industry and identify key decision makers.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Members
            </label>
            <input
              type="text"
              placeholder="Search by name or position..."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Industry Impact
            </label>
            <select className="input-field">
              <option value="">All Industries</option>
              <option value="development">Development & Real Estate</option>
              <option value="environmental">Environmental & Sustainability</option>
              <option value="business">Business & Economic Development</option>
              <option value="housing">Housing & Affordable Housing</option>
              <option value="transportation">Transportation & Infrastructure</option>
              <option value="public-safety">Public Safety</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select className="input-field">
              <option value="name">Name</option>
              <option value="position">Position</option>
              <option value="voting-frequency">Voting Frequency</option>
              <option value="yea-percentage">Yes Vote Percentage</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members List */}
      <Suspense fallback={<LoadingSpinner />}>
        <MembersList />
      </Suspense>

      {/* Industry Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Industry Insights & Case Studies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Development Projects</h3>
            <p className="text-sm text-gray-600 mb-3">
              See how members voted on recent development approvals and zoning changes.
            </p>
            <a href="/votes?category=development" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Development Votes →
            </a>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Environmental Policy</h3>
            <p className="text-sm text-gray-600 mb-3">
              Track voting patterns on sustainability initiatives and environmental regulations.
            </p>
            <a href="/votes?category=environmental" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Environmental Votes →
            </a>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Business Regulations</h3>
            <p className="text-sm text-gray-600 mb-3">
              Analyze votes on business licensing, regulations, and economic development.
            </p>
            <a href="/votes?category=business" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Business Votes →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
