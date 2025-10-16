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

  useEffect(() => {
    // Apply theme from localStorage
    document.body.classList.remove(...themes.map((t) => t.class).filter(Boolean));
    if (theme) document.body.classList.add(theme);

  }, [theme]);

  return children({
    theme,
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
            title={pageComponent.props?.title || 'Angel Gifts'}
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