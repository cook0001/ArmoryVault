/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RecoveryKeyModal } from './RecoveryKeyModal';
import { expect, test, describe, vi, beforeEach } from 'vitest';

describe('RecoveryKeyModal Component', () => {
  beforeEach(() => {
    window.api = {
      ...window.api,
      getRecoveryCode: vi.fn().mockResolvedValue('test-64-character-recovery-code-abcdef1234567890abcdef1234567890'),
      regenerateRecoveryKey: vi.fn().mockResolvedValue({
        success: true,
        newRecoveryCode: 'new-regenerated-64-character-recovery-code-9876543210fedcba9876543210'
      })
    } as any;
  });

  test('renders recovery key when open', async () => {
    render(<RecoveryKeyModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Emergency Recovery Key')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('test-64-character-recovery-code-abcdef1234567890abcdef1234567890')).toBeDefined();
    });

    expect(screen.getByText('Copy Recovery Key')).toBeDefined();
    expect(screen.getByText('Download .txt Backup')).toBeDefined();
  });

  test('opens regenerate confirmation and submits current password to re-key', async () => {
    render(<RecoveryKeyModal isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Regenerate Key')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Regenerate Key'));

    expect(screen.getByText('Confirm Vault Re-Keying')).toBeDefined();
    const passInput = screen.getByPlaceholderText('Master Password');
    fireEvent.change(passInput, { target: { value: 'myPassword123' } });

    const confirmBtn = screen.getByText('Confirm & Re-Key');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(window.api.regenerateRecoveryKey).toHaveBeenCalledWith('myPassword123');
      expect(screen.getByText('Vault Re-Keyed Successfully!')).toBeDefined();
      expect(screen.getByText('new-regenerated-64-character-recovery-code-9876543210fedcba9876543210')).toBeDefined();
    });
  });
});
