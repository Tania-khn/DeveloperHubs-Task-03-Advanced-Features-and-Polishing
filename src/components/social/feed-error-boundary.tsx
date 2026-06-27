'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}
interface State {
  hasError: boolean
  error: Error | null
}

/**
 * FeedErrorBoundary
 *
 * Catches render errors anywhere in the feed subtree and shows a
 * friendly retry UI instead of a blank screen.
 */
export class FeedErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In a real app this would go to Sentry / Datadog.
    console.error('[FeedErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 p-6 text-center">
          <AlertTriangle className="size-8 mx-auto mb-3 text-amber-500" />
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Something went wrong
          </h3>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 max-w-sm mx-auto">
            {this.state.error?.message || 'An unexpected error occurred while rendering the feed.'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={this.handleReset}
            className="mt-4 gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
