'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/app/utils/api';

export default function AracimPage() {
  // Tarih format yardımcıları
  const DateField = ({ id, name, value, onChange }: { id: string; name: string; value?: string; onChange: (e: any) => void; }) => {
    const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const monthLabels = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const today = new Date();
    const currentYear = today.getFullYear();
    const years: string[] = [];
    for (let y = currentYear + 5; y >= currentYear - 50; y--) years.push(String(y));

    const iso = (value || '').trim();
    const [iy, im, idd] = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-') : ['', '', ''];

    const emit = (yy: string, mm: string, dd: string) => {
      if (yy && mm && dd) {
        onChange({ target: { name, value: `${yy}-${mm}-${dd}`, type: 'text' } });
      } else {
        onChange({ target: { name, value: '', type: 'text' } });
      }
    };

    return (
      <div className="aracim-datefield" id={id}>
        <select value={idd} onChange={(e) => emit(iy, im, e.target.value)} className="select" aria-label="Gün">
          <option value="">Gün</option>
          {Array.from({ length: 31 }).map((_, i) => {
            const d = String(i + 1).padStart(2, '0');
            return <option key={d} value={d}>{d}</option>;
          })}
        </select>
        <select value={im} onChange={(e) => emit(iy, e.target.value, idd)} className="select" aria-label="Ay">
          <option value="">Ay</option>
          {months.map((m, idx) => (
            <option key={m} value={m}>{monthLabels[idx]}</option>
          ))}
        </select>
        <select value={iy} onChange={(e) => emit(e.target.value, im, idd)} className="select" aria-label="Yıl">
          <option value="">Yıl</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    );
  };
  const isoToDmy = (val?: string | null) => {
    if (!val) return undefined;
    const s = String(val).trim();
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (!iso.test(s)) return s; // zaten dmy olabilir
    const [y, m, d] = s.split('-');
    return `${d}-${m}-${y}`;
  };
  const dmyToIso = (val?: string | null) => {
    if (!val) return '';
    const s = String(val).trim();
    const dmy = /^\d{2}-\d{2}-\d{4}$/;
    if (!dmy.test(s)) return s; // iso olabilir
    const [d, m, y] = s.split('-');
    return `${y}-${m}-${d}`;
  };
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    brand: '',
    model: '',
    year: '',
    plate: '',
    engine_type: '',
    kilometre: '',
    periodic_due_km: '',
    periodic_due_date: '',
    last_maintenance_notes: '',
    // Reminder channels are email-only for now
    inspection_expiry: '',
    exhaust_emission_date: '',
    insp_rem_sms: false,
    insp_rem_email: false,
    insp_rem_push: false,
    tire_change_date: '',
    traffic_insurance_expiry: '',
    casco_expiry: '',
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const startCreate = () => { resetForm(); setMode('create'); };
  const cancelEdit = () => { setMode('list'); resetForm(); };

  const resetForm = () => {
    setForm({
      brand: '', model: '', year: '', plate: '', engine_type: '', kilometre: '',
      periodic_due_km: '', periodic_due_date: '', last_maintenance_notes: '',
      inspection_expiry: '', exhaust_emission_date: '',
      insp_rem_sms: false, insp_rem_email: false, insp_rem_push: false,
      tire_change_date: '', traffic_insurance_expiry: '', casco_expiry: ''
    });
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        brand: form.brand,
        model: form.model,
        year: form.year ? Number(form.year) : undefined,
        plate: form.plate || undefined,
        engine_type: form.engine_type || undefined,
        kilometre: form.kilometre ? Number(form.kilometre) : undefined,
        periodic_due_km: form.periodic_due_km ? Number(form.periodic_due_km) : undefined,
        periodic_due_date: isoToDmy(form.periodic_due_date), // dd-mm-YYYY gönder
        last_maintenance_notes: form.last_maintenance_notes || undefined,
        inspection_expiry: isoToDmy(form.inspection_expiry),
        exhaust_emission_date: isoToDmy(form.exhaust_emission_date),
        tire_change_date: isoToDmy(form.tire_change_date),
        traffic_insurance_expiry: isoToDmy(form.traffic_insurance_expiry),
        casco_expiry: isoToDmy(form.casco_expiry),
      };
      if (mode === 'create') {
        await api.createVehicle(payload);
      } else if (mode === 'edit' && selectedId) {
        await api.updateVehicle(selectedId, payload);
      }
      // Refresh list and go back to list mode
      await loadVehicles();
      setMode('list');
    } catch (err) {
      console.error('Araç oluşturulamadı', err);
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await api.listVehicles();
      const items = res?.data || res;
      if (Array.isArray(items)) {
        setVehicles(items);
        if (items.length > 0) {
          setSelectedId((prev) => prev && items.find((x:any)=>x.id===prev) ? prev : items[0].id);
        } else {
          setSelectedId(null);
        }
      }
    } catch (e) {
      setVehicles([]);
      setSelectedId(null);
    }
  };

  // İlk yükleme
  useEffect(() => { loadVehicles(); }, []);

  const selectedVehicle = vehicles.find((v:any) => v.id === selectedId) || null;

  const onEditCard = (v:any) => {
    setSelectedId(v.id);
    setForm({
      brand: v.brand || '',
      model: v.model || '',
      year: v.year ? String(v.year) : '',
      plate: '', // API plate dönmez
      engine_type: v.engine_type || '',
      kilometre: v.kilometre ? String(v.kilometre) : '',
      periodic_due_km: v.periodic_due_km ? String(v.periodic_due_km) : '',
      periodic_due_date: dmyToIso(v.periodic_due_date) || '',
      last_maintenance_notes: v.last_maintenance_notes || '',
      inspection_expiry: dmyToIso(v.inspection_expiry) || '',
      exhaust_emission_date: dmyToIso(v.exhaust_emission_date) || '',
      insp_rem_sms: false, insp_rem_email: false, insp_rem_push: false,
      tire_change_date: dmyToIso(v.tire_change_date) || '',
      traffic_insurance_expiry: dmyToIso(v.traffic_insurance_expiry) || '',
      casco_expiry: dmyToIso(v.casco_expiry) || '',
    });
    setMode('edit');
  };

  const onDeleteCard = async (id:number) => {
    try {
      await api.deleteVehicle(id);
      await loadVehicles();
      setMode('list');
    } catch (e) {
      console.error('Araç silinemedi', e);
    }
  };

  const onDeletePrompt = (id: number) => {
    const t = toast.warning('Bu aracı silmek istediğinize emin misiniz?', {
      action: {
        label: 'Sil',
        onClick: () => { toast.dismiss(t); onDeleteCard(id); },
      },
      cancel: {
        label: 'İşlemi İptal Et',
        onClick: () => toast.dismiss(t),
      },
      closeButton: true,
      description: 'Bu işlem geri alınamaz.',
    });
  };

  return (
    <section style={{ paddingTop: 0 }}>
      <div className="container">
        <h1 className="sectionTitle">Aracım</h1>

        <div className="aracim-layout">
          {/* Sol: Araç Kartları */}
          <div>
            <div className="form-actions aracim-list-actions">
              <strong>Araçlarım</strong>
              <button type="button" className="btn-dark" onClick={startCreate}>Araç Ekle</button>
            </div>

            {vehicles.length === 0 && (
              <p style={{ color: 'var(--text-muted)' }}>Henüz kayıtlı araç bilginiz yok.</p>
            )}

            <div className="aracim-list">
              {vehicles.map((v:any) => (
                <div key={v.id} className={`aracim-card ${selectedId===v.id ? 'aracim-card--active' : ''}`}>
                  <div className="aracim-card-header">
                    <div style={{ cursor: 'pointer' }} onClick={() => setSelectedId(v.id)}>
                      <div className="aracim-card-title">{v.brand || '-'} {v.model || ''} {v.year ? `(${v.year})` : ''}</div>
                      <div className="aracim-card-meta">Motor: {v.engine_type_display || v.engine_type || '-'} · Km: {v.kilometre ?? '-'}</div>
                    </div>
                    <div className="aracim-card-actions">
                      <button type="button" className="btn-light" onClick={() => onEditCard(v)}>Düzenle</button>
                      <button type="button" className="btn-light btn-danger" onClick={() => onDeletePrompt(v.id)}>Sil</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ: Detay ya da Form */}
          <div>
            {mode === 'list' && selectedVehicle && (
              <div className="aracim-detail-grid">
                <div className="aracim-detail-card">
                  <h3 className="aracim-detail-title">Araç Bilgileri</h3>
                  <div className="aracim-detail-table">
                    <div><strong>Marka</strong></div><div>{selectedVehicle.brand || '-'}</div>
                    <div><strong>Model</strong></div><div>{selectedVehicle.model || '-'}</div>
                    <div><strong>Yıl</strong></div><div>{selectedVehicle.year || '-'}</div>
                    <div><strong>Motor Tipi</strong></div><div>{selectedVehicle.engine_type_display || selectedVehicle.engine_type || '-'}</div>
                    <div><strong>Kilometre</strong></div><div>{selectedVehicle.kilometre ?? '-'}</div>
                  </div>
                </div>
                <div className="aracim-detail-card">
                  <h3 className="aracim-detail-title">Bakım Takibi</h3>
                  <div className="aracim-detail-table">
                    <div><strong>Periyodik Bakım (KM)</strong></div><div>{selectedVehicle.periodic_due_km ?? '-'}</div>
                    <div><strong>Periyodik Bakım Tarihi</strong></div><div>{selectedVehicle.periodic_due_date || '-'}</div>
                  <div><strong>Son Bakım Bilgileri</strong></div><div>{selectedVehicle.last_maintenance_notes || '-'}</div>
                  </div>
                </div>
                <div className="aracim-detail-card">
                  <h3 className="aracim-detail-title">Muayene Takibi</h3>
                  <div className="aracim-detail-table">
                    <div><strong>Muayene Geçerlilik</strong></div><div>{selectedVehicle.inspection_expiry || '-'}</div>
                    <div><strong>Egzoz Emisyon</strong></div><div>{selectedVehicle.exhaust_emission_date || '-'}</div>
                  </div>
                </div>
                <div className="aracim-detail-card">
                  <h3 className="aracim-detail-title">Lastik & Sigorta</h3>
                  <div className="aracim-detail-table">
                    <div><strong>Lastik Değişim</strong></div><div>{selectedVehicle.tire_change_date || '-'}</div>
                    <div><strong>Trafik Sigortası Bitiş</strong></div><div>{selectedVehicle.traffic_insurance_expiry || '-'}</div>
                    <div><strong>Kasko Bitiş</strong></div><div>{selectedVehicle.casco_expiry || '-'}</div>
                  </div>
                </div>
              </div>
            )}

            {(mode === 'create' || mode === 'edit') && (
              <>
                <p style={{ marginTop: 6, color: 'var(--text-muted)' }}>{mode === 'create' ? 'Yeni araç ekleyin.' : 'Araç bilgilerini düzenleyin.'}</p>

                <form onSubmit={save} style={{ marginTop: 22 }}>
                  <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                    <legend style={{ fontWeight: 800, marginBottom: 14 }}>Araç Bilgileri</legend>

                    <div className="formGroup">
                      <label htmlFor="brand">Marka</label>
                      <input id="brand" name="brand" type="text" placeholder="Örn: Toyota" value={form.brand} onChange={onChange} />
                    </div>

                    <div className="formGroup">
                      <label htmlFor="model">Model</label>
                      <input id="model" name="model" type="text" placeholder="Örn: Corolla" value={form.model} onChange={onChange} />
                    </div>

                    <div className="formGroup">
                      <label htmlFor="year">Yıl</label>
                      <input id="year" name="year" type="number" placeholder="Örn: 2020" min={1900} max={2100} value={form.year} onChange={onChange} />
                    </div>

                    <div className="formGroup">
                      <label htmlFor="plate">Plaka (Opsiyonel)</label>
                      <input id="plate" name="plate" type="text" placeholder="Örn: 34 ABC 123" value={form.plate} onChange={onChange} />
                      <div className="form-help">Plaka verisi gizli tutulur ve paylaşılmaz.</div>
                    </div>

                    <div className="formGroup">
                      <label htmlFor="engine_type">Motor Tipi</label>
                      <select id="engine_type" name="engine_type" className="select" value={form.engine_type} onChange={onChange}>
                        <option value="">Seçiniz</option>
                        <option value="benzin">Benzin</option>
                        <option value="dizel">Dizel</option>
                        <option value="hibrit">Hibrit</option>
                        <option value="elektrik">Elektrik</option>
                      </select>
                    </div>

                    <div className="formGroup">
                      <label htmlFor="kilometre">Kilometre</label>
                      <input id="kilometre" name="kilometre" type="number" placeholder="Örn: 45000" min={0} value={form.kilometre} onChange={onChange} />
                    </div>
                  </fieldset>

                  <fieldset style={{ border: 'none', padding: 0, marginTop: 26 }}>
                    <legend style={{ fontWeight: 800, marginBottom: 14 }}>Bakım Takibi</legend>

                    <div className="formGroup">
                      <label htmlFor="periodic_due_km">Periyodik Bakım (KM)</label>
                      <input id="periodic_due_km" name="periodic_due_km" type="number" placeholder="Örn: 60000" min={0} value={form.periodic_due_km} onChange={onChange} />
                      <div className="form-help">Örnek: Her 10.000 km veya yılda bir.</div>
                    </div>

                    <div className="formGroup">
                      <label htmlFor="periodic_due_date">Periyodik Bakım Tarihi</label>
                      <DateField id="periodic_due_date" name="periodic_due_date" value={form.periodic_due_date} onChange={onChange} />
                    </div>

                    <div className="formGroup">
                      <label htmlFor="last_maintenance_notes">Yapılan Son Bakım Bilgileri</label>
                      <textarea id="last_maintenance_notes" name="last_maintenance_notes" placeholder="Örn: Yağ değişimi, balata değişimi, akü değişimi..." value={form.last_maintenance_notes} onChange={onChange} />
                    </div>
                  </fieldset>

                  <fieldset style={{ border: 'none', padding: 0, marginTop: 26 }}>
                    <legend style={{ fontWeight: 800, marginBottom: 14 }}>Muayene Takibi</legend>

                    <div className="formGroup">
                      <label htmlFor="inspection_expiry">Araç Muayene Geçerlilik Tarihi</label>
                      <DateField id="inspection_expiry" name="inspection_expiry" value={form.inspection_expiry} onChange={onChange} />
                    </div>

                    <div className="formGroup">
                      <label htmlFor="exhaust_emission_date">Egzoz Emisyon Ölçüm Tarihi</label>
                      <DateField id="exhaust_emission_date" name="exhaust_emission_date" value={form.exhaust_emission_date} onChange={onChange} />
                    </div>
                  </fieldset>

                  <fieldset style={{ border: 'none', padding: 0, marginTop: 26 }}>
                    <legend style={{ fontWeight: 800, marginBottom: 14 }}>Lastik & Sigorta</legend>

                    <div className="formGroup">
                      <label htmlFor="tire_change_date">Lastik Değişim Tarihi (Yazlık/Kışlık)</label>
                      <DateField id="tire_change_date" name="tire_change_date" value={form.tire_change_date} onChange={onChange} />
                    </div>

                    <div className="formGroup">
                      <label htmlFor="traffic_insurance_expiry">Zorunlu Trafik Sigortası Bitiş</label>
                      <DateField id="traffic_insurance_expiry" name="traffic_insurance_expiry" value={form.traffic_insurance_expiry} onChange={onChange} />
                    </div>

                    <div className="formGroup">
                      <label htmlFor="casco_expiry">Kasko Bitiş</label>
                      <DateField id="casco_expiry" name="casco_expiry" value={form.casco_expiry} onChange={onChange} />
                    </div>
                  </fieldset>

                  <div className="form-actions" style={{ marginTop: 18 }}>
                    <button type="submit" className="btn-dark">Kaydet</button>
                    <button type="button" className="btn-light" onClick={cancelEdit}>İptal</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


