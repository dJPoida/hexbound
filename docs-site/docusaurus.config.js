// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Hexbound Documentation',
  tagline: 'Game Design & Development Documentation',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://hexbound.game-host.org',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'hexbound', // Usually your GitHub org/user name.
  projectName: 'hexbound-docs', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Path to the docs folder relative to the site directory
          path: '../docs',
          // Disable edit links
          editUrl: undefined,
        },
        blog: false, // Disable blog for now
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/hexbound-social-card.jpg',
      navbar: {
        title: 'Hexbound',
        logo: {
          alt: 'Hexbound Logo',
          src: 'img/hexbound-logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Gameplay',
          },
          {
            type: 'docSidebar',
            sidebarId: 'technicalSidebar',
            position: 'left',
            label: 'Technical',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'About',
                to: '/',
              },
              {
                label: 'Gameplay',
                to: '/docs/Gameplay/Terrain',
              },
              {
                label: 'Technical',
                to: '/docs/Technical/Map%20Generation',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Hexbound.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: true, // Disable dark mode for now to focus on medieval theme
        respectPrefersColorScheme: false,
      },
    }),
};

export default config; 