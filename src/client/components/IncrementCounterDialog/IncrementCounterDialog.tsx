import { OldButton } from '../OldButton/OldButton';
import { Dialog } from '../Dialog/Dialog';
import styles from './IncrementCounterDialog.module.css';

interface IncrementCounterDialogProps {
    counter: number;
    isMyTurn: boolean;
    onIncrement: () => void;
    onClose: () => void;
    onOpenSettings: () => void;
}

export function IncrementCounterDialog({ counter, isMyTurn, onIncrement, onClose, onOpenSettings }: IncrementCounterDialogProps) {
    return (
        <Dialog title="Increment Counter" onClose={onClose}>
            <div className={styles.content}>
                <div className={styles.row}>
                    <span>Counter:</span> 
                    <strong>{counter}</strong>
                </div>
                <OldButton 
                    onClick={onIncrement} 
                    variant="primary" 
                    disabled={!isMyTurn} 
                    fullWidth={true}
                >
                    Increment
                </OldButton>
            </div>
            <div className={styles.footer}>
                <OldButton onClick={onOpenSettings} variant="link">Game Settings</OldButton>
            </div>
        </Dialog>
    );
} 