import { StyleColor } from '../../../types/ui';
import { Button } from '../Button';
import { Icon } from '../Icon/Icon';
import { Text } from '../Typography/Text';
import styles from './AppHeader.module.css';

export interface GameResourcesProps {
  counter?: number | null;
  onToggleCounterDialog?: () => void;
}

export function GameResources({ counter, onToggleCounterDialog }: GameResourcesProps) {
  return (
    <div className={styles.resources}>
      <div className={styles.resourceItem}>
        <Icon name='dollar-sign' />
        <Text variant='label' font='bold' as='span'>
          1,234
        </Text>
      </div>
      <div className={styles.resourceItem}>
        <Icon name='star' />
        <Text variant='label' font='bold' as='span'>
          567
        </Text>
      </div>
      <div className={styles.resourceItem}>
        <Icon name='smile' />
        <Text variant='label' font='bold' as='span'>
          {counter ?? 0}
        </Text>
        {/* Temporary button to edit the counter */}
        {onToggleCounterDialog && (
          <>
            <span>&nbsp;</span>
            <Button
              onClick={onToggleCounterDialog}
              color={StyleColor.WHITE}
              icon='edit'
              ariaLabel='Edit counter'
            />
          </>
        )}
      </div>
    </div>
  );
}
