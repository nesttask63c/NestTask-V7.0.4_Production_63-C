import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { VariableSizeList as List, ListChildComponentProps, ListOnItemsRenderedProps } from 'react-window';
import { useWindowSize } from 'usehooks-ts';
import { useInView } from 'react-intersection-observer';

// Types
interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number, style: React.CSSProperties) => ReactNode;
  getItemHeight?: (item: T, index: number) => number;
  className?: string;
  overscan?: number;
  initialScrollOffset?: number;
  estimatedItemSize?: number;
  placeholder?: ReactNode;
  loadingPlaceholder?: ReactNode;
  emptyPlaceholder?: ReactNode;
  isLoading?: boolean;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  onItemsRendered?: (info: { visibleStartIndex: number; visibleStopIndex: number }) => void;
}

// Default item height if not provided
const DEFAULT_ITEM_HEIGHT = 60;
const DEFAULT_OVERSCAN = 5;
const DEFAULT_END_REACHED_THRESHOLD = 0.9; // 90% of the way down

export function VirtualizedList<T>({
  items,
  renderItem,
  getItemHeight,
  className = '',
  overscan = DEFAULT_OVERSCAN,
  initialScrollOffset = 0,
  estimatedItemSize = DEFAULT_ITEM_HEIGHT,
  placeholder,
  loadingPlaceholder,
  emptyPlaceholder,
  isLoading = false,
  onEndReached,
  endReachedThreshold = DEFAULT_END_REACHED_THRESHOLD,
  onItemsRendered,
}: VirtualizedListProps<T>) {
  const { width, height } = useWindowSize();
  const listRef = useRef<List>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [endDetectorRef, inView] = useInView({
    threshold: endReachedThreshold,
    triggerOnce: false,
  });
  
  // Calculate dynamic container height
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const offsetTop = rect.top;
      const availableHeight = viewportHeight - offsetTop;
      
      // Ensure we have at least 200px or 50% of viewport height, whichever is greater
      const minHeight = Math.max(200, viewportHeight * 0.5);
      const newHeight = Math.max(minHeight, availableHeight - 20); // 20px padding
      
      setContainerHeight(newHeight);
    }
  }, [width, height]);
  
  // Handle end reached callback
  useEffect(() => {
    if (inView && onEndReached && !isLoading && items.length > 0) {
      onEndReached();
    }
  }, [inView, onEndReached, isLoading, items.length]);
  
  // Default item height function
  const itemHeightFn = (index: number): number => {
    if (getItemHeight && items[index]) {
      return getItemHeight(items[index], index);
    }
    return estimatedItemSize;
  };
  
  // Row renderer
  const ItemRenderer = ({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    
    if (!item) {
      return placeholder ? (
        <div style={style}>
          {placeholder}
        </div>
      ) : null;
    }
    
    // Add bottom detector to the last item
    if (index === items.length - 1) {
      return (
        <div style={style}>
          {renderItem(item, index, {})}
          <div ref={endDetectorRef} style={{ height: 1 }} />
        </div>
      );
    }
    
    return renderItem(item, index, style);
  };
  
  // Handle the case of empty or loading state
  if (isLoading && items.length === 0 && loadingPlaceholder) {
    return <div className={className}>{loadingPlaceholder}</div>;
  }
  
  if (!isLoading && items.length === 0 && emptyPlaceholder) {
    return <div className={className}>{emptyPlaceholder}</div>;
  }
  
  return (
    <div
      ref={containerRef}
      className={`virtualized-list-container ${className}`}
      style={{ height: '100%', width: '100%', overflow: 'hidden' }}
    >
      {containerHeight > 0 && items.length > 0 && (
        <List
          ref={listRef}
          width="100%"
          height={containerHeight}
          itemCount={items.length}
          itemSize={itemHeightFn}
          overscanCount={overscan}
          initialScrollOffset={initialScrollOffset}
          onItemsRendered={(props: ListOnItemsRenderedProps) => {
            if (onItemsRendered) {
              onItemsRendered({ 
                visibleStartIndex: props.visibleStartIndex, 
                visibleStopIndex: props.visibleStopIndex 
              });
            }
          }}
        >
          {ItemRenderer}
        </List>
      )}
      
      {/* Loading indicator at the bottom */}
      {isLoading && items.length > 0 && loadingPlaceholder && (
        <div className="virtualized-list-loading">
          {loadingPlaceholder}
        </div>
      )}
    </div>
  );
} 