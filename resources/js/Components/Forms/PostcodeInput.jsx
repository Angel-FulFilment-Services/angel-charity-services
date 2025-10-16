import { Fragment, useState, useEffect, useCallback } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function ComboInput(props) {
  const { id, label, currentState, placeholder, onComboChange, disabled } = props;
  const [selected, setSelected] = useState(currentState);
  const [query, setQuery] = useState(currentState || '');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchAddresses = useCallback(debounce((postcode) => {
    setIsLoading(true);
    axios.get(`https://ws.postcoder.com/pcw/PCWFM-LAPW3-UUN4P-PUYRL/address/uk/${postcode}`)
      .then(response => {
        if (response.data.length > 0) {

          console.log(response.data);

          const addresses = response.data.map((address, index) => {
            const premise = address.premise || '';
            const street = address.street || '';
            const organisation = address.organisation ? `${address.organisation}, ` : '';
            const address1 = `${organisation} ${premise}, ${street}`.trim().replace(/,\s*$/, ''); // Remove trailing comma

            return {
              id: index,
              value: address.postcode, // Use postcode as the value
              address1: address1, // Combine organisation, premise, and street
              address2: '', // Assuming there's no second address line
              address3: '', // Assuming there's no third address line
              town: address.posttown,
              county: address.county,
              displayValue: address.summaryline // Use summaryline for display
            };
          });
          setItems(addresses);
          setError('');
        } else {
          setItems([]);
          setError('No addresses found for this postcode, please enter manually.');
        }
      })
      .catch(error => {
        console.error('Error fetching addresses:', error);
        setItems([]);
        setError('Error fetching addresses');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, 500), []);

  useEffect(() => {
    if (query.length > 5) {
      fetchAddresses(query);
    } else {
      setItems([]);
      setError('');
    }
  }, [query, fetchAddresses]);

  const handleComboChange = (selectedItem) => {
    setSelected(selectedItem);
    
    // Handle case when selectedItem is null/undefined (field cleared)
    if (!selectedItem) {
      onComboChange({ 
        postcode: '', 
        line1: '', 
        line2: '', 
        line3: '',
        city: '', 
        county: '' 
      });
      return;
    }
    
    // Create an object with the address data that matches ProductCapture expectations
    const addressData = {
      postcode: selectedItem.value || '',
      line1: selectedItem.address1 || '',
      line2: selectedItem.address2 || '',
      line3: selectedItem.address3 || '',
      city: selectedItem.town || '',
      county: selectedItem.county || ''
    };
    
    onComboChange(addressData);
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    
    if (value.length === 0) {
      // Field is being cleared - reset everything
      setItems([]);
      setError('');
      setSelected(undefined);
      onComboChange({ 
        postcode: '', 
        line1: '', 
        line2: '', 
        line3: '',
        city: '', 
        county: '' 
      });
    } else if (value.length > 5) {
      // Trigger search for addresses
      fetchAddresses(value);
      onComboChange({ postcode: value });
    } else {
      // Update postcode as user types but clear search results
      setItems([]);
      setError('');
      setSelected(undefined);
      onComboChange({ postcode: value });
    }
  };

  return (
    <>
      <Combobox as="div" value={currentState} onChange={handleComboChange} className="relative">
        <Combobox.Label className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100">{label}</Combobox.Label>
        <div className="mt-2">
          <div className="w-full relative">
            <Combobox.Input
              className={`w-full rounded-md border-0 bg-white dark:bg-dark-900 py-1.5 pl-3 pr-10 z-10 text-gray-900 dark:text-dark-100 ${error && !disabled ? "ring-red-600 dark:text-red-700" : "ring-gray-300 dark:ring-dark-600"}  ${typeof selected !== "undefined" && selected && !selected.value && "text-gray-400 dark:text-dark-500"} shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:outline-none focus:ring-theme-600 dark:focus:ring-theme-700 sm:text-sm sm:leading-6 uppercase placeholder:normal-case disabled:text-gray-600 dark:disabled:text-dark-500 ${disabled ? "opacity-75 cursor-not-allowed" : ""} autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)] dark:autofill:shadow-[inset_0_0_0px_1000px_rgb(17,24,39)] autofill:ring-1 autofill:ring-inset autofill:ring-gray-300 dark:autofill:ring-dark-600`}
              onChange={handleInputChange}
              displayValue={() => query}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={2000}
              spellCheck="false" // Disable spellcheck
              autoComplete="postal-code" // Use proper autocomplete attribute for postcodes
              name="postcode-search" // Use descriptive name
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none disabled:cursor-not-allowed" disabled={disabled || isLoading}>
              {isLoading ? (
                <ArrowPathIcon className="h-5 w-5 text-gray-400 dark:text-dark-500 animate-spin" aria-hidden="true" />
              ) : (
                <ChevronUpDownIcon className={`h-5 w-5 ${error && !disabled ? "text-red-600 dark:text-red-700" : "text-gray-400 dark:text-dark-500" }`} aria-hidden="true" />
              )}
            </Combobox.Button>
          </div>
          {items.length > 0 && !isLoading && (
            <Combobox.Options className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md bg-white dark:text-dark-900 py-1 text-base shadow-lg ring-1 ring-black dark:ring-dark-50 dark:ring-opacity-5 ring-opacity-5 focus:outline-none sm:text-sm">
              {items.map((item) => (
                <Combobox.Option
                  key={item.id}
                  value={item}
                  className={({ active }) =>
                    classNames(
                      'relative cursor-default select-none py-2 pl-3 pr-9',
                      active ? 'bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-dark-100' : 'text-gray-900 dark:text-dark-100'
                    )
                  }
                >
                  {({ active, selected }) => (
                    <>
                      <span className={classNames('block truncate', selected && 'font-semibold')}>{item.displayValue}</span>
                      {selected && (
                        <span
                          className={classNames(
                            'absolute inset-y-0 right-0 flex items-center pr-4',
                            active ? 'text-white dark:text-dark-900' : 'text-theme-600 dark:text-theme-700'
                          )}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}
        </div>
        {error && !disabled && <p className="mt-2 text-sm text-red-600 dark:text-red-700">{error}</p>}
      </Combobox>
    </>
  );
}