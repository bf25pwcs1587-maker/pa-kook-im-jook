import React, { useState } from 'react';
import { MenuItem } from '../types';
import { 
  Plus, 
  Edit3, 
  RotateCcw, 
  Trash2,
  X
} from 'lucide-react';
import { DEFAULT_MENU_ITEMS } from '../data/defaultMenu';
import { translations, Language } from '../utils/translations';
import { saveMenuItemToFirestore, deleteMenuItemFromFirestore } from '../firebase/config';

interface MenuCostManagerProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  onPurgeItemSales?: (menuItemId: string) => void;
  lang: Language;
}

export const MenuCostManager: React.FC<MenuCostManagerProps> = ({
  menuItems,
  setMenuItems,
  onPurgeItemSales,
  lang,
}) => {
  const t = translations[lang];
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [purgeSalesHistory, setPurgeSalesHistory] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'food' | 'drink'>('all');

  // New item form state
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    nameEn: '',
    category: 'food',
    price: 40,
    cost: 18,
    emoji: '🍛',
    isAvailable: true,
  });

  // Save edited price & cost
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === editingItem.id ? { ...editingItem } : item
      )
    );
    try {
      await saveMenuItemToFirestore(editingItem);
    } catch (err) {
      console.warn('Firestore update error', err);
    }
    setEditingItem(null);
  };

  // Add new item
  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name?.trim()) return;

    const created: MenuItem = {
      id: `custom-${Date.now()}`,
      name: newItem.name.trim(),
      nameEn: newItem.nameEn?.trim() || newItem.name.trim(),
      category: newItem.category || 'food',
      price: Number(newItem.price) || 40,
      cost: Number(newItem.cost) || 20,
      emoji: newItem.emoji || (newItem.category === 'drink' ? '🥤' : '🍛'),
      isAvailable: true,
    };

    setMenuItems((prev) => [...prev, created]);
    try {
      await saveMenuItemToFirestore(created);
    } catch (err) {
      console.warn('Firestore create error', err);
    }
    setIsAddModalOpen(false);
    setNewItem({
      name: '',
      nameEn: '',
      category: 'food',
      price: 40,
      cost: 18,
      emoji: '🍛',
      isAvailable: true,
    });
  };

  // Delete MenuItem with optional sales history purge
  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const itemId = itemToDelete.id;

    // Remove from menu items
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId));

    // If requested, purge from all historical sales (so monthly revenue & cost update to 0)
    if (purgeSalesHistory && onPurgeItemSales) {
      onPurgeItemSales(itemId);
    }

    try {
      await deleteMenuItemFromFirestore(itemId);
    } catch (err) {
      console.warn('Firestore delete error', err);
    }
    setItemToDelete(null);
  };

  // Reset to original defaults
  const handleResetDefaults = () => {
    setMenuItems(DEFAULT_MENU_ITEMS);
    DEFAULT_MENU_ITEMS.forEach((it) => {
      saveMenuItemToFirestore(it).catch(() => {});
    });
  };

  const filtered = menuItems.filter((i) => {
    if (activeTab === 'all') return true;
    return i.category === activeTab;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header and Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-2">
            <span>🍲 {t.menuManagerTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.menuManagerSub}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer"
            title={t.resetDefaultsBtn}
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>{t.resetDefaultsBtn}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addNewItemBtn}</span>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-extrabold cursor-pointer transition ${
            activeTab === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          {t.filterAll} ({menuItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('food')}
          className={`px-4 py-2 rounded-xl text-sm font-extrabold cursor-pointer transition ${
            activeTab === 'food'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          {t.filterFood} ({menuItems.filter(i => i.category === 'food').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('drink')}
          className={`px-4 py-2 rounded-xl text-sm font-extrabold cursor-pointer transition ${
            activeTab === 'drink'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          {t.filterDrink} ({menuItems.filter(i => i.category === 'drink').length})
        </button>
      </div>

      {/* Menu Cards Grid with large fonts and profit info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const profit = item.price - item.cost;
          const margin = item.price > 0 ? Math.round((profit / item.price) * 1000) / 10 : 0;
          const primaryTitle = lang === 'en' ? item.nameEn : item.name;
          const secondaryTitle = lang === 'en' ? item.name : item.nameEn;

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 border-2 border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{item.emoji}</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        item.category === 'drink'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {item.category === 'drink' ? t.filterDrink : t.filterFood}
                    </span>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded-lg transition cursor-pointer"
                      title={t.deleteItemBtn}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl mt-2 leading-snug">
                  {primaryTitle}
                </h3>
                <p className="text-xs text-slate-400 font-medium">{secondaryTitle}</p>
              </div>

              {/* Price, Cost, Profit Breakdown Box with Large Fonts */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl text-center mb-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block">{t.sellingPriceLabel}</span>
                    <span className="text-lg sm:text-xl font-black text-slate-900">
                      ฿{item.price}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block">{t.costLabel}</span>
                    <span className="text-lg sm:text-xl font-black text-slate-600">
                      ฿{item.cost}
                    </span>
                  </div>
                  <div className="bg-emerald-100/70 rounded-xl p-0.5">
                    <span className="text-[11px] font-bold text-emerald-800 block">{t.profitPerDish}</span>
                    <span className="text-lg sm:text-xl font-black text-emerald-700">
                      +฿{profit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{t.profitMarginRate} <strong className="text-emerald-700">{margin}%</strong></span>
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t.editPriceCostBtn}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <span>{editingItem.emoji}</span>
              <span>{t.editModalTitle}: {lang === 'en' ? editingItem.nameEn : editingItem.name}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t.editModalSub}
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.itemNameThai}
                </label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.itemNameEn}
                </label>
                <input
                  type="text"
                  value={editingItem.nameEn}
                  onChange={(e) => setEditingItem({ ...editingItem, nameEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-base"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.sellingPriceTHB}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xl font-black rounded-xl border-2 border-slate-300 focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.costTHB}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingItem.cost}
                    onChange={(e) => setEditingItem({ ...editingItem, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xl font-black rounded-xl border-2 border-slate-300 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Profit Preview */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center text-sm">
                <span className="font-bold text-emerald-800">{t.profitPerDish}:</span>
                <span className="text-xl font-black text-emerald-700">
                  +฿{editingItem.price - editingItem.cost} {t.baht}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-black text-slate-950 shadow-md cursor-pointer"
                >
                  {t.saveChangesBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {t.addNewModalTitle}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t.addNewModalSub}
            </p>

            <form onSubmit={handleAddNewItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.itemNameThai}
                </label>
                <input
                  type="text"
                  placeholder="เช่น ข้าวกะเพราหมูสับ"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.itemNameEn}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Basil Pork Rice"
                  value={newItem.nameEn}
                  onChange={(e) => setNewItem({ ...newItem, nameEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-base"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.categoryLabel}
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as 'food' | 'drink' })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="food">{t.filterFood}</option>
                    <option value="drink">{t.filterDrink}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.emojiLabel}
                  </label>
                  <input
                    type="text"
                    value={newItem.emoji}
                    onChange={(e) => setNewItem({ ...newItem, emoji: e.target.value })}
                    className="w-full px-3 py-2 text-center text-xl rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.sellingPriceTHB}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xl font-black rounded-xl border-2 border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.costTHB}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newItem.cost}
                    onChange={(e) => setNewItem({ ...newItem, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xl font-black rounded-xl border-2 border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-black text-slate-950 shadow-md cursor-pointer"
                >
                  {t.addItemConfirmBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MENU ITEM CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-rose-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-2xl">{itemToDelete.emoji}</span>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold"
              >
                ✕
              </button>
            </div>
            <h4 className="text-lg font-black text-slate-900 mt-3">
              {lang === 'th' ? `ลบเมนู "${itemToDelete.name}" หรือไม่?` : `Delete "${itemToDelete.nameEn}"?`}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'th' ? 'เมนูนี้จะถูกลบออกจากระบบแคชเชียร์และฐานข้อมูล' : 'This menu item will be removed from your cashier menu and database.'}
            </p>

            {/* Checkbox to also remove sales history from monthly totals */}
            <div className="mt-3.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={purgeSalesHistory}
                  onChange={(e) => setPurgeSalesHistory(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-xs font-bold text-rose-900 leading-tight">
                  {lang === 'th'
                    ? 'ลบยอดขายและจำนวนจานของเมนูนี้ออกจากบิลและรายงานรายเดือนด้วย'
                    : 'Also purge sales of this item from all slips & monthly reports'}
                </span>
              </label>
              <p className="text-[11px] text-rose-600 mt-1 pl-5">
                {lang === 'th'
                  ? 'ติ๊กเลือกเพื่อให้ยอดขายและกำไรรายเดือนของเมนูนี้กลายเป็น 0'
                  : 'Check this to reset monthly sold quantity, revenue, and cost for this item to 0.'}
              </p>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700 text-sm cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-black text-white text-sm shadow-md cursor-pointer"
              >
                {lang === 'th' ? 'ยืนยันลบเมนู' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
