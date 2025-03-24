import { formatDate } from '../utils/dateUtils';
import type { Task } from '../types';
import type { Announcement } from '../types/announcement';

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
const TELEGRAM_API = TELEGRAM_BOT_TOKEN ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}` : '';
const APP_DOMAIN = 'https://nesttask.vercel.app';

/**
 * Sends a message to Telegram with optional photo attachment
 * @param {string} text - The message text to send. Supports HTML formatting
 * @param {string} [photo] - Optional URL of an image to send with the message
 * @returns {Promise<boolean>} - Returns true if message was sent successfully, false otherwise
 * @example
 * // Send text message
 * await sendTelegramMessage("Hello world!");
 * // Send message with photo
 * await sendTelegramMessage("Check this image!", "https://example.com/image.jpg");
 */
export async function sendTelegramMessage(text: string, photo?: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return false;
  }

  try {
    console.log('Sending message with:', { TELEGRAM_API, TELEGRAM_CHAT_ID });
    
    if (photo) {
      const requestBody = {
        chat_id: TELEGRAM_CHAT_ID,
       // message_thread_id: 204,  // Correct topic ID from the URL
        photo,
        caption: text,
        parse_mode: 'HTML',
      };
      console.log('Photo message request:', requestBody);
      
      const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log('Telegram API response:', responseData);

      if (!response.ok) {
        throw new Error(`Failed to send Telegram photo message: ${JSON.stringify(responseData)}`);
      }
    } else {
      const requestBody = {
        chat_id: TELEGRAM_CHAT_ID,
      //  message_thread_id: 204,  // Correct topic ID from the URL
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      };
      console.log('Text message request:', requestBody);

      const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log('Telegram API response:', responseData);

      if (!response.ok) {
        throw new Error(`Failed to send Telegram message: ${JSON.stringify(responseData)}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

/**
 * Gets the appropriate emoji for a task category
 * @param {string} category - The task category name
 * @returns {string} - Returns an emoji representing the category
 * @example
 * const emoji = getCategoryEmoji('assignment'); // Returns '📚'
 */
const getCategoryEmoji = (category: string) => {
  switch (category) {
    case 'presentation': return '👔';
    case 'project': return '📋';
    case 'assignment': return '📃';
    case 'quiz': return '📚';
    case 'lab-report': return '🔬';
    case 'lab-final': return '🧪';
    case 'documents': return '📄';
    case 'blc': return '🗃️';
    case 'groups': return '👥';
    default: return '📋';
  }
};

/**
 * Sends a task notification to Telegram
 * @param {Task} task - The task object containing all task details
 * @returns {Promise<boolean>} - Returns true if notification was sent successfully
 * @description
 * Formats and sends a task notification with:
 * - Task name and category
 * - Description
 * - Category and due date
 * - Link to view full details
 */
export async function sendTaskNotification(task: Task) {
  /**
   * Processes description text to handle links and formatting
   * @param {string} text - The raw description text
   * @returns {string} - Formatted text with HTML links and preserved line breaks
   */
  const processDescription = (text: string) => {
    // Replace markdown-style links with HTML links
    const withLinks = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    // Preserve line breaks
    return withLinks.replace(/\n/g, '\n');
  };

  const message = `
🎯 <b>${task.name}</b>

💬 <b>Description:</b>
${processDescription(task.description)}
🏷️ <b>Category:</b> #${task.category}
📅 <b>Due Date:</b> ${formatDate(new Date(task.dueDate), 'MMMM d, yyyy')}


🌐 <b><a href="${APP_DOMAIN}">View full details</a></b>`;

  return sendTelegramMessage(message);
}

/**
 * Sends an announcement notification to Telegram
 * @param {Announcement} announcement - The announcement object containing title and content
 * @returns {Promise<boolean>} - Returns true if announcement was sent successfully
 * @description
 * Formats and sends an announcement with:
 * - Professional header with NestTask branding
 * - Announcement title and content
 * - Link to view more details
 * - Professional footer
 */
export async function sendAnnouncementNotification(announcement: Announcement) {
  // Try to find an image URL in the announcement content
  const imageUrl = announcement.content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i)?.[0];

  const message = `

🎯 <b>${announcement.title}</b>

${announcement.content}


🌐 <b><a href="${APP_DOMAIN}">View full details</a></b>`;

  return sendTelegramMessage(message, imageUrl);
}

/**
 * Test function to verify Telegram messaging functionality
 * @returns {Promise<boolean>} - Returns true if test message was sent successfully
 * @description Sends a simple test message to verify bot token, chat ID, and permissions
 */
export async function testTelegramMessage() {
  const result = await sendTelegramMessage('Test message from NestTask');
  console.log('Test message result:', result);
  return result;
}
