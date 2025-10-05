import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import BaseLayout from './Layouts/BaseLayout';

const themes = [
  { name: 'Cyan', class: '', color: '6 182 212' },
  { name: 'Orange', class: 'theme-orange', color: '249 115 22' }, // default
  { name: 'Olive', class: 'theme-olive', color: '195 207 33' },
  { name: 'Blue', class: 'theme-blue', color: '37 99 235' },
  { name: 'Purple', class: 'theme-purple', color: '139 92 246' },
  { name: 'Green', class: 'theme-green', color: '16 185 129' },
  { name: 'Pink', class: 'theme-pink', color: '236 72 153' },
];

function AppWrapper({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme-2') || '');
  const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem('darkTheme') || '');
  const [mode, setMode] = useState(() => localStorage.getItem('mode') || 'light');

  useEffect(() => {
    // Apply theme from localStorage
    document.body.classList.remove(...themes.map((t) => t.class).filter(Boolean));
    if (theme) document.body.classList.add(theme);

    // document.body.classList.remove(darkTheme).filter(Boolean);
    if (darkTheme) document.body.classList.add(darkTheme);
    else document.body.classList.remove('theme-dark-slate');

    // Apply mode from localStorage
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, mode, darkTheme]);

  const handleSetTheme = (themeClass) => {
    document.documentElement.classList.add('disable-transitions');
    
    document.body.classList.remove(...themes.map((t) => t.class).filter(Boolean));
    if (themeClass) document.body.classList.add(themeClass);
    localStorage.setItem('theme', themeClass);
    setTheme(themeClass);

    setTimeout(() => {
      document.documentElement.classList.remove('disable-transitions');
    }, 0);
  };

  const handleSetMode = (newMode) => {
    document.documentElement.classList.add('disable-transitions');

    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mode', newMode);
    setMode(newMode);

    setTimeout(() => {
      document.documentElement.classList.remove('disable-transitions');
    }, 0);
  };

  const handleSetDarkTheme = (darkThemeClass) => {
    document.documentElement.classList.add('disable-transitions');

    if (darkThemeClass) document.body.classList.add(darkThemeClass);
    else document.body.classList.remove('theme-dark-slate');
    localStorage.setItem('darkTheme', darkThemeClass);
    setDarkTheme(darkThemeClass);

    setTimeout(() => {
      document.documentElement.classList.remove('disable-transitions');
    }, 0);
  }

  return children({
    theme,
    mode,
    handleSetTheme,
    handleSetMode,
    handleSetDarkTheme,
  });
}

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
    let page = pages[`./Pages/${name}.jsx`];

    // Set up the layout for all pages
    page.default.layout = (pageComponent) => (
      <AppWrapper>
        {({ theme, mode, handleSetTheme, handleSetMode, handleSetDarkTheme }) => (
          <BaseLayout
            theme={theme}
            mode={mode}
            handleSetTheme={handleSetTheme}
            handleSetMode={handleSetMode}
            handleSetDarkTheme={handleSetDarkTheme}
            title={pageComponent.props?.title || 'Angel Charity Services'}
          >
            {pageComponent}
          </BaseLayout>
        )}
      </AppWrapper>
    );

    return page;
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <Router>
        <App {...props} />
      </Router>
    );
  },
});