# PWA Offline Testing Guide for NestTask

This document provides step-by-step instructions for testing the offline functionality of the NestTask Progressive Web App (PWA), particularly focusing on the Routine Page which has been fixed to work better offline.

## Prerequisites

- A web browser that supports PWA features (Chrome, Edge, etc.)
- The NestTask application deployed and running

## Testing Steps

### 1. Load and Cache Initial Data

1. Open the NestTask application in your browser
2. Log in to your account
3. Navigate to the Routine page and ensure it loads correctly
4. Check that you can see courses, teachers, and routine data
5. Keep the application open for at least 30 seconds to ensure all data is cached

### 2. Verify Cached Data

1. Open the browser's developer tools (F12 or Ctrl+Shift+I)
2. Navigate to the "Console" tab
3. Copy and paste the entire contents of the `test-offline.js` file into the console and press Enter
4. Review the output to confirm that:
   - The service worker is active
   - IndexedDB contains cached data for routines, courses, and teachers

### 3. Test Offline Functionality

1. In the developer tools, go to the "Application" tab
2. In the left sidebar, find and check the "Offline" checkbox under the "Service Workers" section
3. Alternatively, you can disconnect your device from the internet
4. Refresh the page (it should still load)
5. Navigate to the Routine page

### 4. Check Offline Features

While offline, verify that:

1. The Routine page loads without errors
2. You can see course names and teacher information
3. You can switch between days of the week
4. You can search for courses or teachers
5. You see an offline indicator at the top of the page

### 5. Test Reconnecting

1. Uncheck the "Offline" checkbox or reconnect to the internet
2. Refresh the page
3. Verify that the offline indicator disappears
4. Verify that you can continue using the application normally

## Expected Behavior

- When offline, you should see an offline indicator banner
- The Routine page should display all previously loaded routines with course names and teacher information
- All course and teacher names should be visible (not showing as "Unknown Course" or "Unknown Teacher")
- Switching days and searching should continue to work

## Troubleshooting

If the offline functionality doesn't work as expected:

1. Clear your browser cache and try again
2. Ensure you've loaded the page while online before testing offline
3. Check that your browser supports service workers and IndexedDB
4. Verify that the service worker is registered by running this in the console:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(regs => console.log(regs));
   ```
5. Check for errors in the Console tab of developer tools

## Additional Resources

- Run `test-offline.js` in the console to diagnose issues with cached data
- Check the Application tab > IndexedDB section to see what data is stored 