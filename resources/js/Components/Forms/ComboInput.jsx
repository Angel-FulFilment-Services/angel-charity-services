import { Fragment, useState } from 'react'
import PropTypes from 'prop-types';
import { Combobox } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid'
import { CheckCircleIcon } from '@heroicons/react/24/outline';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function ComboInput(props) {
  const { id, label, currentState, items, placeholder, spellCheck, onComboChange, onBlur, error, confirmed, clearErrors, disabled, action, uppercase, annotation } = props;
  const [selected, setSelected] = useState((currentState && items.find(item => item.value === currentState) || { id: id, value: currentState }));
  const [query, setQuery] = useState('');
  
  var filteredItems =
    query === ''
      ? items
      : items.filter((item) => {
          return item.value.toLowerCase().includes(query.toLowerCase())
        })

  const handleComboChange = (event) => {
    if (!event || !event.value){
      onComboChange([{id: id, value: ''}]);
      return;
    }
      
    onComboChange([{id: id, value: event.value}]);
    if (clearErrors) clearErrors();
  }

  return (
    <>
      <Combobox as="div" value={currentState} onChange={ e => { setSelected(e); handleComboChange(e);}}>
        <Combobox.Label className="block text-sm font-medium leading-6 text-gray-900 dark:text-dark-100">
          {label}
          { annotation && 
            <span className='text-neutral-500 dark:text-dark-400 font-normal'> {annotation} </span>
          }
        </Combobox.Label>
        <div className="relative mt-2">
          <Combobox.Input
            className={`w-full rounded-md border-0 bg-white dark:bg-dark-900 py-1.5 pl-3 pr-10 z-10 text-gray-900 dark:text-dark-100 ${confirmed ? "ring-green-500 dark:ring-green-600 text-green-800" : typeof selected !== "undefined" && !selected?.value && error ? "ring-red-600 text-red-800 dark:ring-red-700 dark:text-red-900" : "ring-gray-300 dark:ring-dark-600"} shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-dark-600 focus:outline-none ${!confirmed ? "focus:ring-2 focus:ring-inset focus:ring-theme-600 dark:focus:ring-theme-700" : ""} sm:text-sm sm:leading-6 disabled:text-gray-600 dark:disabled:text-dark-500 ${disabled ? "opacity-75 cursor-not-allowed" : ""} ${uppercase ? "uppercase placeholder:normal-case" : ""}`}
            onChange={(event) => {setQuery(event.target.value); handleComboChange(event.target);}}
            onBlur={ e => { if(onBlur) onBlur([id]);}}
            placeholder={placeholder}
            spellCheck={spellCheck}
            disabled={disabled}
            displayValue={currentState}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none disabled:cursor-not-allowed" disabled={disabled}>
            {error ? 
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-700" />
            : confirmed ?
              <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-600" aria-hidden="true" />
            :
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-dark-500" aria-hidden="true" />
            }
          </Combobox.Button>
          {filteredItems.length > 0 && (
            <Combobox.Options className="absolute z-10 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-dark-900 py-1 text-base shadow-lg ring-1 ring-black dark:ring-dark-50 dark:ring-opacity-5 ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredItems.map((item) => (
                <Combobox.Option
                  key={item.id}
                  value={item}
                  className={({ active }) =>
                    classNames(
                      'relative cursor-default select-none py-2 pl-3 pr-9',
                      active ? 'bg-gray-100 text-gray-900 dark:bg-dark-800 dark:text-dark-100' : 'text-gray-900 dark:text-dark-100'
                    )
                  }
                >
                  {({ active, selected }) => (
                    <>
                      <span className={classNames('block truncate', selected && 'font-semibold')}>{item.value}</span>

                      {currentState === item.value && (
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
          {
            filteredItems.length === 0 && query !== '' && action && (
              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-dark-900 py-1 text-base shadow-lg ring-1 ring-black dark:ring-dark-50 dark:ring-opacity-5 ring-opacity-5 focus:outline-none sm:text-sm">
                <Combobox.Option
                  value={{ id: 'action', value: action.value }}
                  className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 dark:text-dark-100 cursor-pointer"
                >
                  { action.item }
                </Combobox.Option>
              </Combobox.Options>
            )
          }
        </div>
      </Combobox>
      {error && <div className="text-red-600 dark:text-red-700 text-sm pt-2">{error.message}</div>}
    </>
  )
}
