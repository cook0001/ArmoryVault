/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RangeSessionModal } from './RangeSessionModal';
import { expect, test, describe, vi } from 'vitest';

describe('RangeSessionModal Component', () => {
  test('renders modal when open', async () => {
    render(
      <RangeSessionModal
        isOpen={true}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('Log Range Session')).toBeDefined();
    expect(screen.getByText('Save & Log Range Trip')).toBeDefined();
  });

  test('populates firearms and submits range session', async () => {
    const onSavedMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <RangeSessionModal
        isOpen={true}
        onClose={onCloseMock}
        onSaved={onSavedMock}
      />
    );

    // Wait for firearm options to load
    await waitFor(() => {
      expect(screen.getByText(/Glock/i)).toBeDefined();
    });

    const submitBtn = screen.getByText('Save & Log Range Trip');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSavedMock).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
