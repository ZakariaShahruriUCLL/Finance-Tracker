import { useState, useEffect, type FormEvent, type CSSProperties } from 'react';
import Layout from '../components/Layout';
import CategoriesSkeleton from '../components/CategoriesSkeleton';
import { categoriesApi } from '../api/categories';
import type { Category } from '../types';
import { glassCard, glassCardSubtle, glassInput, glassButton, primaryButton, dangerButton } from '../styles/glass';

const inputStyle: CSSProperties = { ...glassInput, padding: '9px 12px', fontSize: 14 };

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [newIcon, setNewIcon] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');

  async function fetchCategories() {
    try {
      const { data } = await categoriesApi.list();
      setCategories(data.categories);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCategories(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      await categoriesApi.create({ name: newName.trim(), color: newColor, icon: newIcon.trim() || null });
      setNewName(''); setNewColor('#6366f1'); setNewIcon('');
      fetchCategories();
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCreateError((err as any)?.response?.data?.error ?? 'Failed to create category');
    } finally {
      setCreating(false);
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id); setEditName(c.name); setEditColor(c.color); setEditIcon(c.icon ?? '');
  }

  async function handleUpdate(id: string) {
    try {
      await categoriesApi.update(id, { name: editName.trim(), color: editColor, icon: editIcon.trim() || null });
      setEditingId(null);
      fetchCategories();
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      alert((err as any)?.response?.data?.error ?? 'Update failed');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this category? Transactions will become uncategorised.')) return;
    try {
      await categoriesApi.remove(id);
      fetchCategories();
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      alert((err as any)?.response?.data?.error ?? 'Delete failed');
    }
  }

  const predefined = categories.filter((c) => c.isDefault);
  const custom = categories.filter((c) => !c.isDefault);
  const labelStyle: CSSProperties = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 };

  return (
    <Layout>
      <h1 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Categories</h1>

      <div style={{ ...glassCardSubtle, padding: 22, marginBottom: 32 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>Add Custom Category</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input style={{ ...inputStyle, width: 180 }} placeholder="e.g. Gym" value={newName}
              onChange={(e) => setNewName(e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle}>Icon (emoji)</label>
            <input style={{ ...inputStyle, width: 80 }} placeholder="🏋️" value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)} maxLength={4} />
          </div>
          <div>
            <label style={labelStyle}>Color</label>
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
              style={{ width: 48, height: 38, border: '1px solid var(--glass-border-strong)', borderRadius: 8,
                       cursor: 'pointer', padding: 2, background: 'var(--glass-input-bg)' }} />
          </div>
          <button type="submit" disabled={creating} style={{ ...primaryButton, padding: '9px 20px', opacity: creating ? 0.7 : 1 }}>
            {creating ? 'Adding…' : 'Add'}
          </button>
        </form>
        {createError && <p style={{ color: 'var(--color-expense)', fontSize: 13, marginTop: 10 }}>{createError}</p>}
      </div>

      {error && <p style={{ color: 'var(--color-expense)' }}>{error}</p>}
      {loading ? <CategoriesSkeleton /> : (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>Custom ({custom.length})</h2>
          {custom.length === 0
            ? <p style={{ color: 'var(--text-faint)', marginBottom: 32 }}>No custom categories yet.</p>
            : <div style={{ marginBottom: 32 }}>
                {custom.map((c) => (
                  <CategoryRow key={c.id} c={c} isEditing={editingId === c.id}
                    editName={editName} setEditName={setEditName}
                    editColor={editColor} setEditColor={setEditColor}
                    editIcon={editIcon} setEditIcon={setEditIcon}
                    onEdit={() => startEdit(c)}
                    onSave={() => handleUpdate(c.id)}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => handleDelete(c.id)}
                  />
                ))}
              </div>
          }
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>Predefined ({predefined.length})</h2>
          <div style={{ ...glassCard, padding: 18 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {predefined.map((c) => (
                <span key={c.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 99,
                  background: c.color + '22', color: c.color,
                  fontSize: 14, fontWeight: 500, border: `1px solid ${c.color}44`,
                }}>
                  {c.icon} {c.name}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

interface RowProps {
  c: Category; isEditing: boolean;
  editName: string; setEditName: (v: string) => void;
  editColor: string; setEditColor: (v: string) => void;
  editIcon: string; setEditIcon: (v: string) => void;
  onEdit: () => void; onSave: () => void; onCancel: () => void; onDelete: () => void;
}

function CategoryRow({ c, isEditing, editName, setEditName, editColor, setEditColor, editIcon, setEditIcon, onEdit, onSave, onCancel, onDelete }: RowProps) {
  const rowStyle: CSSProperties = {
    ...glassCardSubtle, display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderRadius: 10, marginBottom: 8,
  };

  if (isEditing) {
    return (
      <div style={rowStyle}>
        <input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} maxLength={4}
          style={{ ...glassInput, width: 50, padding: '6px 8px', fontSize: 14 }} placeholder="🏷️" />
        <input value={editName} onChange={(e) => setEditName(e.target.value)}
          style={{ ...glassInput, flex: 1, padding: '6px 10px', fontSize: 14 }} />
        <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)}
          style={{ width: 38, height: 32, border: '1px solid var(--glass-border-strong)', borderRadius: 6,
                   cursor: 'pointer', padding: 2, background: 'var(--glass-input-bg)' }} />
        <button onClick={onSave} style={{ ...primaryButton, padding: '6px 16px', fontSize: 13 }}>Save</button>
        <button onClick={onCancel} style={{ ...glassButton, padding: '6px 14px', fontSize: 13 }}>Cancel</button>
      </div>
    );
  }

  return (
    <div style={rowStyle}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 99,
        background: c.color + '22', color: c.color, fontSize: 13, fontWeight: 500, border: `1px solid ${c.color}33`,
      }}>
        {c.icon} {c.name}
      </span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        <button onClick={onEdit} style={{ ...glassButton, padding: '5px 14px', fontSize: 13 }}>Edit</button>
        <button onClick={onDelete} style={{ ...dangerButton, padding: '5px 14px', fontSize: 13 }}>Delete</button>
      </div>
    </div>
  );
}
