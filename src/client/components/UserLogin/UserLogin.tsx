import { useEffect } from 'preact/hooks';
import { JSX } from 'preact/jsx-runtime';
import { authService } from '../../services/auth.service';
import styles from './UserLogin.module.css';
import { Logo } from '../Logo/Logo';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';

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

  const handleInput = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    onUserNameInputChange(event.currentTarget.value);
  };

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    onLogin();
  };

  const userNameInputId = 'userNameInput';

  return (
    <div className={styles.loginForm}>
      <form onSubmit={handleSubmit}>
        <Logo />
        <p className={styles.loginSubtitle}>Enter your name to begin your journey.</p>
        
        <div className={styles.inputGroup}>
          <label htmlFor={userNameInputId} className={styles.label}>Player Name</label>
          <Input
            type="text"
            id={userNameInputId}
            value={userNameInput}
            onInput={handleInput}
            disabled={isLoading}
            placeholder="e.g., Aragorn"
            maxLength={20}
          />
        </div>

        <Button
          onClick={onLogin}
          variant="primary"
          disabled={isLoading}
          fullWidth={true}
          className={styles.loginButton}
        >
          {isLoading ? 'Logging in...' : 'Play'}
        </Button>

        {error && <p className={styles.authError}>{error}</p>}
        {isLoading && <div className={styles.loadingIndicator}>Verifying...</div>}
      </form>
    </div>
  );
} 