import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { FirearmForm } from './FirearmForm';
import { expect, test, describe, vi } from 'vitest';

describe('FirearmForm Component', () => {
  test('renders form fields', () => {
    render(
      <MemoryRouter>
        <FirearmForm />
      </MemoryRouter>
    );
    
    expect(screen.getByLabelText('Make')).toBeInTheDocument();
    expect(screen.getByLabelText('Model')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save firearm/i })).toBeInTheDocument();
  });

  test('submits form with correct data', async () => {
    render(
      <MemoryRouter>
        <FirearmForm />
      </MemoryRouter>
    );

    const makeInput = screen.getByLabelText('Make');
    const modelInput = screen.getByLabelText('Model');

    await userEvent.type(makeInput, 'Smith & Wesson');
    await userEvent.type(modelInput, 'M&P 9');

    const submitBtn = screen.getByRole('button', { name: /save firearm/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(window.api.addFirearm).toHaveBeenCalledWith(expect.objectContaining({
        make: 'Smith & Wesson',
        model: 'M&P 9',
      }));
    });
  });
});
