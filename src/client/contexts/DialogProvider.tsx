import { ComponentChildren, createContext } from 'preact';
import { useContext, useState } from 'preact/hooks';

type DialogType = 'gameSettings' | 'incrementCounter' | 'debugInfo';

interface DialogContextType {
  // State
  dialogStack: DialogType[];

  // Actions
  pushDialog: (dialog: DialogType) => void;
  popDialog: () => void;
  replaceDialog: (dialog: DialogType) => void;
  clearDialogs: () => void;
  getCurrentDialog: () => DialogType | null;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialogs = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialogs must be used within a DialogProvider');
  }
  return context;
};

interface DialogProviderProps {
  children: ComponentChildren;
}

export const DialogProvider = ({ children }: DialogProviderProps) => {
  const [dialogStack, setDialogStack] = useState<DialogType[]>([]);

  const pushDialog = (dialog: DialogType) => {
    // Prevent pushing the same dialog if it's already at the top of the stack
    if (dialogStack[dialogStack.length - 1] === dialog) {
      return;
    }
    setDialogStack([...dialogStack, dialog]);
  };

  const popDialog = () => {
    setDialogStack(dialogStack.slice(0, -1));
  };

  const replaceDialog = (dialog: DialogType) => {
    setDialogStack([...dialogStack.slice(0, -1), dialog]);
  };

  const clearDialogs = () => {
    setDialogStack([]);
  };

  const getCurrentDialog = () => {
    return dialogStack[dialogStack.length - 1] || null;
  };

  const dialogValue: DialogContextType = {
    dialogStack,
    pushDialog,
    popDialog,
    replaceDialog,
    clearDialogs,
    getCurrentDialog,
  };

  return <DialogContext.Provider value={dialogValue}>{children}</DialogContext.Provider>;
};

// Export the DialogType for use in components
export type { DialogType };
