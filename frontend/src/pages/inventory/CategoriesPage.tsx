import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { categoryApi } from '../../api/services';
import { Category } from '../../types';
import { Modal } from '../../components/common/Modal';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'categories' | 'brands' | 'units'>('categories');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameKh, setCatNameKh] = useState('');
  const [brandName, setBrandName] = useState('');
  const [unitEn, setUnitEn] = useState('');
  const [unitCode, setUnitCode] = useState('');

  const loadData = async () => {
    try {
      const [cList, bList, uList] = await Promise.all([
        categoryApi.listCategories(),
        categoryApi.listBrands(),
        categoryApi.listUnits()
      ]);
      setCategories(cList || []);
      setBrands(bList || []);
      setUnits(uList || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'categories') {
        await categoryApi.createCategory({ name_en: catNameEn, name_kh: catNameKh });
        setCatNameEn('');
        setCatNameKh('');
      } else if (activeTab === 'brands') {
        await categoryApi.createBrand({ name: brandName });
        setBrandName('');
      } else {
        await categoryApi.createUnit({ name_en: unitEn, short_code: unitCode });
        setUnitEn('');
        setUnitCode('');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to save');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Categories, Brands & Measurement Units
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize products and structure inventory hierarchies
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add {activeTab === 'categories' ? 'Category' : activeTab === 'brands' ? 'Brand' : 'Unit'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'categories', label: 'Product Categories' },
          { id: 'brands', label: 'Brands & Labels' },
          { id: 'units', label: 'Units of Measure' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-3 px-4 text-xs font-semibold transition-colors border-b-2 -mb-px cursor-pointer ${
              activeTab === t.id
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {activeTab === 'categories' && (
            categories.map(c => (
              <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{c.name_en}</div>
                  {c.name_kh && <div className="text-[11px] text-slate-400 font-khmer">{c.name_kh}</div>}
                </div>
                <button
                  onClick={() => categoryApi.deleteCategory(c.id).then(loadData)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}

          {activeTab === 'brands' && (
            brands.map(b => (
              <div key={b.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{b.name}</div>
              </div>
            ))
          )}

          {activeTab === 'units' && (
            units.map(u => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{u.name_en}</div>
                  <div className="text-[10px] font-mono text-slate-400">Code: {u.short_code}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Add New ${activeTab === 'categories' ? 'Category' : activeTab === 'brands' ? 'Brand' : 'Unit'}`}
        maxWidth="sm"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {activeTab === 'categories' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">English Name *</label>
                <input
                  type="text"
                  required
                  value={catNameEn}
                  onChange={(e) => setCatNameEn(e.target.value)}
                  placeholder="e.g. Footwear"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Khmer Name</label>
                <input
                  type="text"
                  value={catNameKh}
                  onChange={(e) => setCatNameKh(e.target.value)}
                  placeholder="e.g. ស្បែកជើង"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-khmer"
                />
              </div>
            </>
          )}

          {activeTab === 'brands' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Khmer Silk Heritage"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          {activeTab === 'units' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Name *</label>
                <input
                  type="text"
                  required
                  value={unitEn}
                  onChange={(e) => setUnitEn(e.target.value)}
                  placeholder="e.g. Kilogram"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Short Code *</label>
                <input
                  type="text"
                  required
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  placeholder="e.g. kg"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
