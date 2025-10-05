import React from 'react';
import { Head } from '@inertiajs/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function BaseLayout({ 
  children, 
  title = 'Angel Charity Services',
  theme, 
  mode, 
  handleSetTheme, 
  handleSetMode,
  handleSetDarkTheme 
}) {
  return (
    <>
      <Head title={title} />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Pass theme and mode props to children */}
        {React.cloneElement(children, {
          theme,
          mode,
          handleSetTheme,
          handleSetMode,
          handleSetDarkTheme
        })}
        
        {/* Toast notifications */}
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
          theme={mode === 'dark' ? 'dark' : 'light'}
        />
      </div>
    </>
  );
}