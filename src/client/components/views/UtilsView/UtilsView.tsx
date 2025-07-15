import htm from 'htm';
import { h } from 'preact';
import { useState } from 'preact/hooks';

import { authenticatedFetch } from '../../../services/api.service';
import { Button, ButtonVariant, StyleColor } from '../../ui/Button';
import { Heading } from '../../ui/Typography/Heading';
import { Text } from '../../ui/Typography/Text';
import styles from './UtilsView.module.css';

const html = htm.bind(h);

export function UtilsView() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetData = async () => {
    if (!window.confirm('Are you sure you want to delete ALL game data from Postgres and Redis? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await authenticatedFetch('/api/utils/reset-game-data', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.message || 'An unknown error occurred.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return html`
    <div class=${styles.utilsContainer}>
      <${Heading} level=${1} variant="pageTitle">Developer Utilities</${Heading}>
      <${Text} variant="body">Use these tools to manage the development environment.</${Text}>
      
      <div class=${styles.card}>
        <${Heading} level=${2} variant="sectionHeader">Game Data Management</${Heading}>
        <${Text} variant="body">
          This will permanently delete all games, player associations, and game states from both the Postgres database and the Redis cache.
        </${Text}>
        <${Button} 
          onClick=${handleResetData} 
          disabled=${isLoading}
          variant=${ButtonVariant.STANDARD}
          color=${StyleColor.RED}
        >
          ${isLoading ? 'Resetting...' : 'Reset All Game Data'}
        </${Button}>

        ${message && html`<${Text} color="success">${message}</${Text}>`}
        ${error && html`<${Text} color="danger">${error}</${Text}>`}
      </div>
    </div>
  `;
} 