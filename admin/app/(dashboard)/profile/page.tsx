'use client'

import { useAuth } from '../../contexts/AuthContext'
import { useState } from 'react'
import { updateAdminUser, changeAdminPassword } from '../../api/admin'
import ProtectedRoute from '../../components/ProtectedRoute'

export default function ProfilePage() {
  const { user } = useAuth()
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [currPwd, setCurrPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<string | null>(null)

  return (
    <ProtectedRoute requiredPermission="dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
          <p className="text-gray-600">Hesap bilgilerinizi görüntüleyin</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Profil Bilgileri</h2>
              <button
                onClick={() => {
                  setSaveMsg(null)
                  if (!editMode) {
                    setFirstName(user?.first_name || '')
                    setLastName(user?.last_name || '')
                    setEditMode(true)
                  } else {
                    setEditMode(false)
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                {editMode ? 'Düzenlemeyi İptal Et' : 'Düzenle'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Ad</label>
                {editMode ? (
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                ) : (
                  <p className="text-base font-medium text-gray-900">{user?.first_name || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Soyad</label>
                {editMode ? (
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                ) : (
                  <p className="text-base font-medium text-gray-900">{user?.last_name || '-'}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">E-posta</p>
                <p className="text-base font-medium text-gray-900">{user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rol</p>
                <p className="text-base font-medium text-gray-900">
                  {user?.is_superuser ? 'Süper Kullanıcı' : user?.is_staff ? 'Personel' : 'Kullanıcı'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                disabled={saving || !user || !editMode}
                onClick={async () => {
                  if (!user) return
                  setSaving(true)
                  setSaveMsg(null)
                  try {
                    await updateAdminUser(user.id, { first_name: firstName, last_name: lastName })
                    setSaveMsg('Profil güncellendi')
                    setEditMode(false)
                  } catch (e: unknown) {
                    setSaveMsg((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Güncelleme başarısız')
                  } finally {
                    setSaving(false)
                  }
                }}
                className="bg-[color:var(--yellow)] text-[color:var(--black)] px-4 py-2 rounded-lg hover:brightness-95 transition-colors disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              {saveMsg && <span className="text-sm text-gray-600">{saveMsg}</span>}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Şifre Değiştir</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Mevcut Şifre</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={currPwd}
                  onChange={(e) => setCurrPwd(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Yeni Şifre</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                disabled={pwdSaving || !currPwd || !newPwd}
                onClick={async () => {
                  setPwdSaving(true)
                  setPwdMsg(null)
                  try {
                    await changeAdminPassword(currPwd, newPwd)
                    setPwdMsg('Şifre güncellendi')
                    setCurrPwd(''); setNewPwd('')
                  } catch (e: unknown) {
                    setPwdMsg((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Şifre güncelleme başarısız')
                  } finally {
                    setPwdSaving(false)
                  }
                }}
                className="bg-[color:var(--yellow)] text-[color:var(--black)] px-4 py-2 rounded-lg hover:brightness-95 transition-colors disabled:opacity-50"
              >
                {pwdSaving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
              {pwdMsg && <span className="text-sm text-gray-600">{pwdMsg}</span>}
            </div>
          </div>

          
        </div>
      </div>
    </ProtectedRoute>
  )
}


