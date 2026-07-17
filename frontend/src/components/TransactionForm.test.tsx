import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionForm from './TransactionForm';
import type { Category, Transaction } from '../types';

const categories: Category[] = [
  { id: 'cat-1', name: 'Food', color: '#f97316', icon: '🍔', isDefault: true, userId: 'u1', createdAt: '2026-01-01' },
];

function renderForm(overrides: Partial<React.ComponentProps<typeof TransactionForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(
    <TransactionForm
      initial={null}
      categories={categories}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...overrides}
    />
  );
  return { onSubmit, onCancel };
}

describe('TransactionForm', () => {
  it('shows a validation error and does not call onSubmit when amount is missing', async () => {
    const { onSubmit } = renderForm();

    // Bypass native HTML5 required/min constraint validation on the number
    // input so we exercise the component's own amount <= 0 guard directly.
    fireEvent.submit(screen.getByRole('button', { name: /add transaction/i }).closest('form')!);

    expect(await screen.findByText(/amount must be greater than 0/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the entered data with amount parsed as a number', async () => {
    const { onSubmit } = renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('0.00'), '42.50');
    await user.type(screen.getByPlaceholderText(/grocery run/i), 'Coffee');
    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'EXPENSE',
        amount: 42.5,
        description: 'Coffee',
        categoryId: null,
      })
    );
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const { onCancel } = renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('pre-fills fields and shows "Save Changes" when editing an existing transaction', () => {
    const initial: Transaction = {
      id: 't1', amount: 99.99, type: 'INCOME', description: 'Freelance', date: '2026-05-01',
      userId: 'u1', categoryId: null, category: null, receiptBlobName: null,
      createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z',
    };
    renderForm({ initial });

    expect(screen.getByDisplayValue('99.99')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Freelance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('surfaces the server error message when onSubmit rejects', async () => {
    const onSubmit = vi.fn().mockRejectedValue({ response: { data: { error: 'Server exploded' } } });
    render(
      <TransactionForm initial={null} categories={categories} onSubmit={onSubmit} onCancel={vi.fn()} />
    );
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('0.00'), '10');
    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
  });
});
