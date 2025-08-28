'use client'

import { useState } from 'react'

interface VotesFilterProps {
  onFiltersChange: (filters: {
    search: string
    category: string
    member: string
    voteValue: string
  }) => void
}

export function VotesFilter({ onFiltersChange }: VotesFilterProps) {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    member: '',
    voteValue: ''
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      member: '',
      voteValue: ''
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Votes
          </label>
          <input
            type="text"
            placeholder="Search by topic or agenda item..."
            className="input-field"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry Category
          </label>
          <select 
            className="input-field"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="housing">Housing (232 items)</option>
            <option value="other">Other (128 items)</option>
            <option value="business">Business (56 items)</option>
            <option value="budget">Budget (32 items)</option>
            <option value="ballot measure">Ballot Measure (24 items)</option>
            <option value="development review">Development Review (24 items)</option>
            <option value="climate change">Climate Change (16 items)</option>
            <option value="executive session">Executive Session (16 items)</option>
            <option value="transportation">Transportation (8 items)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Council Member
          </label>
          <select 
            className="input-field"
            value={filters.member}
            onChange={(e) => handleFilterChange('member', e.target.value)}
          >
            <option value="">All Members</option>
            <option value="Aaron Brockett">Aaron Brockett (Mayor)</option>
            <option value="Lauren Folkerts">Lauren Folkerts (Mayor Pro Tem)</option>
            <option value="Matt Benjamin">Matt Benjamin</option>
            <option value="Tara Winer">Tara Winer</option>
            <option value="Tina Marquis">Tina Marquis</option>
            <option value="Taishya Adams">Taishya Adams</option>
            <option value="Bob Yates">Bob Yates</option>
            <option value="Mark Wallach">Mark Wallach</option>
            <option value="Nicole Speer">Nicole Speer</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vote Outcome
          </label>
          <select 
            className="input-field"
            value={filters.voteValue}
            onChange={(e) => handleFilterChange('voteValue', e.target.value)}
          >
            <option value="">All Votes</option>
            <option value="YEA">Yes Votes</option>
            <option value="NAY">No Votes</option>
            <option value="ABSTAIN">Abstentions</option>
          </select>
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        <button 
          className="btn-secondary"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
        <button className="btn-secondary">
          Export Results
        </button>
      </div>
    </div>
  )
}
