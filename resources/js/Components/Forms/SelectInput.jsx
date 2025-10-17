import { Fragment, useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function SelectInput(props) {
  const { id, label, currentState, items, onSelectChange, onBlur, placeholder, error, clearErrors, annotation, returnRaw, disabled = false } = props;
  
  const [selected, setSelected] = useState({id: id, value: currentState || ''});
  const listboxRef = useRef(null);
  const optionsRef = useRef(null);

  useEffect(() => {
    if (items) {
      if (currentState) {
        const foundItem = items.find(item => item.value === currentState);
        if (foundItem) {
          setSelected(foundItem);
        }
      } else {
        // Clear the selected state when currentState is empty
        setSelected({id: id, value: ''});
      }
    }
  }, [currentState, items, id]);

  // Function to check if dropdown overflows viewport and scroll into view
  const handleDropdownOpen = () => {
    setTimeout(() => {
      if (optionsRef.current && listboxRef.current) {
        const dropdown = optionsRef.current;
        const container = listboxRef.current;
        const rect = dropdown.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Check if dropdown overflows bottom of viewport
        const viewportHeight = window.innerHeight;
        const overflowsBottom = rect.bottom > viewportHeight;
        
        // Check if dropdown overflows top of viewport
        const overflowsTop = rect.top < 0;
        
        if (overflowsBottom || overflowsTop) {
          // Scroll the container into view with some padding
          container.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }
    }, 100); // Small delay to ensure dropdown is rendered
  };

  const handleSelectChange = (event) => {
    if (returnRaw === false) {
      // Legacy format for backward compatibility
      onSelectChange([{id: id, value: event.value}]);
    } else {
      // Default: return just the value
      onSelectChange(event.value);
    }
    if (clearErrors) clearErrors();
  }

  return (
    <Listbox key={id} value={currentState} onChange={ e => { setSelected(e); handleSelectChange(e);}}>
      {({ open }) => {
        // Handle dropdown opening
        if (open) {
          handleDropdownOpen();
        }
        
        return (
        <>
          { (label || annotation) &&
            <Listbox.Label className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100 mb-2">
              {label}
              { annotation && 
                <span className='text-neutral-500 dark:text-dark-400 font-normal'> {annotation} </span>
              }
            </Listbox.Label>
          }
          
          <div className="relative" ref={listboxRef}>
              <Listbox.Button disabled={disabled} className={`relative w-full ${disabled ? 'cursor-not-allowed opacity-75' : 'cursor-default'} rounded-md bg-white dark:bg-dark-900 py-1.5 pl-3 pr-10 text-left text-gray-900 dark:text-dark-100 shadow-sm ring-1 ring-inset ${error ? "ring-red-600 text-red-800 dark:ring-red-700 dark:text-red-900" : "ring-gray-300 dark:ring-dark-600"} ${disabled ? '' : 'focus:outline-none focus:ring-2 focus:ring-theme-600 dark:focus:ring-theme-700'} sm:text-sm sm:leading-6`}>
                <span className={`block truncate ${(typeof selected == "undefined" || !selected.value) && "text-gray-400 dark:text-dark-500"}`}>{typeof selected !== "undefined" && selected.value ? selected.value : `${placeholder}`}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                {error ? 
                  <ExclamationCircleIcon className="absolute right-2 top-1/2 transform w-5 h-5 text-red-600 dark:text-red-700 -translate-y-1/2 pointer-events-none" />
                  :
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" aria-hidden="true" />
                }
                </span>
              </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options 
                ref={optionsRef}
                className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-dark-900 py-1 text-base shadow-lg ring-1 ring-black dark:ring-dark-50 dark:ring-opacity-5 ring-opacity-5 focus:outline-none sm:text-sm"
              >
                {items.map((item) => (
                    <Listbox.Option
                        key={item.id}
                        className={({ active }) =>
                        classNames(
                            active ? 'bg-gray-100 text-gray-900 dark:bg-dark-800 dark:text-dark-100' : 'text-gray-900 dark:text-dark-100',
                            'relative cursor-default select-none py-2 pl-3 pr-9'
                        )
                        }
                        value={item}
                    >
                        {({ selected, active }) => (
                        <>
                            <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                            {item.value}
                            </span>
                            {currentState === item.value ? (
                            <span
                                className={classNames(
                                active ? 'text-gray-900 dark:text-dark-100' : 'text-theme-600 dark:text-theme-700',
                                'absolute inset-y-0 right-0 flex items-center pr-4'
                                )}
                            >
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            ) : null}
                        </>
                        )}
                    </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
            {error && <div className="text-red-600 dark:text-red-700 text-sm pt-2">{error.message || error}</div>}
          </div>
        </>
        );
      }}
    </Listbox>
  )
}
