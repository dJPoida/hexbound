import { Button, StyleColor } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog/Dialog';
import { Text } from '../../ui/Typography/Text';
import styles from './IncrementCounterDialog.module.css';

interface IncrementCounterDialogProps {
    counter: number;
    isMyTurn: boolean;
    onIncrement: () => void;
    onClose: () => void;
    hasPlaceholders: boolean;
}

export function IncrementCounterDialog({ counter, isMyTurn, onIncrement, onClose, hasPlaceholders }: IncrementCounterDialogProps) {
    const canIncrement = isMyTurn && !hasPlaceholders;
    
    return (
        <Dialog title="Increment Counter" onClose={onClose}>
            <div className={styles.content}>
                <div className={styles.row}>
                    <Text as="span">Counter:</Text> 
                    <Text as="span" font="bold">{counter}</Text>
                </div>
                <Button 
                    onClick={onIncrement} 
                    color={StyleColor.AMBER}
                    disabled={!canIncrement} 
                    fullWidth={true}
                >
                    Increment
                </Button>
            </div>
        </Dialog>
    );
} 