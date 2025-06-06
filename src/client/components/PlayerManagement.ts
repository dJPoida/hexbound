import { h } from 'preact';
import htm from 'htm';

const html = htm.bind(h);

interface PlayerManagementProps {
  styles: { [key: string]: string }; // From App.module.css
  playerNameInput: string;
  onPlayerNameInputChange: (name: string) => void;
  onSaveNameAndPlay: () => void;
  isLoadingAuth: boolean;
  authError: string | null;
}

export function PlayerManagement({ 
  styles, 
  playerNameInput, 
  onPlayerNameInputChange, 
  onSaveNameAndPlay, 
  isLoadingAuth, 
  authError 
}: PlayerManagementProps) {
  
  const handleInput = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      onPlayerNameInputChange(event.target.value);
    }
  };

  const handleSubmit = (event: Event) => {
    event.preventDefault(); // Prevent default form submission if wrapped in a form
    onSaveNameAndPlay();
  };

  return html`
    <div class=${styles.playerManagementContainer}>
      <form class=${styles.loginForm} onSubmit=${handleSubmit}>
        <h2 class=${styles.loginTitle}>Join the Game</h2>
        <p class=${styles.loginSubtitle}>Enter your name to begin your adventure in Hexbound.</p>
        
        <div class=${styles.inputGroup}>
          <label htmlFor="playerNameInput" class=${styles.label}>Player Name</label>
          <input 
            type="text" 
            id="playerNameInput" 
            class=${styles.input}
            value=${playerNameInput} 
            onInput=${handleInput} 
            disabled=${isLoadingAuth}
            placeholder="e.g., Aragorn"
          />
        </div>

        <button 
          class=${`${styles.button} ${styles.loginButton}`}
          id="saveNameButton" 
          type="submit"
          disabled=${isLoadingAuth}
        >
          ${isLoadingAuth ? 'Entering...' : 'Save Name & Play'}
        </button>

        ${authError && html`<p class=${styles.authError}>${authError}</p>`}
        ${isLoadingAuth && html`<div class=${styles.loadingIndicator}>Verifying...</div>`}
      </form>
    </div>
  `;
} 