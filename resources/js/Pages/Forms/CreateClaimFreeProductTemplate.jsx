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
import { generateColorScale, injectThemeColors, replaceAnimationColors } from '../../Utils/Color';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  UserIcon, 
  HomeIcon, 
  MapPinIcon, 
  BuildingOfficeIcon,
  IdentificationIcon,
  GiftIcon,
  CheckCircleIcon,
  EyeIcon,
  CogIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { ring } from 'ldrs';
import { XMarkIcon } from '@heroicons/react/20/solid';


export default function CreateClaimFreeProductTemplate({ 
  // Template props  
  template_name = "Sample Template",
  guid, // Add guid prop
  title,
  surname,
  client_image,
  client_name,
  clients,
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
  status
}) {

  // Make theme color dynamic and editable
  const [themeColour, setThemeColour] = useState(theme_colour || '#008DA9');

  // Handler to update both local state and form data
  const handleThemeColourChange = (newColour) => {
    setThemeColour(newColour);
    handleTemplateChange('theme_colour', newColour);
  };

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


  const [animationDataLoading, setAnimationDataLoading] = useState(null);
  const [animationDataSuccess, setAnimationDataSuccess] = useState(null);

  // Template preview mode state - controls which screen is shown
  const [previewMode, setPreviewMode] = useState('prerequisites'); // 'prerequisites', 'loading', 'form', 'completed'
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animationKey, setAnimationKey] = useState(0); // Force Lottie restart

  // Handle smooth transitions between preview modes
  const handlePreviewModeChange = (newMode) => {
    // Always increment animation key to restart Lottie animations
    setAnimationKey(prev => prev + 1);
    
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
    handlePrerequisitesChange('product_image', file);
    
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
    handlePrerequisitesChange('custom_image', file);
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
    handlePrerequisitesChange('custom_image', null);
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
      custom_image: '',
      product_name: '',
      product_image: null
    },
    // Template content
    template: {
      loading_title: loading_title,
      loading_message: loading_message,
      completed_title: completed_title,
      completed_message: completed_message,
      form_title: product_title,
      form_message: product_message,
      privacy_notice: privacy_notice,
      theme_colour: theme_colour || '#008DA9',
      client_url: client_url,
      contact_url: contact_url,
      privacy_url: privacy_url
    }
  });

  // Apply template replacements - use form data state 
  const handlePrerequisitesChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: {
        ...prev.prerequisites,
        [field]: value
      }
    }));
  };

  const handleTemplateChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      template: {
        ...prev.template,
        [field]: value
      }
    }));
  };

  const handleClientChange = (client) => {
    // Find the selected client to get both ref and name
    const selectedClient = clients?.find(c => c.value.trim() === client.trim());
    if (selectedClient) {
      handlePrerequisitesChange('client_ref', selectedClient.client_ref);
      handlePrerequisitesChange('client_name', client);
      if(!formData.prerequisites.custom_image) {
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

  const handleSaveTemplate = () => {
    console.log('Form Data:', formData);
    // TODO: Send data to backend for saving
    toast.success('Template data logged to console', {
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

  return (
    <div className="h-screen bg-gray-200 dark:bg-gray-900 relative overflow-hidden">
      
      {/* Template Configuration Header */}
      <div className="fixed top-0 left-0 right-0 z-[1000] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Template Name */}
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-6 w-6 text-theme-600 dark:text-theme-500" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Template
              </h1>
            </div>

            {/* Center Controls */}
            <div className="flex items-center space-x-6">
              {/* Preview Mode Buttons */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 mr-3">Configure:</span>

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

      {/* Add padding for fixed header */}
      <div className="">
        {/* Loading Screen Overlay */}
        <div 
          className={`fixed inset-0 flex items-center justify-center z-50 bg-gray-200 dark:bg-gray-900 transition-all duration-300 h-screen w-screen ${
            previewMode === 'loading' && !isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ top: '64px' }}
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
        className={`fixed inset-0 flex items-center justify-center z-50 bg-gray-200 dark:bg-gray-900 transition-all duration-300 h-screen w-screen ${
          previewMode === 'completed' && !isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ top: '64px' }}
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

      {/* Prerequisites Content */}
      <div 
        className={`fixed inset-0 overflow-y-auto z-40 bg-gray-200 dark:bg-gray-900 transition-all duration-300 h-screen w-screen ${
          previewMode === 'prerequisites' && !isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ top: '64px', paddingBottom: '64px' }}
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
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 text-left">
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
                    <div className="mb-8 mx-auto relative">
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
                <div className="">
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
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        This will be used as the {'{{product_name}}'} variable throughout the template.
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
         ref={scrollRef}
        className={`fixed inset-0 overflow-y-auto z-40 bg-gray-200 dark:bg-gray-900 transition-all duration-300 h-screen w-screen ${
          previewMode === 'form' && !isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ top: '64px', paddingBottom: '64px' }}
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
                    Please provide the name for delivery of your free <b><i>{"{{product_name}}"}</i></b>.
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
                    Where would you like us to deliver your free <b><i>{"{{product_name}}"}</i></b>?
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
              <CheckCircleIcon className="h-5 w-5 text-white mr-2" />
              Template Preview Mode
            </button>
          </div>

          {/* Communication Preferences Section */}
          {formattedCommunicationChannels && formattedCommunicationChannels.length > 0 && (
            <div className="mt-8">
              <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Communication Preferences</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Please let us know how you would like to hear from us.
              </p>

              <div className="mt-4">
                <CheckboxGroupInput
                  id="communication-preferences"
                  items={formattedCommunicationChannels}
                  selectedItems={[]}
                  onChange={() => {}}
                  disabled={true}
                />
              </div>
            </div>
          )}
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
                { formData.template.client_url && 
                  <a href={formData.template.client_url} className={`hover:text-gray-600 dark:hover:text-gray-300 ${!formData.prerequisites.client_name ? 'font-bold italic' : ''}`}>{formData.prerequisites.client_name || '{{client_name}}'}</a>
                }
                { formData.template.privacy_url &&
                  <>
                    <span>•</span>
                    <a href={formData.template.privacy_url} className="hover:text-gray-600 dark:hover:text-gray-300">Privacy Policy</a>
                  </>
                }
                { formData.template.contact_url &&
                  <>
                    <span>•</span>
                    <a href={formData.template.contact_url} className="hover:text-gray-600 dark:hover:text-gray-300">Contact Support</a>
                  </>
                }
              </div>
              <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                © 2025 Angel Charity Services. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Scroll Hint - only shown in form mode */}
      {previewMode === 'form' && (
        <ScrollHint basic={true} scrollRef={scrollRef} hideThreshold={45} allowClick={false} size='h-4 w-4'>
          <p className="text-sm text-gray-500 dark:text-gray-300 pr-1">
            Scroll to complete
          </p>
        </ScrollHint>
      )}
      </div>
    </div>
  );
}