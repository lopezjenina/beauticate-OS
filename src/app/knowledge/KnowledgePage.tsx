'use client';

import { useState } from 'react';
import { Btn, ConfirmModal, FileUploadArea, AttachmentList, LinkInput } from '@/components/ui';
import { KB_CATEGORIES, KB_DOCS } from '@/lib/store';
import type { KBDoc, Attachment } from '@/lib/types';
import { upsertKBDoc, deleteKBDoc as deleteKBDocDb } from '@/lib/db';

export default function KnowledgePage({ canDelete = false }: { canDelete?: boolean } = {}) {
  const [docs, setDocs] = useState<KBDoc[]>(KB_DOCS);
  const [selectedCategory, setSelectedCategory] = useState<string>(KB_CATEGORIES[0]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KBDoc | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<KBDoc | null>(null);
  const [formData, setFormData] = useState({ title: '', category: '', body: '', author: '' });
  const [formAttachments, setFormAttachments] = useState<Attachment[]>([]);

  const filteredDocs = docs.filter((doc) => {
    const matchesCategory = doc.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedDoc = selectedDocId
    ? docs.find((doc) => doc.id === selectedDocId)
    : null;

  const resetForm = () => {
    setFormData({ title: '', category: '', body: '', author: '' });
    setFormAttachments([]);
    setEditingDoc(null);
    setShowCreateModal(false);
  };

  const openEditDoc = (doc: KBDoc) => {
    setFormData({ title: doc.title, category: doc.category, body: doc.body, author: doc.author });
    setFormAttachments(doc.attachments || []);
    setEditingDoc(doc);
    setShowCreateModal(true);
  };

  const handleSaveDoc = () => {
    if (!formData.title || !formData.body) return;

    if (editingDoc) {
      const updatedDoc = {
        ...editingDoc,
        title: formData.title,
        category: formData.category || selectedCategory,
        author: formData.author,
        body: formData.body,
        updated: new Date().toISOString().split('T')[0],
        attachments: formAttachments.length > 0 ? formAttachments : undefined,
      };
      setDocs((prev) => prev.map((d) => d.id === editingDoc.id ? updatedDoc : d));
      upsertKBDoc(updatedDoc);
      setSelectedDocId(editingDoc.id);
    } else {
      const newDoc: KBDoc = {
        id: `kb-${Date.now()}`,
        title: formData.title,
        category: formData.category || selectedCategory,
        author: formData.author,
        updated: new Date().toISOString().split('T')[0],
        body: formData.body,
        attachments: formAttachments.length > 0 ? formAttachments : undefined,
      };
      setDocs((prev) => [...prev, newDoc]);
      upsertKBDoc(newDoc);
    }
    resetForm();
  };

  const handleDeleteDoc = () => {
    if (!deletingDoc) return;
    setDocs((prev) => prev.filter((d) => d.id !== deletingDoc.id));
    deleteKBDocDb(deletingDoc.id);
    if (selectedDocId === deletingDoc.id) setSelectedDocId(null);
    setDeletingDoc(null);
  };

  const handleFilesSelected = (files: { name: string; url: string; type: "image" | "video" | "document" }[]) => {
    const newAttachments: Attachment[] = files.map((f, i) => ({
      id: `att-${Date.now()}-${i}`,
      name: f.name,
      url: f.url,
      type: f.type,
      thumbnailUrl: f.type === "image" ? f.url : undefined,
      addedAt: new Date().toISOString(),
    }));
    setFormAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleLinkAdd = (link: { name: string; url: string }) => {
    setFormAttachments((prev) => [...prev, {
      id: `att-${Date.now()}`,
      name: link.name,
      url: link.url,
      type: "link" as const,
      addedAt: new Date().toISOString(),
    }]);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#FFFFFF' }}>
      {/* Left Sidebar */}
      <div style={{ width: '280px', borderRight: '1px solid #E3E3E0', display: 'flex', flexDirection: 'column', backgroundColor: '#F7F7F5' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #E3E3E0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#1A1A1A' }}>Knowledge Base</h2>
            <Btn variant="primary" onClick={() => { resetForm(); setShowCreateModal(true); }} style={{ fontSize: 12, padding: '4px 10px' }}>
              New
            </Btn>
          </div>
        </div>

        <div style={{ padding: '1.5rem', borderBottom: '1px solid #E3E3E0' }}>
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '0.75rem', borderRadius: '6px',
              border: '1px solid #E3E3E0', fontSize: '0.9rem',
              backgroundColor: '#FFFFFF', fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
          {KB_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => { setSelectedCategory(category); setSelectedDocId(null); setSearchQuery(''); }}
              style={{
                width: '100%', textAlign: 'left', padding: '0.875rem 1rem', borderRadius: '6px',
                border: 'none',
                backgroundColor: selectedCategory === category ? '#FFFFFF' : 'transparent',
                color: selectedCategory === category ? '#1A1A1A' : '#6B6B6B',
                fontSize: '0.9rem', fontWeight: selectedCategory === category ? '600' : '500',
                cursor: 'pointer', transition: 'all 0.2s', margin: '0.25rem 0', fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { if (selectedCategory !== category) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF'; (e.currentTarget as HTMLButtonElement).style.color = '#1A1A1A'; } }}
              onMouseLeave={(e) => { if (selectedCategory !== category) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#6B6B6B'; } }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedDoc ? (
          /* Document View */
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E3E3E0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => setSelectedDocId(null)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #E3E3E0',
                  backgroundColor: '#FFFFFF', color: '#1A1A1A', fontSize: '0.85rem',
                  fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F7F7F5'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF'; }}
              >
                Back
              </button>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1A1A1A', margin: 0, flex: 1 }}>
                {selectedDoc.title}
              </h1>
              <button
                onClick={() => openEditDoc(selectedDoc)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #E3E3E0',
                  backgroundColor: '#FFFFFF', color: '#6B6B6B', fontSize: '0.85rem',
                  fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F7F7F5'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF'; }}
              >
                Edit
              </button>
              {canDelete && (
                <button
                  onClick={() => setDeletingDoc(selectedDoc)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #E3E3E0',
                    backgroundColor: '#FFFFFF', color: '#EB5757', fontSize: '0.85rem',
                    fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FDECEC'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF'; }}
                >
                  Delete
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
              <div style={{ maxWidth: '800px', lineHeight: '1.8', color: '#1A1A1A', fontSize: '1rem', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                {selectedDoc.body}
              </div>

              {selectedDoc.attachments && selectedDoc.attachments.length > 0 && (
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #E3E3E0' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', marginBottom: '0.5rem' }}>Attachments</div>
                  <AttachmentList attachments={selectedDoc.attachments} />
                </div>
              )}

              {selectedDoc.updated && (
                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #E3E3E0', fontSize: '0.8rem', color: '#9B9B9B' }}>
                  Last updated: {selectedDoc.updated}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Document List View */
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E3E3E0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>
                {selectedCategory}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#9B9B9B', margin: '0.5rem 0 0 0' }}>
                {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
              {filteredDocs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {filteredDocs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      style={{
                        textAlign: 'left', padding: '1.25rem', borderRadius: '8px',
                        border: '1px solid #E3E3E0', backgroundColor: '#FFFFFF',
                        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#D0D0CC'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E3E3E0'; }}
                    >
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1A1A1A', marginBottom: '0.5rem' }}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#9B9B9B', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {doc.body}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: '0.5rem' }}>
                        {doc.updated && (
                          <span style={{ fontSize: '0.75rem', color: '#C0C0BC' }}>Updated {doc.updated}</span>
                        )}
                        {doc.attachments && doc.attachments.length > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>
                            {doc.attachments.length} file{doc.attachments.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#9B9B9B' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '500' }}>No documents found</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Try adjusting your search or selecting a different category</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Doc Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000,
          }}
          onClick={resetForm}
        >
          <div
            style={{
              background: '#FFFFFF', borderRadius: 8, border: '1px solid #E3E3E0',
              padding: '2rem', maxWidth: 600, width: '90%', maxHeight: '90vh', overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1A1A1A', marginBottom: '1.5rem' }}>
              {editingDoc ? 'Edit Document' : 'New Document'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Title</label>
                <input
                  type="text" value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Document title"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Category</label>
                  <select
                    value={formData.category || selectedCategory}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                  >
                    {KB_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Author</label>
                  <input
                    type="text" value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Author name"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Content</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Write document content..."
                  style={{
                    width: '100%', padding: '0.75rem', border: '1px solid #E3E3E0',
                    borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit',
                    minHeight: 200, resize: 'vertical',
                  }}
                />
              </div>

              {/* Attachments */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B6B6B', display: 'block', marginBottom: '0.5rem' }}>Attachments</label>
                <FileUploadArea onFilesSelected={handleFilesSelected} />
                <div style={{ marginTop: 10 }}>
                  <LinkInput onAdd={handleLinkAdd} />
                </div>
                <AttachmentList
                  attachments={formAttachments}
                  onRemove={(id) => setFormAttachments((prev) => prev.filter((a) => a.id !== id))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <Btn onClick={resetForm}>Cancel</Btn>
              <Btn variant="primary" onClick={handleSaveDoc}>
                {editingDoc ? 'Save Changes' : 'Create Document'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingDoc && (
        <ConfirmModal
          title="Delete Document"
          message={`This will permanently remove "${deletingDoc.title}".`}
          onConfirm={handleDeleteDoc}
          onCancel={() => setDeletingDoc(null)}
        />
      )}
    </div>
  );
}
