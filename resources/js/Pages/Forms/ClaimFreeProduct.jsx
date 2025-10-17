import { useState, useEffect, useRef } from 'react';
import PostcodeInput from '../../Components/Forms/PostcodeInput';
import TextInput from '../../Components/Forms/TextInput';
import SelectInput from '../../Components/Forms/SelectInput';
import CheckboxGroupInput from '../../Components/Forms/CheckboxGroupInput';
import ScrollHint from '../../Components/Hints/ScrollHint';
import Lottie from 'lottie-react';
import { getColors, replaceColor } from 'lottie-colorify';
import animationLoading from '../../../animations/gift.json';
import animationSuccess from '../../../animations/success.json';
import { generateColorScale, injectThemeColors, replaceAnimationColors } from '../../Utils/Color';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  validateRequired, 
  validateIsLength, 
  validateIsPostalCode,
  validateIsAlpha 
} from '../../Utils/Validation';
import { 
  sanitizeTrim, 
  sanitizeEscape,
  sanitizeToUpperCase,
  sanitizeProperCase,
  stripHtmlTags 
} from '../../Utils/Sanitisers';
import { 
  UserIcon, 
  HomeIcon, 
  MapPinIcon, 
  BuildingOfficeIcon,
  IdentificationIcon,
  GiftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { ring } from 'ldrs';


export default function ProductCapture({ 
  guid, // Add guid prop
  title,
  surname,
  ngn,
  client_image,
  client_name,
  loading_title,
  loading_message,
  completed_title,
  completed_message,
  product_title,
  product_message,
  product_name,
  product_image,
  client_url,
  contact_url,
  privacy_url,
  privacy_notice,
  theme_colour, // New prop for custom theme color (hex or rgb)
  communication_channels = [], // Array of communication channel objects
  status,
  // Temporary image paths for preview fallback
  product_image_path,
  client_image_path
}) {

  const themeColour = theme_colour || '#008DA9'; // Default to blue if not provided

  // Process and format communication channels for CheckboxGroupInput
  const formattedCommunicationChannels = communication_channels
    ? communication_channels
        .filter(channel => channel && channel.channel && channel.label) // Filter out invalid entries
        .map(channel => ({
          value: channel.channel,
          label: channel.label,
          type: channel.type || 'opt-in' // Default to opt-in if type not specified
        }))
    : [];

  // Loading state for initial page load - initialize based on status to prevent flashing
  const [isLoading, setIsLoading] = useState(status !== 'completed' && status !== 'processing');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationDataLoading, setAnimationDataLoading] = useState(null);
  const [animationDataSuccess, setAnimationDataSuccess] = useState(null);
  
  // Completion state for form submission - initialize to true if status is completed or processing
  const [isCompleted, setIsCompleted] = useState(status === 'completed' || status === 'processing');
  const [isCompletionTransitioning, setIsCompletionTransitioning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref for scroll hint
  const scrollRef = useRef(null);

  // Register LDRS component
  useEffect(() => {
    ring.register();
  }, []);

  // Inject custom theme colors
  useEffect(() => {
    if (themeColour) {
      const colourScale = generateColorScale(themeColour);
      const colours = Object.values(colourScale).map(c => [c.r, c.g, c.b]);

      const colourScaleComplete = generateColorScale('#28a745'); // Green for success
      const coloursComplete = Object.values(colourScaleComplete).map(c => [c.r, c.g, c.b]);

      // Manually set the target colours for the animation.
      const targetColours = Object.values([
        colours[7],
        colours[4],
        colours[4],
        colours[4],
        colours[5],
        colours[2],
      ]);

      setAnimationDataLoading(replaceAnimationColors(getColors(animationLoading), targetColours, animationLoading));

      const targetColoursSuccess = Object.values([
        coloursComplete[1],
        coloursComplete[5],
        coloursComplete[3],
        coloursComplete[6],
        coloursComplete[7],
        coloursComplete[3],
        coloursComplete[6],
      ]);

      setAnimationDataSuccess(replaceAnimationColors(getColors(animationSuccess), targetColoursSuccess, animationSuccess));

      injectThemeColors(colourScale);
    }
  }, [themeColour]);

  // Initialize page loading
  useEffect(() => {
    // Check if status is completed or processing and skip directly to completed state
    if (status === 'completed' || status === 'processing') {
      // Skip loading entirely and go straight to completed state
      setIsLoading(false);
      setIsCompleted(true);

      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 200); // 2 second loading time

      return () => clearTimeout(timer);

    } else {
      setIsLoaded(true);
      // Normal loading flow for pending status
      const timer = setTimeout(() => {
        setIsTransitioning(true);
        // After transition starts, complete it
        setTimeout(() => {
          setIsLoading(false);
        }, 400); // 400ms transition duration (reduced from 800ms)
      }, 1600); // 2 second loading time

      return () => clearTimeout(timer);
    }
  }, [status]);

  // Control body overflow during loading
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    } else {
      document.body.style.overflow = 'hidden';
      document.body.style.height = 'auto';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    };
  }, [isLoading]);

  // State to track if product image loaded successfully
  const [productImageLoaded, setProductImageLoaded] = useState(false);
  const [productImageError, setProductImageError] = useState(false);
  const [clientImageLoaded, setClientImageLoaded] = useState(false);
  const [clientImageError, setClientImageError] = useState(false);

  // Default values when props are null
  const r2bucketURL = 'https://cdn.angelfs.co.uk/';

  // Template replacement function
  const replaceTemplateVariables = (template, variables) => {
    if (!template) return '';
    
    return Object.entries(variables).reduce((result, [key, value]) => {
      const placeholder = `{{${key}}}`;
      return result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value || '');
    }, template);
  };

  // Use provided values or fall back to defaults
  const displayTitle = title;
  const displaySurname = surname;
  
  // Use temporary paths if available, otherwise use standard paths
  const displayImage = r2bucketURL + client_image_path || (client_image ? r2bucketURL + 'clients/images/logos/' + client_image : null);
  const productImage = r2bucketURL + product_image_path || (product_image ? r2bucketURL + 'clients/images/products/' + product_image : null);

  const displayClientName = client_name;
  const displayProductName = product_name;
  const clientUrl = client_url;
  const contactUrl = contact_url;
  const privacyUrl = privacy_url;
  const displayNGN = ngn;

  // Template variables for replacements
  const templateVariables = {
    product_name: displayProductName,
    client_name: displayClientName,
    salutation: displayTitle + ' ' + displaySurname,
    ngn: displayNGN
  };

  // Apply template replacements
  const displayLoadingTitle = replaceTemplateVariables(loading_title, templateVariables);
  const displayLoadingMessage = replaceTemplateVariables(loading_message, templateVariables);
  const displayCompletedTitle = replaceTemplateVariables(completed_title, templateVariables);
  const displayCompletedMessage = replaceTemplateVariables(completed_message, templateVariables);
  const displayFormTitle = replaceTemplateVariables(product_title, templateVariables);
  const displayFormMessage = replaceTemplateVariables(product_message, templateVariables);
  const displayPrivacyNotice = replaceTemplateVariables(privacy_notice, { product_name: displayProductName, client_name: displayClientName });

  // Handle product image loading
  const handleProductImageLoad = () => {
    setProductImageLoaded(true);
    setProductImageError(false);
  };

  const handleProductImageError = (e) => {
    // If we have a temp path and haven't tried it yet, try the temp path
    if (product_image_path && e.target.src !== product_image_path) {
      e.target.src = product_image_path;
      return;
    }
    // If temp path also failed or we don't have one, mark as error
    setProductImageLoaded(false);
    setProductImageError(true);
  };

  const handleClientImageLoad = () => {
    setClientImageLoaded(true);
    setClientImageError(false);
  };

  const handleClientImageError = (e) => {
    // If we have a temp path and haven't tried it yet, try the temp path
    if (client_image_path && e.target.src !== client_image_path) {
      e.target.src = client_image_path;
      return;
    }
    // If temp path also failed or we don't have one, mark as error
    setClientImageLoaded(false);
    setClientImageError(true);
  };

  // Check if we should show the product image
  const shouldShowProductImage = productImage && !productImageError;
  const shouldShowClientImage = displayClientName && !clientImageError;

  // Title options for the dropdown
  const titleOptions = [
    { id: 'mr', value: 'Mr', displayValue: 'Mr' },
    { id: 'mrs', value: 'Mrs', displayValue: 'Mrs' },
    { id: 'miss', value: 'Miss', displayValue: 'Miss' },
    { id: 'ms', value: 'Ms', displayValue: 'Ms' },
    { id: 'dr', value: 'Dr', displayValue: 'Dr' },
    { id: 'prof', value: 'Prof', displayValue: 'Prof' },
    { id: 'rev', value: 'Rev', displayValue: 'Rev' },
    { id: 'sir', value: 'Sir', displayValue: 'Sir' },
    { id: 'lady', value: 'Lady', displayValue: 'Lady' }
  ];

  const [formData, setFormData] = useState({
    title: '',
    firstName: '',
    surname: '',
    address: {
      line1: '',
      line2: '',
      line3: '',
      city: '',
      county: '',
      postcode: '',
      country: 'United Kingdom'
    },
    communicationPreferences: [] // Array to store selected communication channels
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Separate state for postcode search (unbinded from form postcode field)
  const [postcodeSearch, setPostcodeSearch] = useState('');
  
  // State to control postcode search functionality
  const [postcodeSearchActive, setPostcodeSearchActive] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleAddressChange = (addressData) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        ...addressData
      }
    }));
    // Clear address-related errors
    const addressFields = ['line1', 'city', 'county', 'postcode'];
    const clearedErrors = { ...errors };
    let hasChanges = false;
    
    Object.keys(addressData).forEach(key => {
      if (addressFields.includes(key) && clearedErrors[`address.${key}`]) {
        clearedErrors[`address.${key}`] = null;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      setErrors(clearedErrors);
    }
  };

  const handleCommunicationPreferencesChange = (selectedChannels) => {
    setFormData(prev => ({
      ...prev,
      communicationPreferences: selectedChannels
    }));
    // Clear communication preferences error if it exists
    if (errors.communicationPreferences) {
      setErrors(prev => ({
        ...prev,
        communicationPreferences: null
      }));
    }
  };

  // Validation functions
  const validateForm = () => {
    const newErrors = {};

    // Title validation
    const titleError = validateRequired(formData.title, 'Title');
    if (titleError) {
      newErrors.title = typeof titleError === 'object' ? titleError.message : titleError;
    }

    // First name validation
    const firstNameRequiredError = validateRequired(formData.firstName, 'First name');
    if (firstNameRequiredError) {
      newErrors.firstName = typeof firstNameRequiredError === 'object' ? firstNameRequiredError.message : firstNameRequiredError;
    } else {
      const firstNameLengthError = validateIsLength(formData.firstName, {
        validatorOptions: { min: 2 },
        customMessage: 'First name must be at least 2 characters'
      });
      if (firstNameLengthError) {
        newErrors.firstName = typeof firstNameLengthError === 'object' ? firstNameLengthError.message : firstNameLengthError;
      } else {
        const firstNameAlphaError = validateIsAlpha(formData.firstName, {
          locale: 'en-GB',
          validatorOptions: { ignore: ' \'-' },
          customMessage: 'First name should only contain letters, spaces, hyphens, and apostrophes'
        });
        if (firstNameAlphaError) {
          newErrors.firstName = typeof firstNameAlphaError === 'object' ? firstNameAlphaError.message : firstNameAlphaError;
        }
      }
    }

    // Surname validation
    const surnameRequiredError = validateRequired(formData.surname, 'Surname');
    if (surnameRequiredError) {
      newErrors.surname = typeof surnameRequiredError === 'object' ? surnameRequiredError.message : surnameRequiredError;
    } else {
      const surnameLengthError = validateIsLength(formData.surname, {
        validatorOptions: { min: 2 },
        customMessage: 'Surname must be at least 2 characters'
      });
      if (surnameLengthError) {
        newErrors.surname = typeof surnameLengthError === 'object' ? surnameLengthError.message : surnameLengthError;
      } else {
        const surnameAlphaError = validateIsAlpha(formData.surname, {
          locale: 'en-GB',
          validatorOptions: { ignore: ' \'-' },
          customMessage: 'Surname should only contain letters, spaces, hyphens, and apostrophes'
        });
        if (surnameAlphaError) {
          newErrors.surname = typeof surnameAlphaError === 'object' ? surnameAlphaError.message : surnameAlphaError;
        }
      }
    }

    // Address line 1 validation
    const addressLine1Error = validateRequired(formData.address.line1, 'Address line 1');
    if (addressLine1Error) {
      newErrors['address.line1'] = typeof addressLine1Error === 'object' ? addressLine1Error.message : addressLine1Error;
    }

    // City validation
    const cityError = validateRequired(formData.address.city, 'City');
    if (cityError) {
      newErrors['address.city'] = typeof cityError === 'object' ? cityError.message : cityError;
    }

    // County validation
    const countyError = validateRequired(formData.address.county, 'County');
    if (countyError) {
      newErrors['address.county'] = typeof countyError === 'object' ? countyError.message : countyError;
    }

    // Postcode validation
    const postcodeRequiredError = validateRequired(formData.address.postcode, 'Postcode');
    if (postcodeRequiredError) {
      newErrors['address.postcode'] = typeof postcodeRequiredError === 'object' ? postcodeRequiredError.message : postcodeRequiredError;
    } else {
      const postcodeValidError = validateIsPostalCode(formData.address.postcode.trim(), 'GB', {
        customMessage: 'Please enter a valid UK postcode'
      });
      if (postcodeValidError) {
        newErrors['address.postcode'] = typeof postcodeValidError === 'object' ? postcodeValidError.message : postcodeValidError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sanitization function to clean data before backend submission
  const sanitizeFormData = (data) => {
    return {
      title: sanitizeTrim(sanitizeEscape(data.title)),
      firstName: sanitizeProperCase(sanitizeTrim(sanitizeEscape(data.firstName))),
      surname: sanitizeProperCase(sanitizeTrim(sanitizeEscape(data.surname))),
      address: {
        line1: sanitizeProperCase(sanitizeTrim(sanitizeEscape(data.address.line1))),
        line2: data.address.line2 ? sanitizeProperCase(sanitizeTrim(sanitizeEscape(data.address.line2))) : '',
        line3: data.address.line3 ? sanitizeProperCase(sanitizeTrim(sanitizeEscape(data.address.line3))) : '',
        city: sanitizeProperCase(sanitizeTrim(sanitizeEscape(data.address.city))),
        county: sanitizeProperCase(sanitizeTrim(sanitizeEscape(data.address.county))),
        postcode: sanitizeToUpperCase(sanitizeTrim(data.address.postcode)),
        country: sanitizeTrim(sanitizeEscape(data.address.country))
      },
      communicationPreferences: data.communicationPreferences || []
    };
  };

  const clearErrors = () => {
    setErrors({});
  };

  // Separate handler for postcode search that only updates form fields, not search field
  const handlePostcodeSearch = (addressData) => {
    // Update form fields but don't update the search field itself
    const { postcode, ...otherData } = addressData;
    
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        ...otherData,
        // Only update postcode if it's a full address selection, not just typing
        ...(Object.keys(otherData).length > 1 ? { postcode } : {})
      }
    }));

    // Clear all errors when an address is selected
    if (Object.keys(otherData).length > 1) {
      // This means a full address was selected, not just typing
      setErrors({});
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prevent submission if already submitting, completed, or status indicates form is no longer available
    if (isSubmitting || isCompleted || ['completed', 'expired', 'processing'].includes(status)) return;
    
    // Validate form before submission
    const isValid = validateForm();
    
    if (!isValid) {
      // Wait for React to update the DOM with error styles, then scroll to first error
      setTimeout(() => {
        const errorFields = document.querySelectorAll('[class*="ring-red"]');
        if (errorFields.length > 0) {
          errorFields[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Also try to focus the first input field if possible
          const firstInput = errorFields[0].querySelector('input, select, button');
          if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
          }
        }
      }, 0); // Use setTimeout with 0ms to wait for next tick
      return;
    }
    
    setIsSubmitting(true);
    
    // Sanitize form data before sending to backend
    const sanitizedData = sanitizeFormData(formData);
    
    // Add GUID to the data
    const submissionData = {
      ...sanitizedData,
      guid: guid
    };
    
    // Real API call
    fetch('/product-claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
      },
      body: JSON.stringify(submissionData)
    })
    .then(async response => {
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Success:', data.message);
        
        // Clear any previous errors
        setErrors({});
        
        // Start completion transition (fade out current content)
        setIsCompletionTransitioning(true);
        
        // After fade out, show completion screen
        setTimeout(() => {
          setIsCompleted(true);
          setIsSubmitting(false);
        }, 400); // 400ms transition duration
        
      } else {
        setIsSubmitting(false);
        
        // Handle validation errors
        if (data.errors) {
          console.log('Validation errors received:', data.errors);
          
          // Map Laravel validation errors to our form structure
          const mappedErrors = {};
          Object.keys(data.errors).forEach(key => {
            if (Array.isArray(data.errors[key])) {
              mappedErrors[key] = data.errors[key][0]; // Take first error message
            } else {
              mappedErrors[key] = data.errors[key];
            }
          });
          
          setErrors(mappedErrors);
          
          // Scroll to first error field
          setTimeout(() => {
            const errorFields = document.querySelectorAll('[class*="ring-red"]');
            if (errorFields.length > 0) {
              errorFields[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
              const firstInput = errorFields[0].querySelector('input, select, button');
              if (firstInput) {
                setTimeout(() => firstInput.focus(), 300);
              }
            }
          }, 100);
          
        } else {
          // Handle cases where there's no specific field errors but submission failed
          console.error('Server error:', data);
          // You could add a general error to a specific field or handle differently
          toast.error(data.message || 'An unexpected error occurred. Please try again.', {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      }
    })
    .catch(error => {
      setIsSubmitting(false);
      console.error('Network error:', error);
      
      // Show network error as toast since it's not field-specific
      toast.error('A network error occurred. Please check your connection and try again.', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    });
  };

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900 relative">
      {/* Loading Screen Overlay */}
      <div 
        className={`fixed inset-0 flex items-center justify-center z-50 bg-gray-200 dark:bg-gray-900 transition-opacity duration-400 h-screen w-screen ${
          isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="text-center">
          {/* Gift Box Animation Placeholder */}
          <div className="relative">
            <div className="h-96 w-96 mx-auto flex items-center justify-center">
              {/* Lottie Gift Animation */}
              {animationDataLoading && (
                <Lottie
                  animationData={animationDataLoading}
                  loop
                  autoplay
                />
              )}
            </div>
          </div>

          {/* Loading Text */}
          <div className="space-y-4 px-4 -mt-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {displayLoadingTitle}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              {displayLoadingMessage}
            </p>
          </div>

          {/* Logo at bottom */}
          <div className="mt-8">
            {shouldShowClientImage && (
              <img
                alt={displayClientName}
                src={displayImage}
                onLoad={handleClientImageLoad}
                onError={handleClientImageError}
                className="mx-auto h-12 w-auto opacity-60"
              />
            )}
          </div>
        </div>
      </div>

      {/* Completion Screen Overlay */}
      <div 
        className={`fixed inset-0 flex items-center justify-center z-50 bg-gray-200 dark:bg-gray-900 transition-opacity duration-400 h-screen w-screen ${
          isCompleted ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="text-center">
          {/* Success Animation */}
          <div className={`relative mb-8 ${isCompleted ? 'animate-fadeInUp' : ''}`} 
               style={{ animationDelay: isCompleted ? '0.1s' : '0s' }}>
            <div className="h-96 w-96 mx-auto flex items-center justify-center">
              {/* Success Checkmark or Animation */}
              {animationDataSuccess && isLoaded && (
                <Lottie
                  animationData={animationDataSuccess}
                  loop={!isCompleted}
                  autoplay
                />
              )}
            </div>
          </div>

          {/* Success Text */}
          <div className={`space-y-4 px-4 -mt-24 ${isCompleted ? 'animate-fadeInUp' : ''}`}
               style={{ animationDelay: isCompleted ? '0.2s' : '0s' }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {displayCompletedTitle}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              {displayCompletedMessage}
            </p>
            <div className="pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You can now safely close this page.
              </p>
            </div>
          </div>

          {/* Logo at bottom */}
          <div className={`mt-12 ${isCompleted ? 'animate-fadeInUp' : ''}`}
               style={{ animationDelay: isCompleted ? '0.3s' : '0s' }}>
            {shouldShowClientImage && (
              <img
                alt={displayClientName}
                src={displayImage}
                className="mx-auto h-12 w-auto opacity-60"
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Form Content - Always rendered */}
      <div 
         ref={scrollRef}
        className={`transition-opacity overflow-y-auto duration-400 h-screen relative ${
          !isLoading ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Simple Header with Logo */}
        <header className={`py-10 ${
          !isLoading && !isCompletionTransitioning ? 'animate-fadeInUp' : 
          isCompletionTransitioning ? 'animate-fadeOutDown' : ''
        }`} style={{ 
          animationDelay: !isLoading && !isCompletionTransitioning ? '0.1s' : 
                         isCompletionTransitioning ? '0s' : '0s' 
        }}>
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {shouldShowClientImage && (
                <img
                  alt={displayClientName}
                  src={displayImage}
                  className="mx-auto h-16 w-auto mb-2"
                />
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className={`mx-auto max-w-4xl px-4 pb-4 sm:px-6 lg:px-8 ${
          !isLoading && !isCompletionTransitioning ? 'animate-fadeInUp' : 
          isCompletionTransitioning ? 'animate-fadeOutDown' : ''
        }`} style={{ 
          animationDelay: !isLoading && !isCompletionTransitioning ? '0.2s' : 
                         isCompletionTransitioning ? '0.1s' : '0s' 
        }}>
          {/* Product Header Section */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-6 py-10">
              {/* Product Image and Info */}
              <div className={`text-center mb-4 ${
                !isLoading && !isCompletionTransitioning ? 'animate-fadeInUp' : 
                isCompletionTransitioning ? 'animate-fadeOutDown' : ''
              }`} style={{ 
                animationDelay: !isLoading && !isCompletionTransitioning ? '0.3s' : 
                               isCompletionTransitioning ? '0.2s' : '0s' 
              }}>
                {shouldShowProductImage && (
                  <div className="mb-8 mx-auto relative">
                    {/* Main image container */}
                    <div className="relative h-72 w-72 mx-auto bg-theme-600 dark:bg-gray-900 rounded-2xl p-1.5 shadow-lg">
                      <div className="h-full w-full rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 relative">
                        <img
                          src={productImage}
                          alt="Product"
                          className="h-full w-full object-cover"
                          onLoad={handleProductImageLoad}
                          onError={handleProductImageError}
                        />
                        {/* Shadow overlay */}
                        <div 
                          className="absolute inset-0 rounded-xl pointer-events-none"
                          style={{
                            boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.2), inset 0 0 15px rgba(0, 0, 0, 0.1)'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                  {displayFormTitle}
                </h1>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                  {displayFormMessage}
                </p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className={`space-y-6 ${
                !isLoading && !isCompletionTransitioning ? 'animate-fadeInUp' : 
                isCompletionTransitioning ? 'animate-fadeOutDown' : ''
              }`} style={{ 
                animationDelay: !isLoading && !isCompletionTransitioning ? '0.4s' : 
                               isCompletionTransitioning ? '0.3s' : '0s' 
              }} autoComplete="on">                {/* Personal Information Section */}
                {/* Personal Information Section */}
                <div className="border-b border-t border-gray-900/10 dark:border-gray-700/50 pb-8 pt-4">
                  <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Delivery Details</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    Please provide the name for delivery of your free {displayProductName}.
                  </p>

                  <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                      <SelectInput
                        id="title"
                        label="Title"
                        currentState={formData.title}
                        disabled={isSubmitting}
                        items={titleOptions}
                        onSelectChange={(value) => handleInputChange('title', value)}
                        placeholder="Select title"
                        error={errors.title}
                        clearErrors={clearErrors}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <TextInput
                        id="first-name"
                        label="First name"
                        autoComplete="given-name"
                        placeholder="Enter your first name"
                        disabled={isSubmitting}
                        currentState={formData.firstName}
                        onTextChange={(value) => handleInputChange('firstName', value)}
                        Icon={UserIcon}
                        error={errors.firstName}
                        clearErrors={clearErrors}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <TextInput
                        id="surname"
                        label="Surname"
                        autoComplete="family-name"
                        placeholder="Enter your surname"
                        disabled={isSubmitting}
                        currentState={formData.surname}
                        onTextChange={(value) => handleInputChange('surname', value)}
                        Icon={IdentificationIcon}
                        error={errors.surname}
                        clearErrors={clearErrors}
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="">
                  <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Delivery Address</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    Where would you like us to deliver your free {displayProductName}?
                  </p>

                  <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    {/* Postcode Lookup */}
                    {postcodeSearchActive && (
                      <div className="col-span-full">
                        <PostcodeInput
                          id={{
                            postcode: 'postcode-search',
                            address1: 'address1', 
                            address2: 'address2',
                            address3: 'address3',
                            city: 'city',
                            county: 'county'
                          }}
                          label="Search by Postcode"
                          placeholder="Enter your postcode"
                          disabled={isSubmitting}
                          onComboChange={handlePostcodeSearch}
                          currentState={postcodeSearch}
                        />
                      </div>
                    )}

                    {/* Manual Address Fields */}
                    <div className="col-span-full">
                      <TextInput
                        id="address-line-1"
                        label="Address line 1"
                        autoComplete="street-address"
                        disabled={isSubmitting}
                        currentState={formData.address.line1}
                        onTextChange={(value) => handleAddressChange({ line1: value })}
                        Icon={HomeIcon}
                        error={errors['address.line1']}
                        clearErrors={clearErrors}
                      />
                    </div>

                    <div className="col-span-full">
                      <TextInput
                        id="address-line-2"
                        label="Address line 2"
                        annotation="(optional)"
                        autoComplete="address-line2"
                        disabled={isSubmitting}
                        currentState={formData.address.line2}
                        onTextChange={(value) => handleAddressChange({ line2: value })}
                        clearErrors={clearErrors}
                      />
                    </div>

                    <div className="col-span-full">
                      <TextInput
                        id="address-line-3"
                        label="Address line 3"
                        annotation="(optional)"
                        autoComplete="address-line3"
                        disabled={isSubmitting}
                        currentState={formData.address.line3}
                        onTextChange={(value) => handleAddressChange({ line3: value })}
                        clearErrors={clearErrors}
                      />
                    </div>

                    <div className="sm:col-span-2 sm:col-start-1">
                      <TextInput
                        id="city"
                        label="City"
                        autoComplete="address-level2"
                        disabled={isSubmitting}
                        currentState={formData.address.city}
                        onTextChange={(value) => handleAddressChange({ city: value })}
                        Icon={BuildingOfficeIcon}
                        error={errors['address.city']}
                        clearErrors={clearErrors}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <TextInput
                        id="county"
                        label="County"
                        autoComplete="address-level1"
                        disabled={isSubmitting}
                        currentState={formData.address.county}
                        onTextChange={(value) => handleAddressChange({ county: value })}
                        error={errors['address.county']}
                        clearErrors={clearErrors}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <TextInput
                        id="postal-code"
                        label="Postal code"
                        autoComplete="postal-code"
                        disabled={isSubmitting}
                        currentState={formData.address.postcode}
                        onTextChange={(value) => handleAddressChange({ postcode: value })}
                        uppercase={true}
                        Icon={MapPinIcon}
                        error={errors['address.postcode']}
                        clearErrors={clearErrors}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Full Width Submit Button */}
          <div className={`mt-8 ${
            !isLoading && !isCompletionTransitioning ? 'animate-fadeInUp' : 
            isCompletionTransitioning ? 'animate-fadeOutDown' : ''
          }`} style={{ 
            animationDelay: !isLoading && !isCompletionTransitioning ? '0.5s' : 
                           isCompletionTransitioning ? '0.4s' : '0s' 
          }}>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || isCompleted || ['completed', 'expired', 'processing'].includes(status)}
              className={`w-full flex justify-center items-center rounded-md px-3 py-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 ${
                isSubmitting || isCompleted || ['completed', 'expired', 'processing'].includes(status)
                  ? 'bg-theme-400 cursor-not-allowed'
                  : 'bg-theme-600 hover:bg-theme-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-600'
              }`}
            >
              {isSubmitting ? (
                <>
                  <l-ring 
                    size="20" 
                    speed="2" 
                    stroke="3" 
                    color="white">
                  </l-ring>
                  <span className="ml-2">Processing...</span>
                </>
              ) : isCompleted || status === 'completed' ? (
                <>
                  <CheckCircleIcon className="h-5 w-5 text-white mr-2" />
                  Submitted Successfully
                </>
              ) : status === 'processing' ? (
                <>
                  <CheckCircleIcon className="h-5 w-5 text-white mr-2" />
                  Already Processing
                </>
              ) : status === 'expired' ? (
                'Form Expired'
              ) : (
                'Claim My Free Product'
              )}
            </button>
          </div>

          {/* Communication Preferences Section */}
          {formattedCommunicationChannels && formattedCommunicationChannels.length > 0 && (
            <div className={`mt-8 ${
                !isLoading && !isCompletionTransitioning ? 'animate-fadeInUp' : 
                isCompletionTransitioning ? 'animate-fadeOutDown' : ''
              }`} style={{ 
                animationDelay: !isLoading && !isCompletionTransitioning ? '0.5s' : 
                              isCompletionTransitioning ? '0.4s' : '0s' 
              }}>
              <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Communication Preferences</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Please let us know how you would like to hear from us.
              </p>

              <div className="mt-4">
                <CheckboxGroupInput
                  id="communication-preferences"
                  items={formattedCommunicationChannels}
                  selectedItems={formData.communicationPreferences}
                  onChange={handleCommunicationPreferencesChange}
                  disabled={isSubmitting}
                  error={errors.communicationPreferences}
                  clearErrors={clearErrors}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with Disclaimer */}
        <footer className={`${
          !isLoading && !isCompletionTransitioning ? 'animate-fadeInUp' : 
          isCompletionTransitioning ? 'animate-fadeOutDown' : ''
        }`} style={{ 
          animationDelay: !isLoading && !isCompletionTransitioning ? '0.6s' : 
                         isCompletionTransitioning ? '0.5s' : '0s' 
        }}>
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center items-center mb-4">
                {shouldShowClientImage && (
                  <img
                    alt={displayClientName}
                    src={displayImage}
                    className="h-8 w-auto"
                  />
                )}
              </div>
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {displayPrivacyNotice}
              </p>
              <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                { clientUrl && <a href={clientUrl} className="hover:text-gray-600 dark:hover:text-gray-300">{displayClientName}</a>}
                { privacyUrl &&
                  <>
                    <span>•</span>
                    <a href={privacyUrl} className="hover:text-gray-600 dark:hover:text-gray-300">Privacy Policy</a>              
                  </>
                }
                { contactUrl &&
                  <>
                    <span>•</span>
                    <a href={contactUrl} className="hover:text-gray-600 dark:hover:text-gray-300">Contact Support</a>
                  </>
                }
              </div>
              <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                © 2025 Angel Gifts. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
      
        {/* Scroll Hint */}
        {!isLoading && !isCompleted && (
          <div className={`${
            !isCompletionTransitioning ? 'animate-fadeInUp' : 'animate-fadeOutDown'
          }`} style={{ 
            animationDelay: !isCompletionTransitioning ? '0s' : '0.6s' 
          }}>
            <ScrollHint basic={true} scrollRef={scrollRef} hideThreshold={45} allowClick={false} size='h-4 w-4' >
              <p className="text-sm text-gray-500 dark:text-gray-300 pr-1">
                Scroll to complete
              </p>
            </ScrollHint>
          </div>
        )}
        
        {/* Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
    </div>
  );
}