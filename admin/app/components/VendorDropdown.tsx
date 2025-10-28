'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { searchVendorsMinimal, type VendorSearchResult } from '../api/vendors'

interface VendorDropdownProps {
  value: string
  onChange: (vendorId: string) => void
  placeholder?: string
}

export default function VendorDropdown({ value, onChange, placeholder = 'Esnaf seçin' }: VendorDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [vendors, setVendors] = useState<VendorSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<VendorSearchResult | null>(null)
  const [displayText, setDisplayText] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync display text with selected value from parent
  useEffect(() => {
    if (!value) {
      setSelectedVendor(null)
      setDisplayText('')
      return
    }
    const existing = vendors.find(v => v.id.toString() === value)
    if (existing) {
      setSelectedVendor(existing)
      setDisplayText(existing.display_name)
    }
  }, [value, vendors])

  // Debounce helper
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery)
      } else {
        setVendors([])
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        if (selectedVendor) {
          setDisplayText(selectedVendor.display_name)
        } else {
          setDisplayText('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedVendor])

  const performSearch = async (query: string) => {
    if (query.length < 2) return

    setIsLoading(true)
    try {
      const data = await searchVendorsMinimal(query)
      setVendors(data.results)
      setIsOpen(true)
    } catch (error) {
      console.error('Error searching vendors:', error)
      setVendors([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (vendor: VendorSearchResult) => {
    setSelectedVendor(vendor)
    setDisplayText(vendor.display_name)
    onChange(vendor.id.toString())
    setSearchQuery('')
    setIsOpen(false)
  }

  const handleClear = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    setSelectedVendor(null)
    setDisplayText('')
    onChange('')
    setSearchQuery('')
    setVendors([])
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchQuery(newValue)
    setDisplayText(newValue)
    
    if (!newValue) {
      setSelectedVendor(null)
      onChange('')
    } else {
      setIsOpen(true)
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleInputBlur = () => {
    // Delay to allow click events on dropdown items
    setTimeout(() => {
      setIsOpen(false)
      if (selectedVendor) {
        setDisplayText(selectedVendor.display_name)
        setSearchQuery('')
      } else {
        setSearchQuery('')
      }
    }, 200)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={displayText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        {(selectedVendor || displayText) && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="px-4 py-2 text-gray-500">Yükleniyor...</div>
          ) : vendors.length === 0 && searchQuery.length >= 2 ? (
            <div className="px-4 py-2 text-gray-500">Sonuç bulunamadı</div>
          ) : (
            vendors.map((vendor) => (
              <button
                key={vendor.id}
                onClick={() => handleSelect(vendor)}
                onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                  selectedVendor?.id === vendor.id ? 'bg-yellow-50' : ''
                }`}
                type="button"
              >
                <div className="text-sm text-gray-900">{vendor.display_name}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

