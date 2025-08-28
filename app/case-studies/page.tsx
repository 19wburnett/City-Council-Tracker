import { Suspense } from 'react'
import { CaseStudiesList } from '@/components/case-studies/CaseStudiesList'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function CaseStudiesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Case Studies & Industry Examples
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Real examples of how Boulder City Council members voted on issues affecting different industries. 
          Use these case studies to understand voting patterns and prepare for your own proposals.
        </p>
      </div>

      {/* Industry Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold">🏗️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Development & Real Estate</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Zoning changes, building permits, development approvals, and land use decisions.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Approval Rate:</span>
              <span className="font-medium text-vote-yea">78%</span>
            </div>
            <div className="flex justify-between">
              <span>Key Issues:</span>
              <span className="font-medium">Housing, Commercial, Mixed-Use</span>
            </div>
          </div>
          <a href="/case-studies/development" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-4 inline-block">
            View Development Cases →
          </a>
        </div>

        <div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-semibold">🌱</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Environmental & Sustainability</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Climate initiatives, renewable energy, conservation, and environmental regulations.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Approval Rate:</span>
              <span className="font-medium text-vote-yea">85%</span>
            </div>
            <div className="flex justify-between">
              <span>Key Issues:</span>
              <span className="font-medium">Climate, Energy, Conservation</span>
            </div>
          </div>
          <a href="/case-studies/environmental" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-4 inline-block">
            View Environmental Cases →
          </a>
        </div>

        <div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-semibold">💼</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Business & Economic Development</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Business licensing, economic incentives, downtown development, and commercial regulations.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Approval Rate:</span>
              <span className="font-medium text-vote-yea">72%</span>
            </div>
            <div className="flex justify-between">
              <span>Key Issues:</span>
              <span className="font-medium">Licensing, Incentives, Regulations</span>
            </div>
          </div>
          <a href="/case-studies/business" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-4 inline-block">
            View Business Cases →
          </a>
        </div>

        <div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-semibold">🏠</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Housing & Affordable Housing</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Affordable housing initiatives, rental regulations, housing density, and tenant protections.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Approval Rate:</span>
              <span className="font-medium text-vote-yea">81%</span>
            </div>
            <div className="flex justify-between">
              <span>Key Issues:</span>
              <span className="font-medium">Affordability, Density, Protections</span>
            </div>
          </div>
          <a href="/case-studies/housing" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-4 inline-block">
            View Housing Cases →
          </a>
        </div>

        <div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 font-semibold">🚗</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Transportation & Infrastructure</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Road projects, bike lanes, public transit, parking, and transportation planning.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Approval Rate:</span>
              <span className="font-medium text-vote-yea">76%</span>
            </div>
            <div className="flex justify-between">
              <span>Key Issues:</span>
              <span className="font-medium">Roads, Transit, Bike Lanes</span>
            </div>
          </div>
          <a href="/case-studies/transportation" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-4 inline-block">
            View Transportation Cases →
          </a>
        </div>

        <div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-indigo-600 font-semibold">👮</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Public Safety</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Police funding, emergency services, safety regulations, and community policing.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Approval Rate:</span>
              <span className="font-medium text-vote-yea">68%</span>
            </div>
            <div className="flex justify-between">
              <span>Key Issues:</span>
              <span className="font-medium">Police, Emergency, Safety</span>
            </div>
          </div>
          <a href="/case-studies/public-safety" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-4 inline-block">
            View Public Safety Cases →
          </a>
        </div>
      </div>

      {/* Featured Case Studies */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Featured Case Studies
        </h2>
        <p className="text-gray-600 mb-6">
          High-impact decisions that demonstrate clear voting patterns and policy positions.
        </p>
        
        <Suspense fallback={<LoadingSpinner />}>
          <CaseStudiesList />
        </Suspense>
      </div>

      {/* How to Use */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          How to Use These Case Studies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">For Developers & Real Estate</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Identify which members support development projects</li>
              <li>• Understand approval patterns for different project types</li>
              <li>• Prepare for council presentations with relevant examples</li>
              <li>• Build relationships with supportive council members</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">For Business Owners</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• See how members vote on business regulations</li>
              <li>• Understand economic development priorities</li>
              <li>• Identify allies for business-friendly policies</li>
              <li>• Prepare for licensing and permitting processes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
