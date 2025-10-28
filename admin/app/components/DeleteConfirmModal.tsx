'use client'

import { useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  itemName: string
  itemDetails?: {
    id?: number
    name?: string
    email?: string
    display_name?: string
    company_title?: string
    vendor?: string
    comment?: string
    [key: string]: string | number | undefined
  }
  description?: string
  warningMessage?: string
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemDetails,
  description,
  warningMessage
}: DeleteConfirmModalProps) {
  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  // Modal açıkken body scroll'u engelle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="ml-4 text-xl font-semibold text-gray-900">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="space-y-4">
              {/* Warning Box */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Uyarı: Geri Alınamaz İşlem</p>
                <p className="text-sm text-red-700">
                  {warningMessage || `Bu ${itemName} kalıcı olarak silinecektir. Bu işlem geri alınamaz ve tüm veriler kaybolacaktır.`}
                </p>
              </div>

              {/* Description */}
              {description && (
                <p className="text-gray-700">{description}</p>
              )}

              {/* Item Details */}
              {itemDetails && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Silinecek Öğe Detayları:</h4>
                  <div className="space-y-1">
                    {itemDetails.id && (
                      <p className="text-sm text-gray-600">ID: <span className="font-medium">{itemDetails.id}</span></p>
                    )}
                    {itemDetails.name && (
                      <p className="text-sm text-gray-600">Ad: <span className="font-medium">{itemDetails.name}</span></p>
                    )}
                    {itemDetails.email && (
                      <p className="text-sm text-gray-600">E-posta: <span className="font-medium">{itemDetails.email}</span></p>
                    )}
                    {itemDetails.display_name && (
                      <p className="text-sm text-gray-600">Görünen Ad: <span className="font-medium">{itemDetails.display_name}</span></p>
                    )}
                    {itemDetails.company_title && (
                      <p className="text-sm text-gray-600">Şirket Unvanı: <span className="font-medium">{itemDetails.company_title}</span></p>
                    )}
                    {itemDetails.vendor && (
                      <p className="text-sm text-gray-600">Esnaf: <span className="font-medium">{itemDetails.vendor}</span></p>
                    )}
                    {itemDetails.comment && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Yorum:</p>
                        <p className="text-sm text-gray-900 bg-white p-2 rounded border border-gray-200 mt-1 max-h-32 overflow-y-auto">
                          {itemDetails.comment}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Dikkat:</strong> Bu işlem sonrasında:
                </p>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>Tüm hesap/veri bilgileri kalıcı olarak silinir</li>
                  <li>İlişkili tüm veriler kaybolur</li>
                  <li>Bu işlem geri alınamaz</li>
                  <li>Yedekleme bulunmuyorsa veriler kurtarılamaz</li>
                  <li>Sistem logları korunur (güvenlik amaçlı)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal (ESC)
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Evet, Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

