import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['/'], description: 'Open search' },
      { keys: ['Esc'], description: 'Close dialogs' },
    ],
  },
  {
    title: 'Quick Actions',
    shortcuts: [
      { keys: ['⌘', 'N'], description: 'New expense' },
      { keys: ['⌘', 'H'], description: 'Go to habits' },
      { keys: ['⌘', ','], description: 'Open settings' },
    ],
  },
  {
    title: 'Mobile',
    shortcuts: [
      { keys: ['Swipe'], 'right': 'Go to previous page' },
      { keys: ['Swipe'], 'left': 'Go to next page' },
    ],
  },
];

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick reference for keyboard shortcuts and gestures
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="font-semibold text-sm mb-3">{group.title}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex gap-2">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="text-muted-foreground">+</span>}
                          <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground">
            💡 Pro tip: Press <kbd className="px-1.5 py-0.5 text-xs bg-background border border-border rounded">?</kbd> anywhere to show this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsHelp;
