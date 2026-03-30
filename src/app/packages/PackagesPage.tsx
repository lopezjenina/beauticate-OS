'use client';

import React, { useState, useEffect } from 'react';
import { Btn, PageHeader, Badge, ConfirmModal } from '@/components/ui';

export type ServicePackage = {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: "monthly" | "quarterly" | "annually" | "one-time";
  features: string[];
  isActive: boolean;
};

const INIT_PACKAGES: ServicePackage[] = [
  { id: "pkg-1", name: "Starter", description: "Basic video content package", price: 1500, billingCycle: "monthly", features: ["4 videos/month", "1 platform", "Basic editing"], isActive: true },
  { id: "pkg-2", name: "Growth", description: "Scale your content presence", price: 2500, billingCycle: "monthly", features: ["8 videos/month", "2 platforms", "Advanced editing", "Thumbnail design"], isActive: true },
  { id: "pkg-3", name: "Pro", description: "Full content management", price: 4000, billingCycle: "monthly", features: ["12 videos/month", "3 platforms", "Premium editing", "Thumbnail design", "Caption writing", "Strategy calls"], isActive: true },
  { id: "pkg-4", name: "Enterprise", description: "Custom solution for large brands", price: 7500, billingCycle: "monthly", features: ["20+ videos/month", "All platforms", "Dedicated editor", "Priority support", "Ad management", "Monthly reporting"], isActive: true },
];

export default function PackagesPage() {
  const [packages, setPackages] = useState<ServicePackage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("agencyos_packages");
      if (saved) {
        try { return JSON.parse(saved); } catch { /* fallback */ }
      }
    }
    return INIT_PACKAGES;
  });

  // Persist on change
  useEffect(() => {
    sessionStorage.setItem("agencyos_packages", JSON.stringify(packages));
  }, [packages]);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<ServicePackage | null>(null);
  const [deletingPkg, setDeletingPkg] = useState<ServicePackage | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: 0, billingCycle: 'monthly' as ServicePackage["billingCycle"], features: '' });

  const resetForm = () => {
    setFormData({ name: '', description: '', price: 0, billingCycle: 'monthly', features: '' });
    setEditingPkg(null);
    setShowModal(false);
  };

  const handleEdit = (pkg: ServicePackage) => {
    setFormData({ name: pkg.name, description: pkg.description, price: pkg.price, billingCycle: pkg.billingCycle, features: pkg.features.join('\n') });
    setEditingPkg(pkg);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) return;
    const featuresArr = formData.features.split('\n').map(f => f.trim()).filter(Boolean);

    if (editingPkg) {
      setPackages(prev => prev.map(p => p.id === editingPkg.id ? { ...p, name: formData.name, description: formData.description, price: formData.price, billingCycle: formData.billingCycle, features: featuresArr } : p));
    } else {
      setPackages(prev => [...prev, { id: `pkg-${Date.now()}`, name: formData.name, description: formData.description, price: formData.price, billingCycle: formData.billingCycle, features: featuresArr, isActive: true }]);
    }
    resetForm();
  };

  const toggleActive = (id: string) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  return (
    <div style={{ padding: '40px' }}>
      <PageHeader title="Packages & Services" subtitle="Manage your service offerings and pricing">
        <Btn variant="primary" onClick={() => { resetForm(); setShowModal(true); }}>New Package</Btn>
      </PageHeader>

      {/* Package Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginTop: 32 }}>
        {packages.map(pkg => (
          <div key={pkg.id} style={{
            background: '#FFF', border: '1px solid #E8E8E6', borderRadius: 12, padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)', opacity: pkg.isActive ? 1 : 0.6,
            position: 'relative',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px' }}>{pkg.name}</h3>
                <p style={{ fontSize: 13, color: '#6B6B6B', margin: 0 }}>{pkg.description}</p>
              </div>
              <Badge variant={pkg.isActive ? 'success' : 'default'}>
                {pkg.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#1A1A1A' }}>${pkg.price.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: '#9B9B9B', marginLeft: 4 }}>/{pkg.billingCycle === 'one-time' ? 'one-time' : pkg.billingCycle.replace('ly', '')}</span>
            </div>

            {/* Features */}
            <div style={{ marginBottom: 20 }}>
              {pkg.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13, color: '#1A1A1A' }}>
                  <span style={{ color: '#4DAB9A', fontSize: 14 }}>{'\u2713'}</span>
                  {f}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #EBEBEA', paddingTop: 16 }}>
              <button onClick={() => handleEdit(pkg)} style={{ flex: 1, padding: '8px', border: '1px solid #E3E3E0', borderRadius: 6, background: 'transparent', color: '#6B6B6B', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
              <button onClick={() => toggleActive(pkg.id)} style={{ flex: 1, padding: '8px', border: '1px solid #E3E3E0', borderRadius: 6, background: 'transparent', color: pkg.isActive ? '#EB5757' : '#4DAB9A', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                {pkg.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => setDeletingPkg(pkg)} style={{ padding: '8px 12px', border: '1px solid #E3E3E0', borderRadius: 6, background: 'transparent', color: '#EB5757', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end', zIndex: 1000 }} onClick={resetForm}>
          <div style={{ background: '#FFF', width: 420, maxWidth: '90vw', height: '100vh', overflowY: 'auto', padding: 32, boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', borderLeft: '1px solid #E3E3E0' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A', margin: '0 0 24px' }}>{editingPkg ? 'Edit Package' : 'New Package'}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', display: 'block', marginBottom: 6 }}>Package Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Growth" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E3E3E0', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', display: 'block', marginBottom: 6 }}>Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Short description" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E3E3E0', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', display: 'block', marginBottom: 6 }}>Price ($)</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E3E3E0', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', display: 'block', marginBottom: 6 }}>Billing Cycle</label>
                  <select value={formData.billingCycle} onChange={e => setFormData({...formData, billingCycle: e.target.value as ServicePackage["billingCycle"]})} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E3E3E0', fontSize: 13, fontFamily: 'inherit' }}>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', display: 'block', marginBottom: 6 }}>Features (one per line)</label>
                <textarea value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder={"8 videos/month\n2 platforms\nAdvanced editing"} rows={6} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #E3E3E0', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <Btn onClick={resetForm}>Cancel</Btn>
              <Btn variant="primary" onClick={handleSave}>{editingPkg ? 'Save Changes' : 'Create Package'}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingPkg && (
        <ConfirmModal
          title="Delete Package"
          message={`This will permanently remove the "${deletingPkg.name}" package.`}
          onConfirm={() => { setPackages(prev => prev.filter(p => p.id !== deletingPkg.id)); setDeletingPkg(null); }}
          onCancel={() => setDeletingPkg(null)}
        />
      )}
    </div>
  );
}
