'use client'

import { useState, useRef, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function ImageEditor({ isOpen, onClose, imageUrl, onSave }) {
  const canvasRef = useRef(null)
  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [scale, setScale] = useState(1)
  const [image, setImage] = useState(null)

  useEffect(() => {
    if (imageUrl && isOpen) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        setImage(img)
        drawImage(img, rotation, brightness, contrast, scale)
      }
      img.src = imageUrl
    }
  }, [imageUrl, isOpen])

  useEffect(() => {
    if (image) {
      drawImage(image, rotation, brightness, contrast, scale)
    }
  }, [rotation, brightness, contrast, scale, image])

  const drawImage = (img, rot, bright, cont, scl) => {
    const canvas = canvasRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    
    // Set canvas size
    canvas.width = 600
    canvas.height = 400

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Save context state
    ctx.save()

    // Move to center
    ctx.translate(canvas.width / 2, canvas.height / 2)
    
    // Apply rotation
    ctx.rotate((rot * Math.PI) / 180)
    
    // Apply scale
    ctx.scale(scl, scl)

    // Calculate dimensions to fit canvas
    const imgRatio = img.width / img.height
    const canvasRatio = canvas.width / canvas.height
    let drawWidth, drawHeight

    if (imgRatio > canvasRatio) {
      drawWidth = canvas.width * 0.9
      drawHeight = drawWidth / imgRatio
    } else {
      drawHeight = canvas.height * 0.9
      drawWidth = drawHeight * imgRatio
    }

    // Apply filters
    ctx.filter = `brightness(${bright}%) contrast(${cont}%)`

    // Draw image centered
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

    // Restore context
    ctx.restore()
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      const file = new File([blob], 'edited-image.jpg', { type: 'image/jpeg' })
      onSave(file)
      handleReset()
      onClose()
    }, 'image/jpeg', 0.95)
  }

  const handleReset = () => {
    setRotation(0)
    setBrightness(100)
    setContrast(100)
    setScale(1)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Image" size="3xl">
      <div className="space-y-6">
        {/* Canvas */}
        <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto border border-gray-300 rounded bg-white"
          />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Rotation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rotation: {rotation}°
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setRotation(r => r - 90)}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
              >
                ↶ 90°
              </button>
              <input
                type="range"
                min="-180"
                max="180"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1"
              />
              <button
                onClick={() => setRotation(r => r + 90)}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
              >
                ↷ 90°
              </button>
            </div>
          </div>

          {/* Brightness */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brightness: {brightness}%
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Contrast */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contrast: {contrast}%
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Zoom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zoom: {Math.round(scale * 100)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="ghost" onClick={handleReset}>
            Reset
          </Button>
          <div className="flex space-x-3">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-black text-white hover:bg-gray-800">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
