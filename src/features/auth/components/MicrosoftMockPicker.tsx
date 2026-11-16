import { Button } from '@/shared/ui';
import { MOCK_MICROSOFT_ACCOUNTS } from './mock-microsoft-accounts';
import styles from './MicrosoftMockPicker.module.css';

type MicrosoftMockPickerProps = {
  onPick: (email: string) => void;
  disabled?: boolean;
};

/** Aparece só com VITE_ENABLE_MOCKS=true, no lugar da tela de login da Microsoft. */
export function MicrosoftMockPicker({ onPick, disabled }: MicrosoftMockPickerProps) {
  return (
    <div className={styles.panel} role="group" aria-label="Simulação do login Microsoft">
      <p className={styles.title}>Modo de desenvolvimento: escolha a conta Microsoft simulada.</p>
      <ul className={styles.list}>
        {MOCK_MICROSOFT_ACCOUNTS.map((account) => (
          <li key={account.email}>
            <Button
              variant="secondary"
              size="small"
              fullWidth
              disabled={disabled}
              onClick={() => onPick(account.email)}
            >
              {account.label}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
