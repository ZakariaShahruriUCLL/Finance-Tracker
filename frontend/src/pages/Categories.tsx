import { useState, useEffect, type FormEvent, type CSSProperties } from 'react';
import { Tags, Plus, Pencil, Trash2, Lock, Check, X } from 'lucide-react';
import Layout from '../components/Layout';
import CategoriesSkeleton from '../components/CategoriesSkeleton';
import { categoriesApi } from '../api/categories';
import type { Category } from '../types';
import { glassCard, glassCardSubtle, glassInput, glassButton, primaryButton, dangerButton } from '../styles/glass';

const inputStyle: CSSProperties = { ...glassInput, padding: '10px 12px', fontSize: 14, width: '100%' };
const labelStyle: CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.04em' };

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

  return (
    <Layout>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
          border: '1px solid rgba(99,102,241,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Tags size={20} strokeWidth={1.75} color="#818cf8" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Categories
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            {custom.length} custom · {predefined.length} predefined
          </p>
        </div>
      </div>

      {/* Create form */}
      <div style={{ ...glassCard, padding: '24px 28px', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={15} strokeWidth={2.5} color="#818cf8" />
          </div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>New Category</h2>
        </div>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 14, alignItems: 'end' }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input style={inputStyle} placeholder="e.g. Gym, Groceries…" value={newName}
                onChange={(e) => setNewName(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Icon</label>
              <input style={{ ...glassInput, padding: '10px 12px', fontSize: 18, width: 64, textAlign: 'center' }}
                placeholder="🏷️" value={newIcon} onChange={(e) => setNewIcon(e.target.value)} maxLength={4} />
            </div>
            <div>
              <label style={labelStyle}>Color</label>
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
                style={{ width: 48, height: 44, border: '1px solid var(--input-border)', borderRadius: 8, cursor: 'pointer', padding: 3, background: 'var(--input-bg)', display: 'block' }} />
            </div>
            <button type="submit" disabled={creating}
              style={{ ...primaryButton, padding: '11px 24px', display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, opacity: creating ? 0.7 : 1, whiteSpace: 'nowrap' as const }}>
              <Plus size={15} strokeWidth={2.5} />
              {creating ? 'Adding…' : 'Add Category'}
            </button>
          </div>
          {createError && <p style={{ color: 'var(--color-expense)', fontSize: 13, marginTop: 12 }}>{createError}</p>}
        </form>
      </div>

      {error && <p style={{ color: 'var(--color-expense)' }}>{error}</p>}

      {loading ? <CategoriesSkeleton /> : (
        <>
          {/* ── Custom categories ── */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Pencil size={14} strokeWidth={2} color="var(--text-muted)" />
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Custom ({custom.length})
              </h2>
            </div>
            {custom.length === 0 ? (
              <div style={{ ...glassCardSubtle, padding: '36px 24px', textAlign: 'center', borderRadius: 14 }}>
                <p style={{ margin: '0 0 4px', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>No custom categories yet</p>
                <p style={{ margin: 0, color: 'var(--text-faint)', fontSize: 13 }}>Use the form above to create your first one.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {custom.map((c) => (
                  editingId === c.id
                    ? <CategoryEditCard key={c.id} c={c}
                        editName={editName} setEditName={setEditName}
                        editColor={editColor} setEditColor={setEditColor}
                        editIcon={editIcon} setEditIcon={setEditIcon}
                        onSave={() => handleUpdate(c.id)}
                        onCancel={() => setEditingId(null)} />
                    : <CategoryCard key={c.id} c={c}
                        onEdit={() => startEdit(c)}
                        onDelete={() => handleDelete(c.id)} />
                ))}
              </div>
            )}
          </div>

          {/* ── Predefined categories ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Lock size={14} strokeWidth={2} color="var(--text-muted)" />
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Predefined ({predefined.length})
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {predefined.map((c) => (
                <div key={c.id} style={{
                  ...glassCard, borderRadius: 14,
                  padding: '20px 16px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  border: `1px solid ${c.color}25`,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: c.color + '18',
                    border: `2px solid ${c.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {c.icon || <span style={{ color: c.color, fontWeight: 800, fontSize: 16 }}>{c.name[0]}</span>}
                  </div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', textAlign: 'center' }}>
                    {c.name}
                  </p>
                  <div style={{ width: 28, height: 4, borderRadius: 2, background: c.color, opacity: 0.7 }} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

interface CardProps { c: Category; onEdit: () => void; onDelete: () => void; }

function CategoryCard({ c, onEdit, onDelete }: CardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...glassCard, borderRadius: 14,
        padding: '22px 16px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        border: `1px solid ${hovered ? c.color + '55' : c.color + '25'}`,
        boxShadow: hovered ? 'var(--card-shadow-hover)' : 'var(--card-shadow)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: c.color + '18',
        border: `2px solid ${c.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
        transform: hovered ? 'scale(1.06)' : 'scale(1)',
        transition: 'transform 0.15s',
      }}>
        {c.icon || <span style={{ color: c.color, fontWeight: 800, fontSize: 18 }}>{c.name[0]}</span>}
      </div>

      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.3 }}>
        {c.name}
      </p>

      <div style={{ width: 32, height: 4, borderRadius: 2, background: c.color }} />

      <div style={{ display: 'flex', gap: 6, width: '100%', marginTop: 4 }}>
        <button onClick={onEdit} style={{
          ...glassButton,
          flex: 1, padding: '9px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          fontSize: 13, fontWeight: 500,
        }}>
          <Pencil size={13} strokeWidth={1.75} />
          Edit
        </button>
        <button onClick={onDelete} style={{
          ...dangerButton,
          padding: '9px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

interface EditCardProps {
  c: Category;
  editName: string; setEditName: (v: string) => void;
  editColor: string; setEditColor: (v: string) => void;
  editIcon: string; setEditIcon: (v: string) => void;
  onSave: () => void; onCancel: () => void;
}

function CategoryEditCard({ editName, setEditName, editColor, setEditColor, editIcon, setEditIcon, onSave, onCancel }: EditCardProps) {
  return (
    <div style={{
      ...glassCard, borderRadius: 14,
      padding: '18px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
      border: `2px solid ${editColor}55`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 15,
          background: editColor + '20',
          border: `2px solid ${editColor}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, transition: 'background 0.2s, border-color 0.2s',
        }}>
          {editIcon || <span style={{ color: editColor, fontWeight: 800, fontSize: 16 }}>{editName[0] ?? '?'}</span>}
        </div>
      </div>

      <input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} maxLength={4}
        placeholder="Icon (emoji)" style={{ ...glassInput, padding: '8px 10px', fontSize: 16, textAlign: 'center' }} />

      <input value={editName} onChange={(e) => setEditName(e.target.value)}
        style={{ ...glassInput, padding: '8px 10px', fontSize: 14 }} placeholder="Category name" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)}
          style={{ width: 44, height: 40, borderRadius: 8, border: '1px solid var(--input-border)', cursor: 'pointer', padding: 3, background: 'var(--input-bg)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Pick a color</span>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onSave} style={{
          ...primaryButton, flex: 1, padding: '9px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 13,
        }}>
          <Check size={14} strokeWidth={2.5} /> Save
        </button>
        <button onClick={onCancel} style={{
          ...glassButton, padding: '9px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
