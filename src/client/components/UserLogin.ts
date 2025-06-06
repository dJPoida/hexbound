import { h } from 'preact';
import htm from 'htm';

const html = htm.bind(h);

interface UserLoginProps {
  styles: Record<string, string>;
  userNameInput: string;
  onUserNameInputChange: (name: string) => void;
  onLogin: () => void;
  isLoading: boolean;
  error: string | null;
}

export function UserLogin({
  styles,
  userNameInput,
  onUserNameInputChange,
  onLogin,
  isLoading,
  error,
}: UserLoginProps) {
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
        <h1 class=${styles.loginTitle}>Hexbound</h1>
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

        <button 
          class=${`${styles.button} ${styles.loginButton}`}
          type="submit"
          disabled=${isLoading}
        >
          ${isLoading ? 'Logging in...' : 'Play'}
        </button>

        ${error && html`<p class=${styles.authError}>${error}</p>`}
        ${isLoading && html`<div class=${styles.loadingIndicator}>Verifying...</div>`}
      </form>
    </div>
  `;
}