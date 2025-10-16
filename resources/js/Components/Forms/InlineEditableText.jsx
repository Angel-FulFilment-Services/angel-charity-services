import { useState, useRef, useEffect } from 'react';

export default function InlineEditableText({ 
  value, 
  onChange, 
  className = '', 
  placeholder = 'Click to edit...',
  padding = true,
  disabled = false
}) {
  const [editValue, setEditValue] = useState(value || '');
  const textareaRef = useRef(null);

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  // Auto-resize textarea to fit content
  const autoResize = (element) => {
    if (element) {
      // Get the parent container width to determine available space
      const parentWidth = element.parentElement ? element.parentElement.offsetWidth : window.innerWidth;
      const content = element.value || element.placeholder || '';
      
      // Calculate optimal width first
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.whiteSpace = 'pre';
      tempDiv.style.font = window.getComputedStyle(element).font;
      tempDiv.style.fontSize = window.getComputedStyle(element).fontSize;
      tempDiv.style.fontFamily = window.getComputedStyle(element).fontFamily;
      tempDiv.style.fontWeight = window.getComputedStyle(element).fontWeight;
      tempDiv.style.letterSpacing = window.getComputedStyle(element).letterSpacing;
      tempDiv.textContent = content;
      
      document.body.appendChild(tempDiv);
      const textWidth = tempDiv.offsetWidth;
      document.body.removeChild(tempDiv);
      
      // Add buffer width for extra characters to prevent wrapping during typing
      const bufferDiv = document.createElement('div');
      bufferDiv.style.position = 'absolute';
      bufferDiv.style.visibility = 'hidden';
      bufferDiv.style.whiteSpace = 'pre';
      bufferDiv.style.font = window.getComputedStyle(element).font;
      bufferDiv.style.fontSize = window.getComputedStyle(element).fontSize;
      bufferDiv.style.fontFamily = window.getComputedStyle(element).fontFamily;
      bufferDiv.style.fontWeight = window.getComputedStyle(element).fontWeight;
      bufferDiv.style.letterSpacing = window.getComputedStyle(element).letterSpacing;
      bufferDiv.textContent = 'MMM'; // Buffer for ~3 average characters
      
      document.body.appendChild(bufferDiv);
      const bufferWidth = bufferDiv.offsetWidth / 2.5;
      document.body.removeChild(bufferDiv);
      
      // Calculate final width with buffer
      const paddingX = 32; // 16px on each side
      const desiredWidth = textWidth + bufferWidth + paddingX;
      const maxAvailableWidth = parentWidth - 20; // Leave some margin
      const finalWidth = Math.max(Math.min(desiredWidth, maxAvailableWidth), 100);
      
      // Create clone with the final width to measure height accurately
      const clone = element.cloneNode(false);
      clone.style.position = 'absolute';
      clone.style.visibility = 'hidden';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.width = finalWidth + 'px'; // Use the final width
      clone.style.height = 'auto';
      clone.style.minHeight = '0';
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'hidden';
      clone.value = content;
      
      // Measure height with the correct width
      document.body.appendChild(clone);
      const naturalHeight = Math.max(clone.scrollHeight, 26);
      document.body.removeChild(clone);
      
      // Apply both width and height simultaneously to avoid flickering
      element.style.width = finalWidth + 'px';
      element.style.height = naturalHeight + 'px';
    }
  };

  // Auto-resize on mount and when content changes
  useEffect(() => {
    if (textareaRef.current) {
      autoResize(textareaRef.current);
    }
  }, [editValue]);

  // Initial resize on mount and add window resize listener
  useEffect(() => {
    const handleResize = () => {
      if (textareaRef.current) {
        autoResize(textareaRef.current);
      }
    };

    // Initial resize
    if (textareaRef.current) {
      autoResize(textareaRef.current);
    }

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
    
    autoResize(e.target);
  };

  const baseStyles = `
    border-none outline-none resize-none overflow-hidden
    placeholder-gray-400 dark:placeholder-gray-500
    focus:ring-0 focus:border-0
    bg-black bg-opacity-5 dark:bg-white dark:bg-opacity-5
    hover:bg-opacity-10 dark:hover:bg-opacity-10
    focus:bg-opacity-15 dark:focus:bg-opacity-15
    transition-all duration-200 rounded-lg px-2
    ${className.replace(/w-full|block/g, '').trim()}
    ${padding ? 'py-1' : ''}
  `;

  return (
    <textarea
      ref={textareaRef}
      value={editValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={baseStyles}
      style={{ 
        minHeight: '1.5em',
        minWidth: '100px',
        resize: 'none',
        overflow: 'hidden'
      }}
      rows={1}
    />
  );
}