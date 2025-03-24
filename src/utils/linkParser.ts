// Regular expression to match URLs in text
const URL_REGEX = /(https?:\/\/[^\s<>]+)/g;

export function parseLinks(text: string): Array<{ type: 'text' | 'link'; content: string }> {
  if (!text) return [{ type: 'text', content: '' }];
  
  const parts: Array<{ type: 'text' | 'link'; content: string }> = [];
  let lastIndex = 0;
  
  // Find all URLs in the text
  const matches = Array.from(text.matchAll(URL_REGEX));
  
  if (matches.length === 0) {
    // If no URLs found, return the entire text as a text part
    return [{ type: 'text', content: text }];
  }

  matches.forEach((match) => {
    const url = match[0];
    const index = match.index!;
    
    // Add text before the URL if there is any
    if (index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, index)
      });
    }
    
    // Add the URL
    parts.push({
      type: 'link',
      content: url
    });
    
    lastIndex = index + url.length;
  });
  
  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }
  
  return parts;
}
