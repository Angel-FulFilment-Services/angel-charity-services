import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from 'react-colorful';
import TextInput from './TextInput';

export default function ColorInput({ 
  id, 
  label, 
  currentState = '#008DA9', 
  onColorChange, 
  disabled = false,
  showSwatches = true,
  presetColors = [
    '#008DA9', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
    '#FF5722', '#795548', '#9E9E9E', '#607D8B', '#000000'
  ]
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [portalMounted, setPortalMounted] = useState(false);
  const [hexInput, setHexInput] = useState(currentState);
  const [hexError, setHexError] = useState('');

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
      // Delay mounting the color picker to ensure portal is ready
      setTimeout(() => setPortalMounted(true), 50);
    } else {
      setPortalMounted(false);
    }
  }, [isOpen]);

  // Add escape key and click outside listeners
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (event) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };

      const handleClickOutside = (event) => {
        // Don't close if clicking on the button itself
        if (buttonRef.current && buttonRef.current.contains(event.target)) {
          return;
        }
        
        // Don't close if clicking inside the dropdown
        const dropdown = document.querySelector('[data-color-picker-dropdown]');
        if (dropdown && dropdown.contains(event.target)) {
          return;
        }
        
        // Close the dropdown
        setIsOpen(false);
      };

      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Sync hex input with current color state
  useEffect(() => {
    setHexInput(currentState);
  }, [currentState]);

  const validateHexColor = (hex) => {
    if (!hex || hex.trim() === '') return null;
    
    // Remove # prefix if present and any whitespace, then uppercase
    const cleanHex = hex.replace(/^#/, '').trim().toUpperCase();
    
    // Check if it's a valid 3 or 6 digit hex color
    const isValid3Digit = /^[0-9A-F]{3}$/.test(cleanHex);
    const isValid6Digit = /^[0-9A-F]{6}$/.test(cleanHex);
    
    if (isValid3Digit) {
      // Convert 3-digit to 6-digit hex (e.g., "F0A" -> "FF00AA")
      const expanded = cleanHex.split('').map(char => char + char).join('');
      return `#${expanded}`;
    } else if (isValid6Digit) {
      return `#${cleanHex}`;
    }
    
    return null;
  };

  const handleColorChange = (color) => {
    const upperColor = color.toUpperCase();
    onColorChange(upperColor);
    setHexInput(upperColor);
  };

  const handleHexInputChange = (value) => {
    const upperValue = value.toUpperCase();
    setHexInput(upperValue);
    setHexError(''); // Clear error when user types
    
    // Try to validate and apply color immediately if it's valid
    const validatedHex = validateHexColor(upperValue);
    if (validatedHex && validatedHex !== currentState) {
      onColorChange(validatedHex);
    }
  };

  const handleHexInputBlur = () => {
    const validatedHex = validateHexColor(hexInput);
    
    if (validatedHex) {
      // Valid hex color - update the color and normalize the input
      onColorChange(validatedHex);
      setHexInput(validatedHex);
      setHexError('');
    } else if (hexInput.trim() === '') {
      // Empty input - reset to current color
      setHexInput(currentState);
      setHexError('');
    } else {
      // Invalid hex color - show error but keep the input value
      setHexError('Invalid hex color code');
    }
  };

  const handleHexInputPaste = (event) => {
    // Let the default paste happen, then process the result
    setTimeout(() => {
      const pastedValue = event.target.value.toUpperCase();
      setHexInput(pastedValue);
      setHexError('');
      
      // Validate and apply the pasted color
      const validatedHex = validateHexColor(pastedValue);
      if (validatedHex) {
        onColorChange(validatedHex);
        setHexInput(validatedHex);
      }
    }, 0);
  };

  const togglePicker = () => {
    setIsOpen(!isOpen);
  };

  const ColorPickerDropdown = () => {
    if (!isOpen) return null;

    // Create a completely isolated portal container
    return createPortal(
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 999999
        }}
      >
        <div 
          data-color-picker-dropdown
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden"
          style={{ 
            position: 'absolute',
            top: position.top,
            left: position.left,
            pointerEvents: 'auto',
            minWidth: '300px'
          }}
        >
        {/* Header with close button */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Color Picker</span>
          </div>
        </div>

        {/* Color Picker Content */}
        <div className="p-3">
          <div className="space-y-3">
            {/* Completely isolated color picker container */}
            <div 
              className="react-colorful-container"
              style={{ 
                position: 'relative',
                width: '100%',
                height: '200px'
              }}
            >
              {/* Only render HexColorPicker after portal is mounted */}
              {portalMounted && (
                <HexColorPicker
                  color={currentState}
                  onChange={handleColorChange}
                />
              )}
            </div>
            
            {/* Hex Input */}
            <div>
              <TextInput
                id={`${id}-hex`}
                label="Hex Code"
                placeholder="#000000"
                currentState={hexInput}
                onTextChange={handleHexInputChange}
                onBlur={handleHexInputBlur}
                onPaste={handleHexInputPaste}
                error={hexError}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Quick Preset Colors */}
        {showSwatches && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-600">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Colors</div>
            <div className="grid grid-cols-10 gap-1">
              {presetColors.slice(0, 20).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorChange(color)}
                  className={`
                    w-6 h-6 rounded border-2 transition-all duration-200 hover:scale-110
                    ${currentState === color 
                      ? 'border-gray-900 dark:border-white ring-2 ring-theme-500' 
                      : 'border-gray-300 dark:border-gray-500 hover:border-gray-400'
                    }
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="relative">
      {/* Add inline styles for react-colorful */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .react-colorful-container .react-colorful {
            touch-action: none !important;
          }
          .react-colorful-container .react-colorful__saturation {
            touch-action: none !important;
            cursor: crosshair !important;
          }
          .react-colorful-container .react-colorful__hue {
            touch-action: none !important;
            cursor: ew-resize !important;
          }
          .react-colorful-container .react-colorful__pointer {
            touch-action: none !important;
            cursor: grab !important;
          }
          .react-colorful-container .react-colorful__pointer:active {
            cursor: grabbing !important;
          }
        `
      }} />
      {/* Label */}
      {label && (
        <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900 dark:text-white mb-2">
          {label}
        </label>
      )}

      {/* Color Display Button */}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={togglePicker}
        disabled={disabled}
        className={`
          relative w-full flex items-center justify-between rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white 
          shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 
          placeholder:text-gray-400 dark:placeholder:text-gray-500
          focus:ring-2 focus:ring-inset focus:ring-theme-600 dark:focus:ring-theme-500
          bg-white dark:bg-gray-800
          transition-colors duration-200
          ${disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
          }
        `}
      >
        {/* Color Preview and Hex Code */}
        <div className="flex items-center space-x-3 pr-2">
          <div 
            className="w-6 h-6 rounded border border-gray-300 dark:border-gray-500 shadow-sm"
            style={{ backgroundColor: currentState }}
          />
        </div>

        {/* Dropdown Arrow */}
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Color Picker Dropdown - Rendered via Portal */}
      <ColorPickerDropdown />
    </div>
  );
}