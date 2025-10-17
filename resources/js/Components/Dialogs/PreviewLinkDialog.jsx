import { useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ClipboardIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import QRCode from 'qrcode';
import { ExclamationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';

export default function PreviewLinkDialog({ 
  isOpen, 
  onClose, 
  templateData,
  onGeneratePreview,
  className = ''
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);

  const handleGeneratePreview = useCallback(async () => {
    if (!templateData) return;

    setIsGenerating(true);
    try {
      const result = await onGeneratePreview(templateData);
      
      if (result.success) {
        setPreviewData(result.data);
        
        // Generate QR code
        const qrUrl = await QRCode.toDataURL(result.data.url, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrUrl);
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [templateData, onGeneratePreview]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openInNewTab = (url) => {
    window.open(url, '_blank');
  };

  // Generate preview when dialog opens (only once per open)
  useEffect(() => {
    if (isOpen && templateData && !previewData && !hasAttemptedGeneration && !isGenerating) {
      setHasAttemptedGeneration(true);
      handleGeneratePreview();
    }
  }, [isOpen, templateData, previewData, hasAttemptedGeneration, isGenerating, handleGeneratePreview]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setPreviewData(null);
        setQrCodeUrl('');
        setCopySuccess(false);
        setHasAttemptedGeneration(false);
      }, 300);
    }
  }, [isOpen]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className={`fixed inset-0 overflow-y-auto ${className}`}>
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Preview Template
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Loading State */}
                {isGenerating && (
                  <div className="text-center py-8">
                    <ArrowPathIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto animate-spin mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Generating preview link...</p>
                  </div>
                )}

                {/* Preview Data */}
                {previewData && !isGenerating && (
                  <div className="space-y-6">
                    {/* QR Code */}
                    <div className="text-center">
                      <div className="bg-white p-4 rounded-lg inline-block">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code for preview link" 
                          className="w-52 h-52 mx-auto"
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Scan with your phone to open the preview
                      </p>
                    </div>

                    {/* Preview URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preview URL
                      </label>
                      <div className="flex rounded-md shadow-sm">
                        <input
                          type="text"
                          readOnly
                          value={previewData.url}
                          className="flex-1 block w-full rounded-none rounded-l-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white text-sm px-2 border"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(previewData.url)}
                          className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          {copySuccess ? (
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          ) : (
                            <ClipboardIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expiry Info */}
                    {previewData.expires_at && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          <strong>Testing Mode:</strong> This preview link expires at{' '}
                          {new Date(previewData.expires_at).toLocaleString('en-GB')}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => openInNewTab(previewData.url)}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-theme-600 hover:bg-theme-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-500"
                      >
                        Open Preview
                      </button>
                      <button
                        type="button"
                        onClick={handleGeneratePreview}
                        className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-500"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {!isGenerating && !previewData && (
                  <div className="text-center py-8 flex flex-col items-center gap-y-4">
                    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600`}>
                      <ExclamationTriangleIcon className={`h-7 w-7 text-white`} aria-hidden="true" />
                    </div>
                    <button
                      type="button"
                      onClick={handleGeneratePreview}
                      className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-theme-600 hover:bg-theme-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-500"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}