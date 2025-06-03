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
    <div id="playerManagement">
      <div id="nameInputSection">
        <label htmlFor="playerNameInput">Enter Your Name:</label>
        <input 
          type="text" 
          id="playerNameInput" 
          value=${playerNameInput} 
          onInput=${handleInput} 
          disabled=${isLoadingAuth} 
        />
        <button 
          class=${styles.button} 
          id="saveNameButton" 
          onClick=${handleSubmit} 
          disabled=${isLoadingAuth}
        >
          ${isLoadingAuth ? 'Logging in...' : 'Save Name & Play'}
        </button>
      </div>
      ${isLoadingAuth && html`<p id="loadingPlayerMessage">Loading your details...</p>`}
      ${authError && html`<p style=${{ color: 'red' }}>Error: ${authError}</p>`}
    </div>
  `;
} 