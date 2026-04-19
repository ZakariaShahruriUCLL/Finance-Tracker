import { useState, useEffect, type FormEvent, type CSSProperties } from 'react';
import Layout from '../components/Layout';
import { categoriesApi } from '../api/categories';
import type { Category } from '../types';

const inputStyle: CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 };

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
    setEditingId(c.id);
    setEditName(c.name);
    setEditColor(c.color);
    setEditIcon(c.icon ?? '');
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

  return (
    <Layout>
      <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700 }}>Categories</h1>

      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 32 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 600 }}>Add Custom Category</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Name *</label>
            <input style={{ ...inputStyle, width: 180 }} placeholder="e.g. Gym" value={newName}
              onChange={(e) => setNewName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Icon (emoji)</label>
            <input style={{ ...inputStyle, width: 70 }} placeholder="🏋️" value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)} maxLength={4} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Color</label>
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
              style={{ width: 44, height: 36, border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
          </div>
          <button type="submit" disabled={creating} style={{
            padding: '8px 18px', background: '#4f46e5', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500,
          }}>
            {creating ? 'Adding…' : 'Add'}
          </button>
        </form>
        {createError && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{createError}</p>}
      </div>

      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      {loading ? <p style={{ color: '#9ca3af' }}>Loading…</p> : (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Custom ({custom.length})</h2>
          {custom.length === 0
            ? <p style={{ color: '#9ca3af', marginBottom: 32 }}>No custom categories yet.</p>
            : <div style={{ marginBottom: 32 }}>
                {custom.map((c) => (
                  <CategoryRow
                    key={c.id} c={c} isEditing={editingId === c.id}
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

          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Predefined ({predefined.length})</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {predefined.map((c) => (
              <span key={c.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 99,
                background: c.color + '22', color: c.color,
                fontSize: 14, fontWeight: 500, border: `1px solid ${c.color}44`,
              }}>
                {c.icon} {c.name}
              </span>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}

interface RowProps {
  c: Category;
  isEditing: boolean;
  editName: string; setEditName: (v: string) => void;
  editColor: string; setEditColor: (v: string) => void;
  editIcon: string; setEditIcon: (v: string) => void;
  onEdit: () => void; onSave: () => void;
  onCancel: () => void; onDelete: () => void;
}

function CategoryRow({ c, isEditing, editName, setEditName, editColor, setEditColor, editIcon, setEditIcon, onEdit, onSave, onCancel, onDelete }: RowProps) {
  const rowStyle: CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px', borderRadius: 8, marginBottom: 6,
    background: '#fff', border: '1px solid #e5e7eb',
  };

  if (isEditing) {
    return (
      <div style={rowStyle}>
        <input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} maxLength={4}
          style={{ width: 50, padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 14 }} placeholder="🏷️" />
        <input value={editName} onChange={(e) => setEditName(e.target.value)}
          style={{ flex: 1, padding: '5px 8px', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 14 }} />
        <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)}
          style={{ width: 36, height: 32, border: '1px solid #d1d5db', borderRadius: 5, cursor: 'pointer', padding: 2 }} />
        <button onClick={onSave} style={{ padding: '5px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 13 }}>Save</button>
        <button onClick={onCancel} style={{ padding: '5px 12px', border: '1px solid #d1d5db', borderRadius: 5, background: 'transparent', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
      </div>
    );
  }

  return (
    <div style={rowStyle}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99,
        background: c.color + '22', color: c.color, fontSize: 13, fontWeight: 500 }}>
        {c.icon} {c.name}
      </span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        <button onClick={onEdit} style={{ padding: '4px 12px', border: '1px solid #d1d5db', borderRadius: 5, background: 'transparent', cursor: 'pointer', fontSize: 13 }}>Edit</button>
        <button onClick={onDelete} style={{ padding: '4px 12px', border: '1px solid #fca5a5', borderRadius: 5, background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>Delete</button>
      </div>
    </div>
  );
}
