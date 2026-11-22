import '@fontsource/inter';
import '../src/styles.css';
import React from 'react';
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        showName: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme;
      return (
        // Removed min-h-screen, just keeping padding (p-8) and background colors
        <div className={theme === 'dark' ? 'dark p-8 bg-background text-foreground' : 'p-8 bg-background text-foreground'}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;