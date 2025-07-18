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
    'About', // Single page above the category
    {
      type: 'category',
      label: 'Gameplay',
      collapsed: false,
      items: [
        'Gameplay/Terrain',
        'Gameplay/Towns',
        'Gameplay/Orders',
        'Gameplay/Elevation',
        'Gameplay/Fog of War',
        'Gameplay/Units',
        'Gameplay/Unit Movement',
        'Gameplay/Combat',
        'Gameplay/Resources',
        'Gameplay/Town Improvements',
        'Gameplay/Tech Tree',
        'Gameplay/Spitballing Ideas',
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
        'Technical/Map Generation',
        'Technical/AI Prompt Language',
        'Technical/Hex Grid Perspective Details',
        'Technical/Tile Adjacency',
      ],
    },
  ],
};

export default sidebars; 