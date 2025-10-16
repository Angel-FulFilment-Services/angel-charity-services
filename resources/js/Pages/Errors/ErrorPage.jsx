import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { getColors } from 'lottie-colorify';
import animationTimeout from '../../../animations/timer.json';
import animationError from '../../../animations/failure.json';
import { generateColorScale, injectThemeColors, replaceAnimationColors } from '../../Utils/Color';

export default function ErrorPage({ 
  status, 
  title,
  surname,
  product_name,
  client_image, 
  client_name, 
  theme_colour,
  expired_title,
  expired_message,
  client_url,
  contact_url,
  privacy_url,
  privacy_notice
}) {
    const themeColour = theme_colour || '#008DA9'; // Default to blue if not provided

    // Animation state
    const [animationDataError, setAnimationDataError] = useState(null);
    const [animationDataTimeout, setAnimationDataTimeout] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoadedAnimation, setIsLoadedAnimation] = useState(false);

    // Default client information
    const r2bucketURL = 'https://cdn.angelfs.co.uk/clients/images/';
    const defaultClientImage = 'afs-logo.png';
    const defaultClientName = 'Angel Charity Services';
    const defaultProductName = 'Pin Badge';
    const defaultClientUrl = 'https://www.helloangel.co.uk/';
    const defaultContactURL = 'https://www.helloangel.co.uk/contact-us';
    const defaultPrivacyURL = 'https://www.helloangel.co.uk/privacypolicy';
    const defaultPrivacyNotice = '';

    const defaultExpiredTitle = expired_title || 
    {
      503: 'Service Unavailable',
      500: 'Server Error', 
      404: 'Page Not Found',
      403: 'Forbidden',
      401: 'Unauthorized',
      410: 'Link Expired',
      400: 'Bad Request'
    }[status]

    const defaultExpiredMessage = expired_message || 
    {
      503: 'We\'re performing maintenance. Please check back soon.',
      500: 'Something went wrong on our end. Please try again later.',
      404: 'The page you\'re looking for could not be found.',
      403: 'You don\'t have permission to access this page.',
      401: 'You need to be authenticated to access this page.',
      410: 'This link has expired and is no longer valid.',
      400: 'Bad Request. Please check the URL or try again.'
    }[status]

    const replaceTemplateVariables = (template, variables) => {
      if (!template) return '';
      
      return Object.entries(variables).reduce((result, [key, value]) => {
        const placeholder = `{{${key}}}`;
        return result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value || '');
      }, template);
    };

    const displayTitle = title;
    const displaySurname = surname;
    const displayImage = r2bucketURL + 'logos/' + (client_image || defaultClientImage);
    const displayClientName = client_name || defaultClientName;
    const displayProductName = product_name || defaultProductName;
    const clientUrl = client_url || defaultClientUrl;
    const contactUrl = contact_url || defaultContactURL;
    const privacyUrl = privacy_url || defaultPrivacyURL;

    const templateVariables = {
      product_name: displayProductName,
      client_name: displayClientName,
      title: displayTitle,
      surname: displaySurname
    };

    const displayExpiredTitle = replaceTemplateVariables(expired_title || defaultExpiredTitle, templateVariables);
    const displayExpiredMessage = replaceTemplateVariables(expired_message || defaultExpiredMessage, templateVariables);
    const displayPrivacyNotice = replaceTemplateVariables(privacy_notice || defaultPrivacyNotice, { product_name: displayProductName, client_name: displayClientName });

    // Initialize animations and theme
    useEffect(() => {
      if (themeColour) {
        const colourScale = generateColorScale(themeColour);

        const colours = Object.values(colourScale).map(c => [c.r, c.g, c.b]);

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

        const targetColoursFailure = Object.values([
          colours[1],
          colours[6],
        ]);

        setAnimationDataTimeout(replaceAnimationColors(getColors(animationTimeout), targetColoursTimeout, animationTimeout));
        setAnimationDataError(replaceAnimationColors(getColors(animationError), targetColoursFailure, animationError));

        injectThemeColors(colourScale);
      }
    }, [themeColour]);

    // Trigger loaded state after mount
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 100); // Small delay for smooth fade-in

      return () => clearTimeout(timer);
    }, []);


    useEffect(() => {
      const timer = setTimeout(() => {
        setIsLoadedAnimation(true);
      }, 500); // Small delay for smooth fade-in

      return () => clearTimeout(timer);
    }, []);
  
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900 relative">
        {/* Error Screen Overlay */}
        <div 
          className={`fixed inset-0 flex items-center justify-center z-50 bg-gray-200 dark:bg-gray-900 transition-opacity duration-400 h-screen w-screen ${
            isLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="text-center">
            {/* Error Animation */}
            <div className={`relative mb-8 ${isLoaded ? 'animate-fadeInUp' : ''}`} 
                 style={{ animationDelay: isLoaded ? '0.1s' : '0s' }}>
              <div className="h-52 w-52 mx-auto flex items-center justify-center">
                {/* Status Code Display */}
                <div className="text-center">
                  {/* Animation placeholder - could be replaced with error-specific animation */}
                  {animationDataError && !expired_title && isLoadedAnimation && (
                    <div>
                      <Lottie
                        animationData={animationDataError}
                        loop={false}
                        autoplay
                      />
                    </div>
                  )}
                  {animationDataTimeout && expired_title && (
                    <div>
                      <Lottie
                        animationData={animationDataTimeout}
                        loop={true}
                        autoplay
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Text */}
            <div className={`space-y-4 px-4 ${isLoaded ? 'animate-fadeInUp' : ''}`}
                 style={{ animationDelay: isLoaded ? '0.2s' : '0s' }}>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {displayExpiredTitle}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                {displayExpiredMessage}
              </p>
            </div>

            {/* Logo at bottom */}
            <div className={`mt-12 ${isLoaded ? 'animate-fadeInUp' : ''}`}
                 style={{ animationDelay: isLoaded ? '0.3s' : '0s' }}>
              <img
                alt={displayClientName}
                src={displayImage}
                className="mx-auto h-12 w-auto opacity-60"
              />
            </div>

            <footer className={`${isLoaded ? 'animate-fadeInUp' : ''}`} style={{ 
              animationDelay: isLoaded ? '0.3s' : '0s' 
            }}>
              <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                <div className="text-center">
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
                    © 2025 Angel Charity Services. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    )
}


