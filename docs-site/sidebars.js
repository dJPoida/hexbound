/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // Wiki sidebar - organized by the alphabetical prefixes in your files
  tutorialSidebar: [
    'about', // Single page above the category
    {
      type: 'category',
      label: 'Gameplay',
      collapsed: false,
      items: [
        'gameplay/Terrain',
        'gameplay/Towns',
        'gameplay/Orders',
        'gameplay/Elevation',
        'gameplay/Fog of War',
        'gameplay/Units',
        'gameplay/Unit Movement',
        'gameplay/Combat',
        'gameplay/Resources',
        'gameplay/Town Improvements',
        'gameplay/Tech Tree',
        'gameplay/Spitballing Ideas',
      ],
    },
  ],

  // Technical sidebar
  technicalSidebar: [
    {
      type: 'category',
      label: 'Technical Documentation',
      collapsed: false,
      items: [
        'technical/Map Generation',
        'technical/AI Prompt Language',
        'technical/Hex Grid Perspective Details',
      ],
    },
  ],
};

export default sidebars; 