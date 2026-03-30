'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui';
import { KB_CATEGORIES, KB_DOCS } from '@/lib/store';
import type { KBDoc } from '@/lib/types';

export default function KnowledgePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>(KB_CATEGORIES[0]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = KB_DOCS.filter((doc) => {
    const matchesCategory = doc.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedDoc = selectedDocId
    ? KB_DOCS.find((doc) => doc.id === selectedDocId)
    : null;

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Left Sidebar */}
      <div
        style={{
          width: '280px',
          borderRight: '1px solid #E3E3E0',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#F7F7F5',
        }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #E3E3E0' }}>
          <PageHeader title="Knowledge Base" />
        </div>

        <div style={{ padding: '1.5rem', borderBottom: '1px solid #E3E3E0' }}>
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #E3E3E0',
              fontSize: '0.9rem',
              backgroundColor: '#FFFFFF',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
          {KB_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setSelectedDocId(null);
                setSearchQuery('');
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.875rem 1rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor:
                  selectedCategory === category ? '#FFFFFF' : 'transparent',
                color: selectedCategory === category ? '#1A1A1A' : '#6B6B6B',
                fontSize: '0.9rem',
                fontWeight: selectedCategory === category ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                margin: '0.25rem 0',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    '#FFFFFF';
                  (e.currentTarget as HTMLButtonElement).style.color = '#1A1A1A';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = '#6B6B6B';
                }
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {selectedDoc ? (
          // Document View
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid #E3E3E0',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <button
                onClick={() => setSelectedDocId(null)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #E3E3E0',
                  backgroundColor: '#FFFFFF',
                  color: '#1A1A1A',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    '#F7F7F5';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    '#FFFFFF';
                }}
              >
                Back
              </button>
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  margin: 0,
                }}
              >
                {selectedDoc.title}
              </h1>
            </div>

            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '2rem',
              }}
            >
              <div
                style={{
                  maxWidth: '800px',
                  lineHeight: '1.8',
                  color: '#1A1A1A',
                  fontSize: '1rem',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}
              >
                {selectedDoc.body}
              </div>

              {selectedDoc.updated && (
                <div
                  style={{
                    marginTop: '3rem',
                    paddingTop: '2rem',
                    borderTop: '1px solid #E3E3E0',
                    fontSize: '0.8rem',
                    color: '#9B9B9B',
                  }}
                >
                  Last updated: {selectedDoc.updated}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Document List View
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1.5rem',
                borderBottom: '1px solid #E3E3E0',
              }}
            >
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#1A1A1A',
                  margin: 0,
                }}
              >
                {selectedCategory}
              </h2>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: '#9B9B9B',
                  margin: '0.5rem 0 0 0',
                }}
              >
                {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '1rem',
              }}
            >
              {filteredDocs.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  {filteredDocs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      style={{
                        textAlign: 'left',
                        padding: '1.25rem',
                        borderRadius: '8px',
                        border: '1px solid #E3E3E0',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.boxShadow =
                          '0 2px 8px rgba(0,0,0,0.06)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor =
                          '#D0D0CC';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.boxShadow =
                          'none';
                        (e.currentTarget as HTMLButtonElement).style.borderColor =
                          '#E3E3E0';
                      }}
                    >
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#1A1A1A',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {doc.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: '#9B9B9B',
                          lineHeight: '1.5',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {doc.body}
                      </div>
                      {doc.updated && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#C0C0BC',
                            marginTop: '0.5rem',
                          }}
                        >
                          Updated {doc.updated}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    color: '#9B9B9B',
                  }}
                >
                  <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                    No documents found
                  </div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Try adjusting your search or selecting a different category
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
