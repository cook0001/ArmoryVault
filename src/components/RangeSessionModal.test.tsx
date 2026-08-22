/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { RangeSessionModal } from './RangeSessionModal';

describe('RangeSessionModal Component', () => {
  test('renders modal when open', async () => {
    render(<RangeSessionModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Log Range Session')).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText('Save & Log Range Trip')).toBeDefined();
    });
  });

  test('populates firearms and submits range session', async () => {
    const onSavedMock = vi.fn();
    const onCloseMock = vi.fn();

    render(<RangeSessionModal isOpen={true} onClose={onCloseMock} onSaved={onSavedMock} />);

    // Wait for firearm options to load
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Glock/i)).toBeDefined();
    });

    const submitBtn = screen.getByText('Save & Log Range Trip');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSavedMock).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
