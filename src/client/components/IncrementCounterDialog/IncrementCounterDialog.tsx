import { Button } from '../Button/Button';
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
                <Button 
                    onClick={onIncrement} 
                    variant="primary" 
                    disabled={!isMyTurn} 
                    fullWidth={true}
                >
                    Increment
                </Button>
            </div>
            <div className={styles.footer}>
                <Button onClick={onOpenSettings} variant="link">Game Settings</Button>
            </div>
        </Dialog>
    );
} 