import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import htm from 'htm';
import { authService } from '../services/auth.service';
import styles from './UserLogin.module.css';
import { Logo } from './Logo/Logo';
import { Button } from './Button/Button';

const html = htm.bind(h);

interface UserLoginProps {
  userNameInput: string;
  onUserNameInputChange: (name: string) => void;
  onLogin: () => void;
  isLoading: boolean;
  error: string | null;
}

export function UserLogin({
  userNameInput,
  onUserNameInputChange,
  onLogin,
  isLoading,
  error,
}: UserLoginProps) {
  useEffect(() => {
    const savedUserName = authService.getUserName();
    if (savedUserName) {
      onUserNameInputChange(savedUserName);
    }
  }, []);

  const handleInput = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      onUserNameInputChange(event.target.value);
    }
  };

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    onLogin();
  };

  const userNameInputId = 'userNameInput';

  return html`
    <div class=${styles.playerManagementContainer}>
      <form class=${styles.loginForm} onSubmit=${handleSubmit}>
        ${h(Logo, { size: 'medium' })}
        <p class=${styles.loginSubtitle}>Enter your name to begin your journey.</p>
        
        <div class=${styles.inputGroup}>
          <label htmlFor=${userNameInputId} class=${styles.label}>Player Name</label>
          <input 
            type="text" 
            id=${userNameInputId}
            class=${styles.input}
            value=${userNameInput} 
            onInput=${handleInput} 
            disabled=${isLoading}
            placeholder="e.g., Aragorn"
            maxLength="20"
          />
        </div>

        ${h(Button, {
          onClick: onLogin,
          variant: 'primary',
          disabled: isLoading,
          children: isLoading ? 'Logging in...' : 'Play',
        })}

        ${error && html`<p class=${styles.authError}>${error}</p>`}
        ${isLoading && html`<div class=${styles.loadingIndicator}>Verifying...</div>`}
      </form>
    </div>
  `;
}