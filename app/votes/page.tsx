'use client'

import { Suspense, useState } from 'react'
import { VotesAnalysis } from '@/components/votes/VotesAnalysis'
import { VotesFilter } from '@/components/votes/VotesFilter'
import { VotesKPIs } from '@/components/votes/VotesKPIs'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function VotesPage() {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    member: '',
    voteValue: ''
  })

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Voting Records & Analysis
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Search and analyze council voting patterns by topic, industry impact, and individual members. 
          Find case studies relevant to your business or organization.
        </p>
      </div>

      {/* Search and Filter */}
      <VotesFilter onFiltersChange={handleFiltersChange} />

      {/* Dynamic KPI Stats */}
      <VotesKPIs filters={filters} />

      {/* Industry Analysis */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Industry Impact Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Housing & Development</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span className="font-medium">232</span>
              </div>
              <div className="flex justify-between">
                <span>Key Issues:</span>
                <span className="font-medium">Housing, Zoning, Permits</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="font-medium">housing</span>
              </div>
            </div>
            <a href="/votes?category=housing" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-3 inline-block">
              View Housing Votes →
            </a>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Climate Change</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span className="font-medium">16</span>
              </div>
              <div className="flex justify-between">
                <span>Key Issues:</span>
                <span className="font-medium">Sustainability, Climate</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="font-medium">climate change</span>
              </div>
            </div>
            <a href="/votes?category=climate change" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-3 inline-block">
              View Climate Votes →
            </a>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Business & Economic</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span className="font-medium">56</span>
              </div>
              <div className="flex justify-between">
                <span>Key Issues:</span>
                <span className="font-medium">Licensing, Regulations</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="font-medium">business</span>
              </div>
            </div>
            <a href="/votes?category=business" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-3 inline-block">
              View Business Votes →
            </a>
          </div>
        </div>
      </div>

      {/* Votes Analysis */}
      <Suspense fallback={<LoadingSpinner />}>
        <VotesAnalysis filters={filters} />
      </Suspense>
    </div>
  )
}
