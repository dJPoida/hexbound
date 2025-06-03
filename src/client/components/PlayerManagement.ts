import { h } from 'preact';
import htm from 'htm';

const html = htm.bind(h);

// Props type for PlayerManagement component
interface PlayerManagementProps {
  styles: { [key: string]: string }; // From App.module.css
  // We will add state and handlers here later, e.g.:
  // playerName: string;
  // onPlayerNameChange: (name: string) => void;
  // onSaveName: () => void;
  // loggedInPlayerName: string | null;
  // onLogout: () => void;
}

export function PlayerManagement({ styles }: PlayerManagementProps) {
  return html`
    <div id="playerManagement">
      <div id="nameInputSection">
        <label htmlFor="playerNameInput">Enter Your Name:</label>
        <input type="text" id="playerNameInput" />
        <button class=${styles.button} id="saveNameButton">Save Name & Play</button>
      </div>
      <p id="loadingPlayerMessage" style=${{ display: 'none' }}>Loading your details...</p>
      <div id="loggedInSection" style=${{ display: 'none' }}>
        <p>Logged in as: <strong id="loggedInPlayerName"></strong></p>
        <button class=${styles.button} id="logoutButton">Logout</button>
      </div>
    </div>
  `;
} 