import htm from 'htm';
import { h } from 'preact';
import { useState } from 'preact/hooks';

import { authenticatedFetch } from '../../../services/api.service';
import { Button, ButtonVariant } from '../../ui/Button';
import styles from './UtilsPage.module.css';

const html = htm.bind(h);

export function UtilsPage() {
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
      <h1 class=${styles.title}>Developer Utilities</h1>
      <p class=${styles.subtitle}>Use these tools to manage the development environment.</p>
      
      <div class=${styles.card}>
        <h2 class=${styles.cardTitle}>Game Data Management</h2>
        <p class=${styles.cardDescription}>
          This will permanently delete all games, player associations, and game states from both the Postgres database and the Redis cache.
        </p>
        <${Button} 
          onClick=${handleResetData} 
          disabled=${isLoading}
          variant=${ButtonVariant.RED}
        >
          ${isLoading ? 'Resetting...' : 'Reset All Game Data'}
        </${Button}>

        ${message && html`<p class=${styles.successMessage}>${message}</p>`}
        ${error && html`<p class=${styles.errorMessage}>${error}</p>`}
      </div>
    </div>
  `;
} 