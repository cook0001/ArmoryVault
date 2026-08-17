/**
 * @vitest-environment jsdom
 */
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

    expect(screen.getByLabelText('Make')).toBeDefined();
    expect(screen.getByLabelText('Model')).toBeDefined();
    expect(screen.getAllByRole('button', { name: /save firearm/i }).length).toBeGreaterThan(0);
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

    const submitBtns = screen.getAllByRole('button', { name: /save firearm/i });
    fireEvent.click(submitBtns[0]);

    await waitFor(() => {
      expect(window.api.addFirearm).toHaveBeenCalledWith(expect.objectContaining({
        make: 'Smith & Wesson',
        model: 'M&P 9',
      }));
    });
  });

  test('submits vintage and collectible firearm with C&R type and condition', async () => {
    render(
      <MemoryRouter>
        <FirearmForm />
      </MemoryRouter>
    );

    const makeInput = screen.getByLabelText('Make');
    const modelInput = screen.getByLabelText('Model');
    const caliberInput = screen.getByLabelText('Caliber');
    const typeInput = screen.getByLabelText('Type');
    const conditionInput = screen.getByLabelText('Condition');

    await userEvent.type(makeInput, 'Winchester');
    await userEvent.type(modelInput, 'Model 1895');
    await userEvent.type(caliberInput, '.30-06 Springfield');
    await userEvent.type(typeInput, 'Curio & Relic (C&R) Rifle');
    await userEvent.type(conditionInput, 'NRA Fine (90-95%)');

    const submitBtns = screen.getAllByRole('button', { name: /save firearm/i });
    fireEvent.click(submitBtns[0]);

    await waitFor(() => {
      expect(window.api.addFirearm).toHaveBeenCalledWith(expect.objectContaining({
        make: 'Winchester',
        model: 'Model 1895',
        caliber: '.30-06 Springfield',
        firearm_type: 'Curio & Relic (C&R) Rifle',
        condition: 'NRA Fine (90-95%)'
      }));
    });
  });
});

