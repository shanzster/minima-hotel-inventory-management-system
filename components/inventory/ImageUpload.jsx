'use client'

import { useState, useRef } from 'react'

export default function ImageUpload({ onImageUpload, imageUrl, imageAlt = 'Product', disabled = false }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME
  const cloudinaryPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudinaryCloudName || !cloudinaryPreset) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800 font-medium mb-2">
          ⚠️ Cloudinary configuration missing!
        </p>
        <p className="text-sm text-yellow-700">
          Please add these to your .env.local file:
        </p>
        <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto">
          NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dgwmpacf8
          NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=dsms_avatars
        </pre>
        <p className="text-xs text-yellow-600 mt-2">
          Then restart your dev server (npm run dev)
        </p>
      </div>
    )
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB')
      return
    }

    await uploadImage(file)
  }

  const uploadImage = async (file) => {
    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', cloudinaryPreset)
      formData.append('folder', 'hotel-inventory') // Store in inventory folder

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Your upload preset may not be set to UNSIGNED mode. Please check Cloudinary settings.')
        } else if (response.status === 400) {
          throw new Error('Bad request: Invalid file or upload preset.')
        } else {
          throw new Error(`Upload failed with status ${response.status}`)
        }
      }

      const data = await response.json()
      
      // Call the callback with the uploaded image URL and metadata
      onImageUpload({
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        size: data.bytes,
        format: data.format
      })

      setUploadError(null)
    } catch (error) {
      console.error('Image upload error:', error)
      setUploadError('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files.length > 0) {
      await uploadImage(files[0])
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Product Image
      </label>

      {/* Image Preview */}
      {imageUrl && (
        <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-full object-cover"
          />
          {!isUploading && !disabled && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <span className="text-white text-sm font-medium">Change Image</span>
            </button>
          )}
        </div>
      )}

      {/* Upload Area */}
      {!imageUrl && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
            isUploading
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-col items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700 mb-1">
              {isUploading ? 'Uploading...' : 'Drag image here or click to upload'}
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
              <div className="animate-spin">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading || disabled}
        className="hidden"
      />

      {/* Error Message */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{uploadError}</p>
        </div>
      )}
    </div>
  )
}
