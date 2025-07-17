import { StyleColor } from '../../../types/ui';
import { Button, IconPosition } from './Button';

// Test component to demonstrate responsive button behavior
export function ButtonTest() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Button Responsive Test</h2>

      <div>
        <h3>Standard Button (always shows text)</h3>
        <Button color={StyleColor.AMBER} icon='play' onClick={() => {}}>
          End Turn
        </Button>
      </div>

      <div>
        <h3>Responsive Button (icon-only on mobile, text on larger screens)</h3>
        <Button color={StyleColor.AMBER} icon='play' responsive={true} onClick={() => {}}>
          End Turn
        </Button>
      </div>

      <div>
        <h3>Icon-Only Button (always square)</h3>
        <Button color={StyleColor.DEFAULT} icon='menu' onClick={() => {}} ariaLabel='Menu' />
      </div>

      <div>
        <h3>Responsive Button with Right Icon</h3>
        <Button
          color={StyleColor.GREEN}
          icon='check'
          iconPosition={IconPosition.RIGHT}
          responsive={true}
          onClick={() => {}}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}
