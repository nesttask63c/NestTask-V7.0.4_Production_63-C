import React, { ReactNode } from 'react';
import ReactPullToRefresh from 'react-pull-to-refresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  return (
    <ReactPullToRefresh
      onRefresh={onRefresh}
      className={className || 'pull-to-refresh'}
    >
      {children}
    </ReactPullToRefresh>
  );
} 