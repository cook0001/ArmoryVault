/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChangePasswordModal } from './ChangePasswordModal';
import { expect, test, describe, vi, beforeEach } from 'vitest';

describe('ChangePasswordModal Component', () => {
  beforeEach(() => {
    window.api = {
      ...window.api,
      changePassword: vi.fn().mockResolvedValue({ success: true, message: 'Password changed!' }),
      getRecoveryCode: vi.fn().mockResolvedValue('test-recovery-code-64-characters-long-example-1234567890abcdef')
    } as any;
  });

  test('renders modal when open', () => {
    render(<ChangePasswordModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Change Master Password')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter current password')).toBeDefined();
    expect(screen.getByPlaceholderText('At least 8 characters')).toBeDefined();
    expect(screen.getByPlaceholderText('Re-enter new password')).toBeDefined();
  });

  test('validates minimum password length and matching passwords', async () => {
    render(<ChangePasswordModal isOpen={true} onClose={() => {}} />);

    const currentInput = screen.getByPlaceholderText('Enter current password');
    const newInput = screen.getByPlaceholderText('At least 8 characters');
    const confirmInput = screen.getByPlaceholderText('Re-enter new password');
    const submitBtn = screen.getByRole('button', { name: /update password/i });

    // Short password (< 8 chars)
    fireEvent.change(currentInput, { target: { value: 'oldPass123' } });
    fireEvent.change(newInput, { target: { value: 'short' } });
    fireEvent.change(confirmInput, { target: { value: 'short' } });
    expect(submitBtn).toBeDisabled();

    // Mismatched passwords
    fireEvent.change(newInput, { target: { value: 'ValidPass123' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPass123' } });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText('Passwords do not match')).toBeDefined();

    // Matching valid passwords (>= 8 chars)
    fireEvent.change(confirmInput, { target: { value: 'ValidPass123' } });
    expect(submitBtn).not.toBeDisabled();
    expect(screen.getByText('Passwords match')).toBeDefined();
  });

  test('submits password change and triggers API', async () => {
    render(<ChangePasswordModal isOpen={true} onClose={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'currentPass123' } });
    fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), { target: { value: 'newSecurePass456' } });
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), { target: { value: 'newSecurePass456' } });

    const submitBtn = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(window.api.changePassword).toHaveBeenCalledWith('currentPass123', 'newSecurePass456');
    });
  });

  test('displays error message if changePassword fails', async () => {
    window.api.changePassword = vi.fn().mockResolvedValue({ success: false, error: 'Current password is incorrect.' });

    render(<ChangePasswordModal isOpen={true} onClose={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'wrongOldPass' } });
    fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), { target: { value: 'newSecurePass456' } });
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), { target: { value: 'newSecurePass456' } });

    const submitBtn = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect.')).toBeDefined();
    });
  });
});
