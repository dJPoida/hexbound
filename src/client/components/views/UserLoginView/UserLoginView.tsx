import { useEffect } from 'preact/hooks';
import { JSX } from 'preact/jsx-runtime';

import { authService } from '../../../services/auth.service';
import { Button, ButtonVariant, StyleColor } from '../../ui/Button';
import { Input, InputType } from '../../ui/Input';
import { Logo } from '../../ui/Logo/Logo';
import { Text } from '../../ui/Typography/Text';
import styles from './UserLoginView.module.css';

interface UserLoginProps {
  userNameInput: string;
  onUserNameInputChange: (name: string) => void;
  onLogin: () => void;
  isLoading: boolean;
  error: string | null;
}

export function UserLoginView({
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
        <Text variant="body" color="subtle" class={styles.loginSubtitle}>Enter your name to begin your journey.</Text>
        
        <div className={styles.inputGroup}>
          <label htmlFor={userNameInputId} className={styles.label}>
            <Text variant="label" as="span">Player Name</Text>
          </label>
          <Input
            type={InputType.TEXT}
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
          variant={ButtonVariant.STANDARD}
          color={StyleColor.AMBER}
          disabled={isLoading}
          fullWidth={true}
          className={styles.loginButton}
        >
          {isLoading ? 'Logging in...' : 'Play'}
        </Button>

        {error && <Text variant="caption" color="danger" class={styles.authError}>{error}</Text>}
        {isLoading && <Text variant="caption" color="subtle" class={styles.loadingIndicator}>Verifying...</Text>}
      </form>
    </div>
  );
} 