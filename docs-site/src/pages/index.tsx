import React, { JSX } from 'react';
import {Redirect} from '@docusaurus/router';

export default function HomePage(): JSX.Element {
  return <Redirect to="/docs/" />;
} 