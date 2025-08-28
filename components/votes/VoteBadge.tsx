interface VoteBadgeProps {
  vote: 'YEA' | 'NAY' | 'ABSTAIN'
  size?: 'sm' | 'md' | 'lg'
}

export function VoteBadge({ vote, size = 'md' }: VoteBadgeProps) {
  const getVoteStyles = () => {
    const baseStyles = 'font-medium rounded-full'
    
    switch (vote) {
      case 'YEA':
        return `${baseStyles} bg-vote-yea/10 text-vote-yea border border-vote-yea/20`
      case 'NAY':
        return `${baseStyles} bg-vote-nay/10 text-vote-nay border border-vote-nay/20`
      case 'ABSTAIN':
        return `${baseStyles} bg-vote-abstain/10 text-vote-abstain border border-vote-abstain/20`
      default:
        return `${baseStyles} bg-gray-100 text-gray-700 border border-gray-200`
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs'
      case 'lg':
        return 'px-4 py-2 text-base'
      default:
        return 'px-3 py-1 text-sm'
    }
  }

  return (
    <span className={`${getVoteStyles()} ${getSizeStyles()}`}>
      {vote}
    </span>
  )
}
