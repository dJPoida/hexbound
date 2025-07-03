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
        'gameplay/terrain',
        'gameplay/towns',
        'gameplay/orders',
        'gameplay/elevation',
        'gameplay/fog-of-war',
        'gameplay/units',
        'gameplay/unit-movement',
        'gameplay/combat',
        'gameplay/resources',
        'gameplay/town improvements',
        'gameplay/tech-tree',
        'gameplay/spitballing-ideas',
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
        'technical/map-gen',
      ],
    },
  ],
};

export default sidebars; 