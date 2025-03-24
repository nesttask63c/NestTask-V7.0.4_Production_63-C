/**
 * Toast notification utility for displaying temporary messages
 */

type NotificationType = 'success' | 'error' | 'info';

interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showIcon?: boolean;
}

/**
 * Show a toast notification
 * @param message The message to display
 * @param type The type of notification ('success', 'error', 'info')
 * @param options Optional configuration
 */
export function showToast(
  message: string, 
  type: NotificationType = 'info', 
  options: ToastOptions = {}
) {
  // Default options
  const {
    duration = 3000,
    position = 'bottom-right',
    showIcon = true
  } = options;
  
  // Create notification element
  const notification = document.createElement('div');
  
  // Apply position classes
  let positionClass = '';
  switch (position) {
    case 'top-right':
      positionClass = 'top-4 right-4';
      break;
    case 'top-left':
      positionClass = 'top-4 left-4';
      break;
    case 'bottom-left':
      positionClass = 'bottom-4 left-4';
      break;
    case 'bottom-right':
    default:
      positionClass = 'bottom-4 right-4';
      break;
  }
  
  // Apply classes
  notification.className = `fixed ${positionClass} px-4 py-3 rounded-xl shadow-lg z-[9999] toast-notification ${type}`;
  
  // Create icon based on type
  let iconSvg = '';
  if (showIcon) {
    switch (type) {
      case 'success':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`;
        break;
      case 'error':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>`;
        break;
      case 'info':
      default:
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`;
        break;
    }
  }
  
  // Set inner HTML with icon and message
  notification.innerHTML = `
    <div class="flex items-center gap-2">
      ${showIcon ? iconSvg : ''}
      <span>${message}</span>
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(notification);
  
  // Remove after duration
  setTimeout(() => {
    if (document.body.contains(notification)) {
      // Add fade-out animation class
      notification.classList.add('animate-fadeOut');
      
      // Remove from DOM after animation completes
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300); // Animation duration
    }
  }, duration);
  
  // Return the notification element (useful for testing or manual removal)
  return notification;
}

/**
 * Show a success toast
 */
export function showSuccessToast(message: string, options?: ToastOptions) {
  return showToast(message, 'success', options);
}

/**
 * Show an error toast
 */
export function showErrorToast(message: string, options?: ToastOptions) {
  return showToast(message, 'error', options);
}

/**
 * Show an info toast
 */
export function showInfoToast(message: string, options?: ToastOptions) {
  return showToast(message, 'info', options);
} 