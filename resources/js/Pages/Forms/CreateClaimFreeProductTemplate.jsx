import { useState, useEffect, useRef } from 'react';
import TextInput from '../../Components/Forms/TextInput';
import SelectInput from '../../Components/Forms/SelectInput';
import CheckboxGroupInput from '../../Components/Forms/CheckboxGroupInput';
import ColorInput from '../../Components/Forms/ColorInput';
import InlineEditableText from '../../Components/Forms/InlineEditableText';
import ScrollHint from '../../Components/Hints/ScrollHint';
import Lottie from 'lottie-react';
import { getColors, replaceColor } from 'lottie-colorify';
import animationLoading from '../../../animations/gift.json';
import animationSuccess from '../../../animations/success.json';
import animationTimeout from '../../../animations/timer.json';
import { generateColorScale, injectThemeColors, replaceAnimationColors } from '../../Utils/Color';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  validateRequired, 
  validateIsLength, 
  validateIsURL,
  validateIsAlpha,
  validateIsHexColor
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
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  EyeIcon,
  CogIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  LinkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { ring } from 'ldrs';


export default function CreateClaimFreeProductTemplate({ 
  clients,
  store_url,
  loading_title,
  loading_message,
  completed_title,
  completed_message,
  expired_title,
  expired_message,
  product_title,
  product_message,
  privacy_notice,
  theme_colour,
}) {

  // Make theme color dynamic and editable
  const [themeColour, setThemeColour] = useState(theme_colour || '#008DA9');

  // Handler to update both local state and form data
  const handleThemeColourChange = (newColour) => {
    setThemeColour(newColour);
    handleTemplateChange('theme_colour', newColour);
  };

  const [animationDataLoading, setAnimationDataLoading] = useState(null);
  const [animationDataSuccess, setAnimationDataSuccess] = useState(null);
  const [animationDataTimeout, setAnimationDataTimeout] = useState(null);

  // Template preview mode state - controls which screen is shown
  const [previewMode, setPreviewMode] = useState('prerequisites'); // 'prerequisites', 'loading', 'form', 'completed', 'expired', 'success'
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationKey, setAnimationKey] = useState(0); // Force Lottie restart

  // Handle smooth transitions between preview modes
  const handlePreviewModeChange = (newMode) => {
    // Always increment animation key to restart Lottie animations
    setAnimationKey(prev => prev + 1);
    
    // Scroll to top instantly when switching to prerequisites or form
    if (newMode === 'prerequisites' && prerequisitesScrollRef.current) {
      prerequisitesScrollRef.current.scrollTo(0, 0);
    } else if (newMode === 'form' && formScrollRef.current) {
      formScrollRef.current.scrollTo(0, 0);
    }
    
    if (newMode === previewMode) {
      // Same mode - just restart animations
      return;
    }
    
    setIsTransitioning(true);
    setTimeout(() => {
      setPreviewMode(newMode);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 200);
  };

  // Ref for scroll hint
  const scrollRef = useRef(null);
  const prerequisitesScrollRef = useRef(null);
  const formScrollRef = useRef(null);

  // Register LDRS component
  useEffect(() => {
    ring.register();
  }, []);

  // Inject custom theme colors
  useEffect(() => {
    if (themeColour) {
      const colourScale = generateColorScale(themeColour);

      const colours = Object.values(colourScale).map(c => [c.r, c.g, c.b]);

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
        colours[1],
        colours[5],
        colours[3],
        colours[6],
        colours[7],
        colours[3],
        colours[6],
      ]);

      setAnimationDataSuccess(replaceAnimationColors(getColors(animationSuccess), targetColoursSuccess, animationSuccess));

      const targetColoursTimeout = Object.values([
        colours[6],
        colours[3],
        colours[1],
        colours[2],
        colours[5],
        colours[1],
        colours[1],
        colours[3],
        colours[1],
        colours[0],
        colours[4],
      ]);

      setAnimationDataTimeout(replaceAnimationColors(getColors(animationTimeout), targetColoursTimeout, animationTimeout));

      injectThemeColors(colourScale);
    }
  }, [themeColour]);

  // Default values when props are null
  const r2bucketURL = 'https://cdn.angelfs.co.uk/clients/images/';
  
  // Product image upload state
  const [isDragOver, setIsDragOver] = useState(false);
  const [isClientDragOver, setIsClientDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const clientFileInputRef = useRef(null);

  // Handle file upload
  const handleFileUpload = (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, GIF, or WebP)', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
      return;
    }

    // Create preview URL and store file in form data
    const previewUrl = URL.createObjectURL(file);
    handlePrerequisitesChange('product_image', previewUrl);
    handlePrerequisitesChange('product_image_file', file);
    
    // Show success message
    toast.success('Image uploaded successfully!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
    });
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Handle click to upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleClientUploadClick = () => {
    clientFileInputRef.current?.click();
  };

  // Handle client file upload
  const handleClientFileUpload = (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, GIF, or WebP)', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
      return;
    }

    // Validate file size (2MB max for client images)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 2MB', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
      return;
    }

    // Create preview URL and store file in form data
    const previewUrl = URL.createObjectURL(file);
    handlePrerequisitesChange('client_image_file', file);
    handlePrerequisitesChange('client_image', previewUrl);
    
    // Show success message
    toast.success('Client logo uploaded successfully!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
    });
  };

  // Handle client drag and drop
  const handleClientDragOver = (e) => {
    e.preventDefault();
    setIsClientDragOver(true);
  };

  const handleClientDragLeave = (e) => {
    e.preventDefault();
    setIsClientDragOver(false);
  };

  const handleClientDrop = (e) => {
    e.preventDefault();
    setIsClientDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleClientFileUpload(files[0]);
    }
  };

  // Handle client file input change
  const handleClientFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleClientFileUpload(file);
    }
  };

  // Handle remove client image
  const handleRemoveClientImage = (e) => {
    e.stopPropagation(); // Prevent triggering upload click
    handlePrerequisitesChange('client_image_file', null);
    handlePrerequisitesChange('client_image', null);
    if (clientFileInputRef.current) {
      clientFileInputRef.current.value = ''; // Clear file input
    }
    toast.success('Client logo removed successfully!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
    });
  };

  // Handle remove image
  const handleRemoveImage = (e) => {
    e.stopPropagation(); // Prevent triggering upload click
    handlePrerequisitesChange('product_image', null);
    handlePrerequisitesChange('product_image_file', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
    toast.success('Image removed successfully!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'light',
    });
  };

  const [formData, setFormData] = useState({
    // Prerequisites data
    prerequisites: {
      client_ref: '',
      client_name: '',
      client_image: null,
      client_image_file: '',
      product_name: '',
      product_image: null,
      product_image_file: '',
      client_url: '',
      contact_url: '',
      privacy_url: '',
    },
    // Template content
    template: {
      loading_title: loading_title,
      loading_message: loading_message,
      completed_title: completed_title,
      completed_message: completed_message,
      expired_title: expired_title,
      expired_message: expired_message,
      form_title: product_title,
      form_message: product_message,
      privacy_notice: privacy_notice,
      theme_colour: theme_colour || '#008DA9',
      communication_preferences: {
        post: { enabled: true, value: 'post', label: 'I do not want to receive updates by post', type: 'opt-out' },
        phone: { enabled: true, value: 'phone', label: 'I do not want to receive updates by telephone', type: 'opt-out' },
        email: { enabled: true, value: 'email', label: 'I would like to receive email updates', type: 'opt-in' },
        sms: { enabled: true, value: 'sms', label: 'I would like to receive SMS messages', type: 'opt-in' }
      }
    }
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Clear errors when field changes
  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Validation functions
  const validateForm = () => {
    const newErrors = {};

    // Prerequisites validation
    const clientRefError = validateRequired(formData.prerequisites.client_ref, 'Client reference');
    if (clientRefError) {
      newErrors['prerequisites.client_ref'] = typeof clientRefError === 'object' ? clientRefError.message : clientRefError;
    }

    const clientNameError = validateRequired(formData.prerequisites.client_name, 'Client name');
    if (clientNameError) {
      newErrors['prerequisites.client_name'] = typeof clientNameError === 'object' ? clientNameError.message : clientNameError;
    } else {
      const clientNameLengthError = validateIsLength(formData.prerequisites.client_name, {
        validatorOptions: { min: 2, max: 255 },
        customMessage: 'Client name must be between 2 and 255 characters'
      });
      if (clientNameLengthError) {
        newErrors['prerequisites.client_name'] = typeof clientNameLengthError === 'object' ? clientNameLengthError.message : clientNameLengthError;
      }
    }

    const productNameError = validateRequired(formData.prerequisites.product_name, 'Product name');
    if (productNameError) {
      newErrors['prerequisites.product_name'] = typeof productNameError === 'object' ? productNameError.message : productNameError;
    } else {
      const productNameLengthError = validateIsLength(formData.prerequisites.product_name, {
        validatorOptions: { min: 2, max: 255 },
        customMessage: 'Product name must be between 2 and 255 characters'
      });
      if (productNameLengthError) {
        newErrors['prerequisites.product_name'] = typeof productNameLengthError === 'object' ? productNameLengthError.message : productNameLengthError;
      }
    }

    // URL validations (optional fields)
    if (formData.prerequisites.client_url && formData.prerequisites.client_url.trim()) {
      const clientUrlError = validateIsURL(formData.prerequisites.client_url, {
        customMessage: 'Please enter a valid client URL'
      });
      if (clientUrlError) {
        newErrors['prerequisites.client_url'] = typeof clientUrlError === 'object' ? clientUrlError.message : clientUrlError;
      }
    }

    if (formData.prerequisites.contact_url && formData.prerequisites.contact_url.trim()) {
      const contactUrlError = validateIsURL(formData.prerequisites.contact_url, {
        customMessage: 'Please enter a valid contact URL'
      });
      if (contactUrlError) {
        newErrors['prerequisites.contact_url'] = typeof contactUrlError === 'object' ? contactUrlError.message : contactUrlError;
      }
    }

    if (formData.prerequisites.privacy_url && formData.prerequisites.privacy_url.trim()) {
      const privacyUrlError = validateIsURL(formData.prerequisites.privacy_url, {
        customMessage: 'Please enter a valid privacy URL'
      });
      if (privacyUrlError) {
        newErrors['prerequisites.privacy_url'] = typeof privacyUrlError === 'object' ? privacyUrlError.message : privacyUrlError;
      }
    }

    // Template validation
    if (formData.template.loading_title && formData.template.loading_title.trim()) {
      const loadingTitleLengthError = validateIsLength(formData.template.loading_title, {
        validatorOptions: { max: 500 },
        customMessage: 'Loading title must be less than 500 characters'
      });
      if (loadingTitleLengthError) {
        newErrors['template.loading_title'] = typeof loadingTitleLengthError === 'object' ? loadingTitleLengthError.message : loadingTitleLengthError;
      }
    }

    if (formData.template.loading_message && formData.template.loading_message.trim()) {
      const loadingMessageLengthError = validateIsLength(formData.template.loading_message, {
        validatorOptions: { max: 1000 },
        customMessage: 'Loading message must be less than 1000 characters'
      });
      if (loadingMessageLengthError) {
        newErrors['template.loading_message'] = typeof loadingMessageLengthError === 'object' ? loadingMessageLengthError.message : loadingMessageLengthError;
      }
    }

    if (formData.template.completed_title && formData.template.completed_title.trim()) {
      const completedTitleLengthError = validateIsLength(formData.template.completed_title, {
        validatorOptions: { max: 500 },
        customMessage: 'Completed title must be less than 500 characters'
      });
      if (completedTitleLengthError) {
        newErrors['template.completed_title'] = typeof completedTitleLengthError === 'object' ? completedTitleLengthError.message : completedTitleLengthError;
      }
    }

    if (formData.template.completed_message && formData.template.completed_message.trim()) {
      const completedMessageLengthError = validateIsLength(formData.template.completed_message, {
        validatorOptions: { max: 1000 },
        customMessage: 'Completed message must be less than 1000 characters'
      });
      if (completedMessageLengthError) {
        newErrors['template.completed_message'] = typeof completedMessageLengthError === 'object' ? completedMessageLengthError.message : completedMessageLengthError;
      }
    }

    if (formData.template.expired_title && formData.template.expired_title.trim()) {
      const expiredTitleLengthError = validateIsLength(formData.template.expired_title, {
        validatorOptions: { max: 500 },
        customMessage: 'Expired title must be less than 500 characters'
      });
      if (expiredTitleLengthError) {
        newErrors['template.expired_title'] = typeof expiredTitleLengthError === 'object' ? expiredTitleLengthError.message : expiredTitleLengthError;
      }
    }

    if (formData.template.expired_message && formData.template.expired_message.trim()) {
      const expiredMessageLengthError = validateIsLength(formData.template.expired_message, {
        validatorOptions: { max: 1000 },
        customMessage: 'Expired message must be less than 1000 characters'
      });
      if (expiredMessageLengthError) {
        newErrors['template.expired_message'] = typeof expiredMessageLengthError === 'object' ? expiredMessageLengthError.message : expiredMessageLengthError;
      }
    }

    if (formData.template.form_title && formData.template.form_title.trim()) {
      const formTitleLengthError = validateIsLength(formData.template.form_title, {
        validatorOptions: { max: 500 },
        customMessage: 'Form title must be less than 500 characters'
      });
      if (formTitleLengthError) {
        newErrors['template.form_title'] = typeof formTitleLengthError === 'object' ? formTitleLengthError.message : formTitleLengthError;
      }
    }

    if (formData.template.form_message && formData.template.form_message.trim()) {
      const formMessageLengthError = validateIsLength(formData.template.form_message, {
        validatorOptions: { max: 1000 },
        customMessage: 'Form message must be less than 1000 characters'
      });
      if (formMessageLengthError) {
        newErrors['template.form_message'] = typeof formMessageLengthError === 'object' ? formMessageLengthError.message : formMessageLengthError;
      }
    }

    if (formData.template.privacy_notice && formData.template.privacy_notice.trim()) {
      const privacyNoticeLengthError = validateIsLength(formData.template.privacy_notice, {
        validatorOptions: { max: 2000 },
        customMessage: 'Privacy notice must be less than 2000 characters'
      });
      if (privacyNoticeLengthError) {
        newErrors['template.privacy_notice'] = typeof privacyNoticeLengthError === 'object' ? privacyNoticeLengthError.message : privacyNoticeLengthError;
      }
    }

    // Theme color validation
    if (formData.template.theme_colour && formData.template.theme_colour.trim()) {
      const themeColorError = validateIsHexColor(formData.template.theme_colour, {
        customMessage: 'Please enter a valid hex color (e.g., #FF0000)'
      });
      if (themeColorError) {
        newErrors['template.theme_colour'] = typeof themeColorError === 'object' ? themeColorError.message : themeColorError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sanitization function to clean data before backend submission
  const sanitizeFormData = (data) => {
    return {
      prerequisites: {
        client_ref: sanitizeTrim(sanitizeEscape(data.prerequisites.client_ref)),
        client_name: sanitizeProperCase(sanitizeTrim(sanitizeEscape(data.prerequisites.client_name))),
        client_image: data.prerequisites.client_image,
        client_image_file: data.prerequisites.client_image_file,
        product_name: sanitizeProperCase(sanitizeTrim(sanitizeEscape(data.prerequisites.product_name))),
        product_image: data.prerequisites.product_image,
        product_image_file: data.prerequisites.product_image_file,
        client_url: data.prerequisites.client_url ? sanitizeTrim(data.prerequisites.client_url) : '',
        contact_url: data.prerequisites.contact_url ? sanitizeTrim(data.prerequisites.contact_url) : '',
        privacy_url: data.prerequisites.privacy_url ? sanitizeTrim(data.prerequisites.privacy_url) : '',
      },
      template: {
        loading_title: data.template.loading_title ? sanitizeTrim(stripHtmlTags(data.template.loading_title)) : '',
        loading_message: data.template.loading_message ? sanitizeTrim(stripHtmlTags(data.template.loading_message)) : '',
        completed_title: data.template.completed_title ? sanitizeTrim(stripHtmlTags(data.template.completed_title)) : '',
        completed_message: data.template.completed_message ? sanitizeTrim(stripHtmlTags(data.template.completed_message)) : '',
        expired_title: data.template.expired_title ? sanitizeTrim(stripHtmlTags(data.template.expired_title)) : '',
        expired_message: data.template.expired_message ? sanitizeTrim(stripHtmlTags(data.template.expired_message)) : '',
        form_title: data.template.form_title ? sanitizeTrim(stripHtmlTags(data.template.form_title)) : '',
        form_message: data.template.form_message ? sanitizeTrim(stripHtmlTags(data.template.form_message)) : '',
        privacy_notice: data.template.privacy_notice ? sanitizeTrim(stripHtmlTags(data.template.privacy_notice)) : '',
        theme_colour: data.template.theme_colour ? sanitizeTrim(data.template.theme_colour) : '#008DA9',
        communication_preferences: data.template.communication_preferences
      }
    };
  };

  // Apply template replacements - use form data state 
  const handlePrerequisitesChange = (field, value) => {
    // Clear error when field changes
    clearError(`prerequisites.${field}`);
    
    setFormData(prev => ({
      ...prev,
      prerequisites: {
        ...prev.prerequisites,
        [field]: value
      }
    }));
  };

  const handleTemplateChange = (field, value) => {
    // Clear error when field changes
    clearError(`template.${field}`);
    
    setFormData(prev => ({
      ...prev,
      template: {
        ...prev.template,
        [field]: value
      }
    }));
  };

  const handleCommunicationPreferenceChange = (type, field, value) => {
    setFormData(prev => ({
      ...prev,
      template: {
        ...prev.template,
        communication_preferences: {
          ...prev.template.communication_preferences,
          [type]: {
            ...prev.template.communication_preferences[type],
            [field]: value
          }
        }
      }
    }));
  };

  const handleClientChange = (client) => {
    // Find the selected client to get both ref and name
    const selectedClient = clients?.find(c => c.value.trim() === client.trim());
    if (selectedClient) {
      handlePrerequisitesChange('client_ref', selectedClient.client_ref);
      handlePrerequisitesChange('client_name', client);
      if(!formData.prerequisites.client_image_file) {
        // Check if image exists using Image object (no CORS issues)
        const imageUrl = r2bucketURL + 'logos/' + selectedClient.client_ref.toLowerCase() + '-logo.png';
        const img = new Image();
        img.onload = () => {
          // Image exists and loaded successfully
          handlePrerequisitesChange('client_image', imageUrl);
        };
        img.onerror = () => {
          // Image failed to load, set to null
          handlePrerequisitesChange('client_image', null);
        };
        img.src = imageUrl;
      }
    }
  };

  const handleSaveTemplate = async () => {
    try {
      // Validate form data first
      if (!validateForm()) {
        return;
      }

      // Sanitize form data
      const sanitizedData = sanitizeFormData(formData);

      // Create FormData for file uploads
      const submitData = new FormData();

      // Add prerequisites data (exclude image URLs when files are being uploaded)
      Object.keys(sanitizedData.prerequisites).forEach(key => {
        const value = sanitizedData.prerequisites[key];
        if (key !== 'client_image_file' && key !== 'product_image_file') {
          // Skip image URLs if we have file uploads for them
          if (key === 'client_image' && formData.prerequisites.client_image_file instanceof File) {
            return;
          }
          if (key === 'product_image' && formData.prerequisites.product_image_file instanceof File) {
            return;
          }
          submitData.append(`prerequisites[${key}]`, value || '');
        }
      });

      // Add template data (don't filter out empty strings)
      Object.keys(sanitizedData.template).forEach(key => {
        const value = sanitizedData.template[key];
        if (key !== 'communication_preferences') {
          submitData.append(`template[${key}]`, value || '');
        }
      });

      // Add communication preferences with proper boolean conversion
      if (sanitizedData.template.communication_preferences) {
        Object.keys(sanitizedData.template.communication_preferences).forEach(type => {
          const pref = sanitizedData.template.communication_preferences[type];
          Object.keys(pref).forEach(field => {
            let value = pref[field];
            // Convert boolean values to strings that Laravel can understand
            if (typeof value === 'boolean') {
              value = value ? '1' : '0';
            }
            submitData.append(`template[communication_preferences][${type}][${field}]`, value);
          });
        });
      }

      // Add file uploads if they exist (check for actual File objects, not empty strings)
      if (formData.prerequisites.client_image_file && formData.prerequisites.client_image_file instanceof File) {
        submitData.append('prerequisites[client_image_file]', formData.prerequisites.client_image_file);
      }
      if (formData.prerequisites.product_image_file && formData.prerequisites.product_image_file instanceof File) {
        submitData.append('prerequisites[product_image_file]', formData.prerequisites.product_image_file);
      }

      // Submit to backend using the provided signed store URL
      const response = await fetch(store_url, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: submitData
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        // Show success screen with proper transition
        handlePreviewModeChange('success');
      } else {
        // Handle backend validation errors
        if (result.errors) {
          const backendErrors = {};
          Object.keys(result.errors).forEach(key => {
            backendErrors[key] = Array.isArray(result.errors[key]) ? result.errors[key][0] : result.errors[key];
          });
          setErrors(backendErrors);
        } else {
          throw new Error(result.message || 'Failed to save template');
        }
      }

    } catch (error) {
      console.error('Save failed:', error);
      
      // Handle network errors or unexpected errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error: Please check your connection and try again', {
          position: 'top-center',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });
      } else {
        toast.error(`Failed to save template: ${error.message}`, {
          position: 'top-center',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });
      }
    }
  };

  return (
    <div className="h-screen bg-gray-200 dark:bg-gray-900 relative overflow-hidden">
      {/* Fixed Right Sidebar - Substitution Key */}
      {previewMode !== 'success' && (
        <div className="fixed top-16 right-0 w-80 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-[999] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <ClipboardDocumentListIcon className="h-5 w-5 text-theme-600 dark:text-theme-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Substitution Key
            </h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Use these placeholders in your text fields. They will be automatically replaced with the actual values:
            </p>
            
            {/* Substitution items */}
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="text-sm text-theme-400 dark:text-theme-400 mb-1 font-bold italic">
                  {'{'}{'{'}product_name{'}'}{'}'}                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Name of the product
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="text-sm text-theme-400 dark:text-theme-400 mb-1 font-bold italic">
                  {'{'}{'{'}client_name{'}'}{'}'}                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Name of the client
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="text-sm text-theme-400 dark:text-theme-400 mb-1 font-bold italic">
                  {'{'}{'{'}salutation{'}'}{'}'}                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Name of the supporter
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="text-sm text-theme-400 dark:text-theme-400 mb-1 font-bold italic">
                  {'{'}{'{'}ngn{'}'}{'}'}                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Return call telephone number
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-2">
                <svg className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Tip:</strong> Copy and paste these placeholders into your text fields. They will be replaced with real data when the form is displayed to users.
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
      
      {/* Template Configuration Header */}
      {previewMode !== 'success' && (
        <div className="fixed top-0 left-0 right-0 z-[1000] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16">
            
            {/* Template Name */}
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-6 w-6 text-theme-600 dark:text-theme-500" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white hidden lg:block">
                Create Template
              </h1>
            </div>

            {/* Center Controls */}
            <div className="flex items-center space-x-6">
              {/* Preview Mode Buttons */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 mr-3 hidden lg:block">Configure:</span>

                <button
                  onClick={() => handlePreviewModeChange('prerequisites')}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    previewMode === 'prerequisites'
                      ? 'bg-theme-100 text-theme-800 dark:bg-theme-900 dark:text-theme-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <ClipboardDocumentListIcon className="h-4 w-4 mr-1.5" />
                  Prerequisites
                </button>
                
                <button
                  onClick={() => handlePreviewModeChange('loading')}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    previewMode === 'loading'
                      ? 'bg-theme-100 text-theme-800 dark:bg-theme-900 dark:text-theme-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <CogIcon className="h-4 w-4 mr-1.5" />
                  Loading
                </button>

                <button
                  onClick={() => handlePreviewModeChange('form')}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    previewMode === 'form'
                      ? 'bg-theme-100 text-theme-800 dark:bg-theme-900 dark:text-theme-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <DocumentTextIcon className="h-4 w-4 mr-1.5" />
                  Form
                </button>

                <button
                  onClick={() => handlePreviewModeChange('completed')}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    previewMode === 'completed'
                      ? 'bg-theme-100 text-theme-800 dark:bg-theme-900 dark:text-theme-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                  Completed
                </button>

                <button
                  onClick={() => handlePreviewModeChange('expired')}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    previewMode === 'expired'
                      ? 'bg-theme-100 text-theme-800 dark:bg-theme-900 dark:text-theme-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <ClockIcon className="h-4 w-4 mr-1.5" />
                  Expired
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Theme Color Picker */}
              <div className="">
                <ColorInput
                  id="theme-color"
                  label=""
                  currentState={themeColour}
                  onColorChange={handleThemeColourChange}
                  showSwatches={true}
                  error={errors['template.theme_colour']}
                />
              </div>
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
                <EyeIcon className="h-4 w-4 mr-1.5" />
                Preview Link
              </button>
              <button 
                onClick={handleSaveTemplate}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-theme-600 border border-transparent rounded-md hover:bg-theme-700 dark:bg-theme-700 dark:hover:bg-theme-600"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Add padding for fixed header */}
      <div className="">
        {/* Loading Screen Overlay */}
        <div 
          className={`fixed top-16 left-0 right-80 bottom-0 flex items-center justify-center z-50 bg-gray-200 dark:bg-gray-900 transition-all duration-300 ${
            previewMode === 'loading' && !isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
        <div className="text-center w-full max-w-3xl">
          {/* Gift Box Animation */}
          <div className={`relative ${previewMode === 'loading' && !isTransitioning ? 'animate-fadeInUp' : ''}`}>
            <div className="h-96 w-96 mx-auto flex items-center justify-center">
              {/* Lottie Gift Animation */}
              {animationDataLoading && (
                <Lottie
                  key={`loading-${animationKey}`}
                  animationData={animationDataLoading}
                  loop={false}
                  autoplay
                />
              )}
            </div>
          </div>

          {/* Loading Text */}
          <div className={`space-y-4 px-4 -mt-16 ${previewMode === 'loading' && !isTransitioning ? 'animate-fadeInUp' : ''}`} 
               style={{ animationDelay: previewMode === 'loading' && !isTransitioning ? '0.1s' : '0s' }}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              <InlineEditableText
                value={formData.template.loading_title}
                onChange={(value) => handleTemplateChange('loading_title', value)}
                className="text-2xl font-bold text-gray-900 dark:text-white text-center block w-full"
                placeholder="Enter loading title..."
              />
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto text-center">
              <InlineEditableText
                value={formData.template.loading_message}
                onChange={(value) => handleTemplateChange('loading_message', value)}
                className="text-lg text-gray-600 dark:text-gray-300 text-center block w-full"
                placeholder="Enter loading message..."
              />
            </p>
          </div>

          {/* Logo at bottom */}
          <div className={`mt-8 ${previewMode === 'loading' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
               style={{ animationDelay: previewMode === 'loading' && !isTransitioning ? '0.2s' : '0s' }}>
            {formData.prerequisites.client_image && (
              <img
                alt={formData.prerequisites.client_name}
                src={formData.prerequisites.client_image}
                className="mx-auto h-12 w-auto opacity-60"
              />
            )}
          </div>
        </div>
      </div>

      {/* Completion Screen Overlay */}
      <div 
        className={`fixed top-16 left-0 right-80 bottom-0 flex items-center justify-center z-50 bg-gray-200 dark:bg-gray-900 transition-all duration-300 ${
          previewMode === 'completed' && !isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="text-center w-full max-w-4xl">
          {/* Success Animation */}
          <div className={`relative mb-8 ${previewMode === 'completed' && !isTransitioning ? 'animate-fadeInUp' : ''}`}>
            <div className="h-96 w-96 mx-auto flex items-center justify-center">
              {/* Success Checkmark or Animation */}
              {animationDataSuccess && (
                <Lottie
                  key={`success-${animationKey}`}
                  animationData={animationDataSuccess}
                  loop={false}
                  autoplay
                />
              )}
            </div>
          </div>

          {/* Success Text */}
          <div className={`space-y-4 px-4 -mt-24 ${previewMode === 'completed' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
               style={{ animationDelay: previewMode === 'completed' && !isTransitioning ? '0.1s' : '0s' }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
              <InlineEditableText
                value={formData.template.completed_title}
                onChange={(value) => handleTemplateChange('completed_title', value)}
                className="text-3xl font-bold text-gray-900 dark:text-white text-center block w-full"
                placeholder="Enter completion title..."
              />
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto text-center">
              <InlineEditableText
                value={formData.template.completed_message}
                onChange={(value) => handleTemplateChange('completed_message', value)}
                className="text-lg text-gray-600 dark:text-gray-300 text-center block w-full"
                placeholder="Enter completion message..."
              />
            </p>
            <div className="pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You can now safely close this page.
              </p>
            </div>
          </div>

          {/* Logo at bottom */}
          <div className={`mt-12 ${previewMode === 'completed' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
               style={{ animationDelay: previewMode === 'completed' && !isTransitioning ? '0.2s' : '0s' }}>
            {formData.prerequisites.client_image && (
              <img
                alt={formData.prerequisites.client_name}
                src={formData.prerequisites.client_image}
                className="mx-auto h-12 w-auto opacity-60"
              />
            )}
          </div>
        </div>
      </div>

      {/* Success Screen Overlay */}
      <div 
        className={`fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-[1001] bg-gray-200 dark:bg-gray-900 transition-all duration-300 ${
          previewMode === 'success' && !isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="text-center w-full max-w-4xl">
          {/* Success Animation */}
          <div className={`relative mb-8 ${previewMode === 'success' && !isTransitioning ? 'animate-fadeInUp' : ''}`}>
            <div className="h-96 w-96 mx-auto flex items-center justify-center">
              {/* Success Checkmark or Animation */}
              {animationDataSuccess && (
                <Lottie
                  key={`success-${animationKey}`}
                  animationData={animationDataSuccess}
                  loop={false}
                  autoplay
                />
              )}
            </div>
          </div>

          {/* Success Text */}
          <div className={`space-y-4 px-4 -mt-24 ${previewMode === 'success' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
               style={{ animationDelay: previewMode === 'success' && !isTransitioning ? '0.1s' : '0s' }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
              Template Created Successfully!
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto text-center">
              Your template has been saved and is ready to use. You can now create claim forms using this template configuration.
            </p>
            <div className="pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You can now safely close this page or create another template.
              </p>
            </div>
          </div>

          {/* Logo at bottom */}
          <div className={`mt-12 ${previewMode === 'success' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
               style={{ animationDelay: previewMode === 'success' && !isTransitioning ? '0.2s' : '0s' }}>
            {formData.prerequisites.client_image && (
              <img
                alt={'Angel Charity Services'}
                src={'https://cdn.angelfs.co.uk/clients/images/logos/afs-logo.png'}
                className="mx-auto h-12 w-auto opacity-60"
              />
            )}
          </div>
        </div>
      </div>

      {/* Expired Screen Overlay */}
      <div 
        className={`fixed top-16 left-0 right-80 bottom-0 flex items-center justify-center z-50 bg-gray-200 dark:bg-gray-900 transition-all duration-300 ${
          previewMode === 'expired' && !isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="text-center w-full max-w-4xl">
          {/* Expired Animation */}
          <div className={`relative mb-8 ${previewMode === 'expired' && !isTransitioning ? 'animate-fadeInUp' : ''}`}>
            <div className="h-52 w-52 mx-auto flex items-center justify-center">
              {/* Timeout/Expired Animation */}
              {animationDataTimeout && (
                <Lottie
                  key={`timeout-${animationKey}`}
                  animationData={animationDataTimeout}
                  loop={true}
                  autoplay
                />
              )}
            </div>
          </div>

          {/* Expired Text */}
          <div className={`space-y-4 px-4 -mb-10 ${previewMode === 'expired' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
               style={{ animationDelay: previewMode === 'expired' && !isTransitioning ? '0.1s' : '0s' }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
              <InlineEditableText
                value={formData.template.expired_title}
                onChange={(value) => handleTemplateChange('expired_title', value)}
                className="text-3xl font-bold text-gray-900 dark:text-white text-center block w-full"
                placeholder="Enter expired title..."
              />
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto text-center">
              <InlineEditableText
                value={formData.template.expired_message}
                onChange={(value) => handleTemplateChange('expired_message', value)}
                className="text-lg text-gray-600 dark:text-gray-300 text-center block w-full"
                placeholder="Enter expired message..."
              />
            </p>
            <div className="pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You can now safely close this page.
              </p>
            </div>
          </div>

          {/* Logo at bottom */}
          <div className={`mt-12 ${previewMode === 'expired' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
               style={{ animationDelay: previewMode === 'expired' && !isTransitioning ? '0.2s' : '0s' }}>
            {formData.prerequisites.client_image && (
              <img
                alt={formData.prerequisites.client_name}
                src={formData.prerequisites.client_image}
                className="mx-auto h-12 w-auto opacity-60"
              />
            )}
          </div>
        </div>
      </div>

      {/* Prerequisites Content */}
      <div 
        ref={prerequisitesScrollRef}
        className={`fixed top-16 left-0 right-80 bottom-0 overflow-y-auto z-40 bg-gray-200 dark:bg-gray-900 transition-all duration-300 ${
          previewMode === 'prerequisites' && !isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className={`mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 ${previewMode === 'prerequisites' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
             style={{ animationDelay: previewMode === 'prerequisites' && !isTransitioning ? '0.1s' : '0s' }}>
          
          {/* Prerequisites Header Section */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-6 pb-10 pt-6">
              {/* Header */}
              <div className={`text-center pb-6 mb-6 border-b border-gray-900/10 dark:border-gray-700/50 ${previewMode === 'prerequisites' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
                   style={{ animationDelay: previewMode === 'prerequisites' && !isTransitioning ? '0.2s' : '0s' }}>
                <h1 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white text-left">
                  Template Prerequisites
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 text-left">
                  Configure the basic settings and requirements for your template before proceeding to design.
                </p>
              </div>

              {/* Prerequisites Form */}
              <form onSubmit={(e) => e.preventDefault()} 
                    className={`space-y-8 ${previewMode === 'prerequisites' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
                    style={{ animationDelay: previewMode === 'prerequisites' && !isTransitioning ? '0.3s' : '0s' }}
                    autoComplete="on">
                
                {/* Client Selection Section */}
                <div className="border-b border-gray-900/10 dark:border-gray-700/50 pb-8">
                  <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Client Information</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    Select or configure the client for this template.
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-4 z-20">
                      <SelectInput
                        id="client"
                        label="Client"
                        currentState={formData.prerequisites.client_ref}
                        disabled={false}
                        items={clients}
                        onSelectChange={handleClientChange}
                        placeholder="Select a client"
                        error={errors['prerequisites.client_ref']}
                      />
                    </div>
                  </div>
                </div>

                {/* Client Image Section */}
                <div className="border-b border-gray-900/10 dark:border-gray-700/50 pb-8">
                  <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Client Logo</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    Upload or configure the client logo that will appear in the template.
                  </p>

                  <div className="mt-6">
                    {/* Client Image Upload Area */}
                    <div className="mb-2 mx-auto relative">
                      {formData.prerequisites.client_image ? (
                        // Show uploaded/existing image
                        <div className="relative max-w-xs">
                          {/* Remove button - only show if custom image is uploaded */}
                          <button
                            onClick={handleRemoveClientImage}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors duration-200 z-10"
                            title="Remove custom logo"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                          <div className="relative h-48 px-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 group">
                            <img
                              src={formData.prerequisites.client_image}
                              alt="Client logo"
                              className="min-h-48 max-h-48 py-2 w-auto mx-auto object-contain rounded-lg"
                            />
                            
                            {/* Change image overlay */}
                            <div 
                              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl cursor-pointer"
                              onClick={handleClientUploadClick}
                            >
                              <div className="text-center text-white">
                                <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-sm font-medium">Change Logo</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Show upload area
                        <div 
                          className={`relative h-48 w-full max-w-xs rounded-2xl border-2 border-dashed transition-colors duration-200 cursor-pointer ${
                            isClientDragOver 
                              ? 'border-gray-400 bg-gray-100 dark:bg-gray-900/20' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                          onDragOver={handleClientDragOver}
                          onDragLeave={handleClientDragLeave}
                          onDrop={handleClientDrop}
                          onClick={handleClientUploadClick}
                        >
                          <div className="flex flex-col items-center justify-center h-full text-center p-6 pointer-events-none">
                            <svg 
                              className={`mx-auto h-12 w-12 mb-4 transition-colors duration-200 ${
                                isClientDragOver ? 'text-gray-500' : 'text-gray-400 dark:text-gray-500'
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className={`text-lg font-medium mb-2 transition-colors duration-200 ${
                              isClientDragOver ? 'text-gray-800 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {isClientDragOver ? 'Drop logo here' : 'Drop a client logo here or click to upload'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              JPG, PNG, GIF up to 2MB
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              (Recommended size: 400x400px)
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Hidden file input */}
                      <input
                        ref={clientFileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleClientFileInputChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Information Section */}
                <div className="border-b border-gray-900/10 dark:border-gray-700/50 pb-8">
                  <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Product Information</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    Define the product that will be featured in this template.
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                      <TextInput
                        id="product-name"
                        label="Product Name"
                        autoComplete="off"
                        placeholder="Enter the product name (e.g., Pin Badge, Sticker, etc.)"
                        disabled={false}
                        currentState={formData.prerequisites.product_name}
                        onTextChange={(value) => handlePrerequisitesChange('product_name', value)}
                        Icon={GiftIcon}
                        error={errors['prerequisites.product_name']}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        This will be used as the {'{{product_name}}'} variable throughout the template.
                      </p>
                    </div>
                  </div>
                </div>

                {/* URLs Section */}
                <div className="">
                  <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Template URLs</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    Configure the website links that will appear in the template footer.
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <TextInput
                        id="client-url"
                        label="Client Website URL"
                        autoComplete="url"
                        placeholder="https://www.example.org"
                        disabled={false}
                        currentState={formData.prerequisites.client_url}
                        onTextChange={(value) => handlePrerequisitesChange('client_url', value)}
                        Icon={LinkIcon}
                        error={errors['prerequisites.client_url']}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        The main website URL for the client organization.
                      </p>
                    </div>

                    <div className="sm:col-span-3">
                      <TextInput
                        id="contact-url"
                        label="Contact URL"
                        autoComplete="url"
                        placeholder="https://www.example.org/contact"
                        disabled={false}
                        currentState={formData.prerequisites.contact_url}
                        onTextChange={(value) => handlePrerequisitesChange('contact_url', value)}
                        Icon={LinkIcon}
                        error={errors['prerequisites.contact_url']}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Link to the contact or support page.
                      </p>
                    </div>

                    <div className="sm:col-span-3">
                      <TextInput
                        id="privacy-url"
                        label="Privacy Policy URL"
                        autoComplete="url"
                        placeholder="https://www.example.org/privacy"
                        disabled={false}
                        currentState={formData.prerequisites.privacy_url}
                        onTextChange={(value) => handlePrerequisitesChange('privacy_url', value)}
                        Icon={LinkIcon}
                        error={errors['prerequisites.privacy_url']}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Link to the privacy policy page.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Content */}
      <div 
         ref={formScrollRef}
        className={`fixed top-16 left-0 right-80 bottom-0 overflow-y-auto z-40 bg-gray-200 dark:bg-gray-900 transition-all duration-300 ${
          previewMode === 'form' && !isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Simple Header with Logo */}
        <header className={`py-10 ${previewMode === 'form' && !isTransitioning ? 'animate-fadeInUp' : ''}`}>
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {formData.prerequisites.client_image && (
                <img
                  alt={formData.prerequisites.client_name}
                  src={formData.prerequisites.client_image}
                  className="mx-auto h-16 w-auto mb-2"
                />
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className={`mx-auto max-w-4xl px-4 pb-4 sm:px-6 lg:px-8 ${previewMode === 'form' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
             style={{ animationDelay: previewMode === 'form' && !isTransitioning ? '0.1s' : '0s' }}>
          {/* Product Header Section */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-6 py-10">
              {/* Product Image and Info */}
              <div className={`text-center mb-4 ${previewMode === 'form' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
                   style={{ animationDelay: previewMode === 'form' && !isTransitioning ? '0.2s' : '0s' }}>
                {/* Product Image Upload/Display */}
                <div className="mb-8 mx-auto relative">
                  {formData.prerequisites.product_image ? (
                    // Show uploaded/existing image
                    <div className="relative h-72 w-72 mx-auto bg-theme-600 dark:bg-gray-900 rounded-2xl p-1.5 shadow-lg">
                      {/* Remove button - always visible, outside hover group */}
                      <button
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors duration-200 z-20"
                        title="Remove image"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                      <div className="h-full w-full rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 relative group">
                        <img
                          src={formData.prerequisites.product_image}
                          alt="Product"
                          className="h-full w-full object-cover"
                        />
                        {/* Shadow overlay */}
                        <div 
                          className="absolute inset-0 rounded-xl pointer-events-none"
                          style={{
                            boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.2), inset 0 0 15px rgba(0, 0, 0, 0.1)'
                          }}
                        ></div>

                        {/* Change image overlay */}
                        <div 
                          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl cursor-pointer"
                          onClick={handleUploadClick}
                        >
                          <div className="text-center text-white">
                            <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm font-medium">Change Image</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Show upload area
                    <div 
                      className={`relative h-72 w-72 mx-auto rounded-2xl border-2 border-dashed transition-colors duration-200 cursor-pointer ${
                        isDragOver 
                          ? 'border-gray-400 bg-gray-100 dark:bg-gray-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={handleUploadClick}
                    >
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 pointer-events-none">
                        <svg 
                          className={`mx-auto h-12 w-12 mb-4 transition-colors duration-200 ${
                            isDragOver ? 'text-gray-500' : 'text-gray-400 dark:text-gray-500'
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className={`text-lg font-medium mb-2 transition-colors duration-200 ${
                          isDragOver ? 'text-gray-800 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {isDragOver ? 'Drop image here' : 'Drop a product image here or click to upload'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          JPG, PNG, GIF up to 5MB
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          (Recommended size: 300x300px)
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl text-center">
                  <InlineEditableText
                    value={formData.template.form_title}
                    onChange={(value) => handleTemplateChange('form_title', value)}
                    className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl text-center"
                    placeholder="Enter form title..."
                  />
                </h1>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 text-center">
                  <InlineEditableText
                    value={formData.template.form_message}
                    onChange={(value) => handleTemplateChange('form_message', value)}
                    className="text-lg text-gray-600 dark:text-gray-300 text-center"
                    placeholder="Enter form message..."
                  />
                </p>
              </div>

              {/* Registration Form */}
              <form onSubmit={(e) => e.preventDefault()} 
                    className={`space-y-6 ${previewMode === 'form' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
                    style={{ animationDelay: previewMode === 'form' && !isTransitioning ? '0.3s' : '0s' }}
                    autoComplete="on">
                {/* Personal Information Section */}
                <div className="border-b border-t border-gray-900/10 dark:border-gray-700/50 pb-8 pt-4">
                  <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Delivery Details</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    Please provide the name for delivery of your free <span className="text-theme-400"><b><i>{"{{product_name}}"}</i></b></span>.
                  </p>

                  <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                      <SelectInput
                        id="title"
                        label="Title"
                        currentState={''}
                        disabled={true}
                        items={[]}
                        onSelectChange={() => {}}
                        placeholder="Select title"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <TextInput
                        id="first-name"
                        label="First name"
                        autoComplete="given-name"
                        placeholder="Enter your first name"
                        disabled={true}
                        currentState={''}
                        onTextChange={() => {}}
                        Icon={UserIcon}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <TextInput
                        id="surname"
                        label="Surname"
                        autoComplete="family-name"
                        placeholder="Enter your surname"
                        disabled={true}
                        currentState={''}
                        onTextChange={() => {}}
                        Icon={IdentificationIcon}
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="">
                  <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Delivery Address</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    Where would you like us to deliver your free <span className="text-theme-400"><b><i>{"{{product_name}}"}</i></b></span>?
                  </p>

                  <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    {/* Manual Address Fields */}
                    <div className="col-span-full">
                      <TextInput
                        id="address-line-1"
                        label="Address line 1"
                        autoComplete="street-address"
                        disabled={true}
                        currentState={''}
                        onTextChange={() => {}}
                        Icon={HomeIcon}
                      />
                    </div>

                    <div className="col-span-full">
                      <TextInput
                        id="address-line-2"
                        label="Address line 2"
                        annotation="(optional)"
                        autoComplete="address-line2"
                        disabled={true}
                        currentState={''}
                        onTextChange={() => {}}
                      />
                    </div>

                    <div className="col-span-full">
                      <TextInput
                        id="address-line-3"
                        label="Address line 3"
                        annotation="(optional)"
                        autoComplete="address-line3"
                        disabled={true}
                        currentState={''}
                        onTextChange={() => {}}
                      />
                    </div>

                    <div className="sm:col-span-2 sm:col-start-1">
                      <TextInput
                        id="city"
                        label="City"
                        autoComplete="address-level2"
                        disabled={true}
                        currentState={''}
                        onTextChange={() => {}}
                        Icon={BuildingOfficeIcon}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <TextInput
                        id="county"
                        label="County"
                        autoComplete="address-level1"
                        disabled={true}
                        currentState={''}
                        onTextChange={() => {}}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <TextInput
                        id="postal-code"
                        label="Postal code"
                        autoComplete="postal-code"
                        disabled={true}
                        currentState={''}
                        onTextChange={() => {}}
                        uppercase={true}
                        Icon={MapPinIcon}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Full Width Submit Button */}
          <div className={`mt-8 ${previewMode === 'form' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
               style={{ animationDelay: previewMode === 'form' && !isTransitioning ? '0.4s' : '0s' }}>
            <button
              type="submit"
              disabled={true}
              className="w-full flex justify-center items-center rounded-md px-3 py-4 text-sm font-semibold text-white shadow-sm bg-theme-400 cursor-not-allowed"
            >
              Claim My Free Product
            </button>
          </div>

          {/* Communication Preferences Section */}
          <div className={`mt-8 ${previewMode === 'form' && !isTransitioning ? 'animate-fadeInUp' : ''} overflow-hidden`}
            style={{ animationDelay: previewMode === 'form' && !isTransitioning ? '0.4s' : '0s' }}>
            <div className="">
              <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Communication Preferences</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Please let us know how you would like to hear from us.
              </p>

              <div className="mt-4 flex flex-col gap-y-1">
                {/* Post Preference */}
                <div className="flex items-center gap-x-2">
                  <div className="inline h-6 w-6 -mt-1 cursor-pointer" onClick={() => handleCommunicationPreferenceChange('post', 'enabled', !formData.template.communication_preferences.post.enabled)}>
                    {formData.template.communication_preferences.post.enabled ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500 inline" title='Enabled' />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-500 inline" title='Disabled' />
                    )}
                  </div>
                    <button title={formData.template.communication_preferences.post.type === 'opt-in' ? 'Opt In' : 'Opt Out'} className="bg-gray-100 border-gray-300 hover:bg-gray-200 border px-2 rounded h-6 shrink-0 text-sm font-semibold min-w-[4.5rem]" onClick={() => handleCommunicationPreferenceChange('post', 'type', formData.template.communication_preferences.post.type === 'opt-in' ? 'opt-out' : 'opt-in')}>
                      {formData.template.communication_preferences.post.type === 'opt-in' ? 
                        "Opt In"
                        :
                        "Opt Out"
                      }
                    </button>
                  <div className="h-5 w-5 shrink-0 rounded border border-gray-500 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center"></div>
                  <div 
                    className="text-sm leading-6 text-gray-900 dark:text-white flex w-full"
                  >
                    <InlineEditableText
                      value={formData.template.communication_preferences.post.label}
                      onChange={(value) => handleCommunicationPreferenceChange('post', 'label', value)}
                      className="text-sm leading-6 text-gray-900 dark:text-white pt-[0.09rem]"
                      placeholder="Enter post communication label..."
                      padding={false}
                    />
                  </div>
                </div>

                {/* Phone Preference */}
                <div className="flex items-center shrink-0 gap-x-2">
                  <div className="inline h-6 w-6 -mt-1 cursor-pointer" onClick={() => handleCommunicationPreferenceChange('phone', 'enabled', !formData.template.communication_preferences.phone.enabled)}>
                    {formData.template.communication_preferences.phone.enabled ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500 inline" title='Enabled' />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-500 inline" title='Disabled' />
                    )}
                  </div>
                  <button title={formData.template.communication_preferences.phone.type === 'opt-in' ? 'Opt In' : 'Opt Out'} className="bg-gray-100 border-gray-300 hover:bg-gray-200 border px-2 rounded h-6 shrink-0 text-sm font-semibold min-w-[4.5rem]" onClick={() => handleCommunicationPreferenceChange('phone', 'type', formData.template.communication_preferences.phone.type === 'opt-in' ? 'opt-out' : 'opt-in')}>
                    {formData.template.communication_preferences.phone.type === 'opt-in' ? 
                        "Opt In"
                        :
                        "Opt Out"
                    }
                  </button>
                  <div className="h-5 w-5 shrink-0 rounded border border-gray-500 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center"></div>
                  <div 
                    className="text-sm leading-6 text-gray-900 dark:text-white flex w-full"
                  >
                    <InlineEditableText
                      value={formData.template.communication_preferences.phone.label}
                      onChange={(value) => handleCommunicationPreferenceChange('phone', 'label', value)}
                      className="text-sm leading-6 text-gray-900 dark:text-white pt-[0.09rem]"
                      placeholder="Enter email communication label..."
                      padding={false}
                    />
                  </div>
                </div>

                {/* Email Preference */}
                <div className="flex items-center shrink-0 gap-x-2">
                  <div className="inline h-6 w-6 -mt-1 cursor-pointer" onClick={() => handleCommunicationPreferenceChange('email', 'enabled', !formData.template.communication_preferences.email.enabled)}>
                    {formData.template.communication_preferences.email.enabled ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500 inline" title='Enabled' />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-500 inline" title='Disabled' />
                    )}
                  </div>
                  <button title={formData.template.communication_preferences.email.type === 'opt-in' ? 'Opt In' : 'Opt Out'} className="bg-gray-100 border-gray-300 hover:bg-gray-200 border px-2 rounded h-6 shrink-0 text-sm font-semibold min-w-[4.5rem]" onClick={() => handleCommunicationPreferenceChange('email', 'type', formData.template.communication_preferences.email.type === 'opt-in' ? 'opt-out' : 'opt-in')}>
                    {formData.template.communication_preferences.email.type === 'opt-in' ? 
                        "Opt In"
                        :
                        "Opt Out"
                    }
                  </button>
                  <div className="h-5 w-5 shrink-0 rounded border border-gray-500 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center"></div>
                  <div 
                    className="text-sm leading-6 text-gray-900 dark:text-white flex w-full"
                  >
                    <InlineEditableText
                      value={formData.template.communication_preferences.email.label}
                      onChange={(value) => handleCommunicationPreferenceChange('email', 'label', value)}
                      className="text-sm leading-6 text-gray-900 dark:text-white pt-[0.09rem]"
                      placeholder="Enter email communication label..."
                      padding={false}
                    />
                  </div>
                </div>

                {/* SMS Preference */}
                <div className="flex items-center shrink-0 gap-x-2">
                  <div className="inline h-6 w-6 -mt-1 cursor-pointer" onClick={() => handleCommunicationPreferenceChange('sms', 'enabled', !formData.template.communication_preferences.sms.enabled)}>
                    {formData.template.communication_preferences.sms.enabled ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500 inline" title='Enabled' />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-500 inline" title='Disabled' />
                    )}
                  </div>
                  <button title={formData.template.communication_preferences.sms.type === 'opt-in' ? 'Opt In' : 'Opt Out'} className="bg-gray-100 border-gray-300 hover:bg-gray-200 border px-2 rounded h-6 shrink-0 text-sm font-semibold min-w-[4.5rem]" onClick={() => handleCommunicationPreferenceChange('sms', 'type', formData.template.communication_preferences.sms.type === 'opt-in' ? 'opt-out' : 'opt-in')}>
                    {formData.template.communication_preferences.sms.type === 'opt-in' ? 
                        "Opt In"
                        :
                        "Opt Out"
                    }
                  </button>
                  <div className="h-5 w-5 shrink-0 rounded border border-gray-500 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  </div>
                  <div 
                    className="text-sm leading-6 text-gray-900 dark:text-white flex w-full"
                  >
                    <InlineEditableText
                      value={formData.template.communication_preferences.sms.label}
                      onChange={(value) => handleCommunicationPreferenceChange('sms', 'label', value)}
                      className="text-sm leading-6 text-gray-900 dark:text-white pt-[0.09rem]"
                      placeholder="Enter SMS communication label..."
                      padding={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Disclaimer */}
        <footer className={`${previewMode === 'form' && !isTransitioning ? 'animate-fadeInUp' : ''}`}
                style={{ animationDelay: previewMode === 'form' && !isTransitioning ? '0.5s' : '0s' }}>
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center items-center mb-4">
                {formData.prerequisites.client_image && (
                  <img
                    alt={formData.prerequisites.client_name}
                    src={formData.prerequisites.client_image}
                    className="h-8 w-auto"
                  />
                )}
              </div>
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-300 max-w-[44rem] mx-auto text-center">
                <InlineEditableText
                  value={formData.template.privacy_notice}
                  onChange={(value) => handleTemplateChange('privacy_notice', value)}
                  className="text-sm leading-6 text-gray-600 dark:text-gray-300 text-center"
                  placeholder="Enter privacy notice..."
                />
              </p>
              <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                { formData.prerequisites.client_url && 
                  <a href={formData.prerequisites.client_url} className={`hover:text-gray-600 dark:hover:text-gray-300 ${!formData.prerequisites.client_name ? 'font-bold italic text-theme-400 hover:text-theme-400' : ''}`}>{formData.prerequisites.client_name || '{{client_name}}'}</a>
                }
                { formData.prerequisites.privacy_url &&
                  <>
                    <span>•</span>
                    <a href={formData.prerequisites.privacy_url} className="hover:text-gray-600 dark:hover:text-gray-300">Privacy Policy</a>
                  </>
                }
                { formData.prerequisites.contact_url &&
                  <>
                    <span>•</span>
                    <a href={formData.prerequisites.contact_url} className="hover:text-gray-600 dark:hover:text-gray-300">Contact Support</a>
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
      
      {/* Scroll Hint - only shown in form mode */}
      {previewMode === 'form' && (
        <ScrollHint basic={true} scrollRef={formScrollRef} hideThreshold={45} allowClick={false} size='h-4 w-4'>
          <p className="text-sm text-gray-500 dark:text-gray-300 pr-1">
            Scroll to complete
          </p>
        </ScrollHint>
      )}
      </div>
    </div>
  );
}