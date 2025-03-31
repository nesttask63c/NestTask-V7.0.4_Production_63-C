import { useState, useEffect, useMemo } from 'react';
import { SearchBar } from '../components/search/SearchBar';
import { TaskList } from '../components/TaskList';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import type { Task } from '../types';

interface SearchPageProps {
  tasks: Task[];
}

export function SearchPage({ tasks }: SearchPageProps) {
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isOffline = useOfflineStatus();
  
  // Cache search results in localStorage
  const SEARCH_CACHE_KEY = 'search_results_cache';
  
  // Optimized search function with memoization
  const performSearch = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    if (!normalizedQuery) {
      return [];
    }
    
    console.log(`Searching for "${normalizedQuery}" in ${tasks.length} tasks`);
    
    return tasks.filter(task => 
      task.name.toLowerCase().includes(normalizedQuery) ||
      task.description.toLowerCase().includes(normalizedQuery) ||
      task.category.toLowerCase().includes(normalizedQuery)
    );
  }, [searchQuery, tasks]);
  
  // Update results when search query or tasks change
  useEffect(() => {
    if (searchQuery) {
      setSearchResults(performSearch);
      setHasSearched(true);
      
      // Save to localStorage if online (as offline data is already in IndexedDB)
      if (!isOffline && performSearch.length > 0) {
        try {
          localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify({
            query: searchQuery,
            results: performSearch.map(task => task.id), // Store just the IDs to save space
            timestamp: Date.now()
          }));
        } catch (err) {
          console.error('Error caching search results:', err);
        }
      }
    }
  }, [searchQuery, performSearch, isOffline]);
  
  // Try to restore cached search on initial load
  useEffect(() => {
    const cachedSearch = localStorage.getItem(SEARCH_CACHE_KEY);
    
    if (cachedSearch) {
      try {
        const { query, results, timestamp } = JSON.parse(cachedSearch);
        const cacheAge = Date.now() - timestamp;
        
        // Use cache if it's less than 1 hour old
        if (cacheAge < 60 * 60 * 1000) {
          setSearchQuery(query);
          
          // Match task IDs with current task objects
          const taskMap = new Map(tasks.map(task => [task.id, task]));
          const cachedResults = results
            .map((id: string) => taskMap.get(id))
            .filter(Boolean); // Remove any undefined entries
            
          if (cachedResults.length > 0) {
            setSearchResults(cachedResults as Task[]);
            setHasSearched(true);
          }
        }
      } catch (err) {
        console.error('Error restoring cached search:', err);
      }
    }
  }, [tasks]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Search Tasks</h1>
      
      <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
      
      {hasSearched ? (
        searchResults.length > 0 ? (
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Found {searchResults.length} {searchResults.length === 1 ? 'task' : 'tasks'} matching "{searchQuery}"
            </div>
            <TaskList tasks={searchResults} />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No tasks found matching your search
          </div>
        )
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Enter a search term to find tasks
        </div>
      )}
    </div>
  );
}