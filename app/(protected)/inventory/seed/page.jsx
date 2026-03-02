'use client'

import { useState } from 'react'
import { usePageTitle } from '../../../../hooks/usePageTitle'
import Button from '../../../../components/ui/Button'
import seedInventory, { seedInventoryItems } from '../../../../lib/seedInventoryData'
import seedInventoryWithStock, { seedItemsWithStock } from '../../../../lib/seedInventoryWithStock'
import seedAssets, { seedAssetItems } from '../../../../lib/seedAssets'

export default function SeedInventoryPage() {
  const { setTitle } = usePageTitle()
  const [isSeeding, setIsSeeding] = useState(false)
  const [isSeedingWithStock, setIsSeedingWithStock] = useState(false)
  const [isSeedingAssets, setIsSeedingAssets] = useState(false)
  const [isSeedingAll, setIsSeedingAll] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [result, setResult] = useState(null)
  const [resultWithStock, setResultWithStock] = useState(null)
  const [resultAssets, setResultAssets] = useState(null)
  const [resultAll, setResultAll] = useState(null)
  const [clearResult, setClearResult] = useState(null)

  useState(() => {
    setTitle('Seed Inventory Data')
  }, [setTitle])

  const handleSeed = async () => {
    if (!confirm(`This will add ${seedInventoryItems.length} items to your inventory. Continue?`)) {
      return
    }

    setIsSeeding(true)
    setResult(null)

    try {
      const seedResult = await seedInventory()
      setResult(seedResult)
    } catch (error) {
      console.error('Seed error:', error)
      setResult({ error: error.message })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleSeedWithStock = async () => {
    if (!confirm(`This will add ${seedItemsWithStock.length} items WITH STOCK to your inventory. Continue?`)) {
      return
    }

    setIsSeedingWithStock(true)
    setResultWithStock(null)

    try {
      const seedResult = await seedInventoryWithStock()
      setResultWithStock(seedResult)
    } catch (error) {
      console.error('Seed error:', error)
      setResultWithStock({ error: error.message })
    } finally {
      setIsSeedingWithStock(false)
    }
  }

  const handleSeedAssets = async () => {
    if (!confirm(`This will add ${seedAssetItems.length} equipment and furniture assets to your inventory. Continue?`)) {
      return
    }

    setIsSeedingAssets(true)
    setResultAssets(null)

    try {
      const seedResult = await seedAssets()
      setResultAssets(seedResult)
    } catch (error) {
      console.error('Seed error:', error)
      setResultAssets({ error: error.message })
    } finally {
      setIsSeedingAssets(false)
    }
  }

  const handleSeedAll = async () => {
    const totalItems = seedItemsWithStock.length + seedAssetItems.length
    if (!confirm(`This will add ${totalItems} items (${seedItemsWithStock.length} consumables with stock + ${seedAssetItems.length} assets) to your inventory. Continue?`)) {
      return
    }

    setIsSeedingAll(true)
    setResultAll(null)

    try {
      const inventoryApi = (await import('../../../../lib/inventoryApi')).default
      
      let consumablesSuccess = 0
      let assetsSuccess = 0
      let totalErrors = 0
      
      // Seed consumables with stock (without deleting)
      console.log('📦 Adding consumables with stock...')
      for (const item of seedItemsWithStock) {
        try {
          await inventoryApi.create({
            ...item,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          consumablesSuccess++
          console.log(`✅ Added: ${item.name}`)
        } catch (error) {
          totalErrors++
          console.error(`❌ Failed to add ${item.name}:`, error.message)
        }
      }
      
      // Seed assets (without deleting)
      console.log('🪑 Adding equipment and furniture assets...')
      for (const item of seedAssetItems) {
        try {
          await inventoryApi.create({
            ...item,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          assetsSuccess++
          console.log(`✅ Added: ${item.name}`)
        } catch (error) {
          totalErrors++
          console.error(`❌ Failed to add ${item.name}:`, error.message)
        }
      }
      
      // Combine results
      const combinedResult = {
        successCount: consumablesSuccess + assetsSuccess,
        errorCount: totalErrors,
        consumablesAdded: consumablesSuccess,
        assetsAdded: assetsSuccess
      }
      
      console.log('\n📊 Complete Seed Summary:')
      console.log(`✅ Total Success: ${combinedResult.successCount} items`)
      console.log(`   - Consumables: ${consumablesSuccess} items`)
      console.log(`   - Assets: ${assetsSuccess} items`)
      console.log(`❌ Errors: ${totalErrors} items`)
      
      setResultAll(combinedResult)
    } catch (error) {
      console.error('Seed error:', error)
      setResultAll({ error: error.message })
    } finally {
      setIsSeedingAll(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('⚠️ WARNING: This will DELETE ALL inventory data including items, assets, transactions, and activity logs. This action cannot be undone. Are you sure?')) {
      return
    }

    if (!confirm('Are you ABSOLUTELY sure? All your inventory data will be permanently deleted!')) {
      return
    }

    setIsClearing(true)
    setClearResult(null)

    try {
      const inventoryApi = (await import('../../../../lib/inventoryApi')).default
      
      // Get all items
      const allItems = await inventoryApi.getAll()
      
      let deletedCount = 0
      let errorCount = 0
      
      // Delete each item
      for (const item of allItems) {
        try {
          await inventoryApi.delete(item.id)
          deletedCount++
        } catch (error) {
          console.error(`Error deleting item ${item.id}:`, error)
          errorCount++
        }
      }
      
      setClearResult({
        success: true,
        deletedCount,
        errorCount,
        message: `Successfully deleted ${deletedCount} items${errorCount > 0 ? ` (${errorCount} errors)` : ''}`
      })
    } catch (error) {
      console.error('Clear error:', error)
      setClearResult({ 
        success: false,
        error: error.message 
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seed Inventory Data</h1>
          <p className="text-gray-600">
            Populate your inventory master list with common hotel items
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">What will be added:</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800">
                <strong>8</strong> Equipment items (TVs, ACs, etc.)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800">
                <strong>6</strong> Furniture items (Beds, Tables, etc.)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800">
                <strong>15</strong> Toiletries (Shampoo, Towels, etc.)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800">
                <strong>8</strong> Cleaning Supplies
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800">
                <strong>8</strong> Food & Beverage items
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800">
                <strong>6</strong> Office Supplies
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-blue-900 font-bold">
              Total: {seedInventoryItems.length} items
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This will add items to your master list with 0 stock. 
                You can adjust stock levels later from the Items page.
              </p>
            </div>
          </div>
        </div>

        {/* Clear All Data Button */}
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 mb-1">Clear All Inventory Data</p>
                <p className="text-xs text-red-700">
                  Delete all items, assets, and transactions. Use this before seeding fresh data.
                </p>
              </div>
            </div>
            <Button
              onClick={handleClearAll}
              disabled={isClearing || isSeeding || isSeedingWithStock || isSeedingAssets || isSeedingAll}
              className="bg-red-600 text-white hover:bg-red-700 ml-4"
            >
              {isClearing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Clearing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All Data
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Clear Result */}
        {clearResult && (
          <div className={`rounded-lg p-6 mb-6 ${
            clearResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {clearResult.success ? (
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Data Cleared Successfully!</h3>
                  <p className="text-green-800">{clearResult.message}</p>
                  <p className="text-sm text-green-700 mt-2">You can now seed fresh data using the buttons below.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
                  <p className="text-red-800">{clearResult.error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className={`rounded-lg p-6 mb-6 ${
            result.error 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            {result.error ? (
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
                  <p className="text-red-800">{result.error}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Seed Completed!</h3>
                  <div className="space-y-1 text-green-800">
                    <p>✓ Successfully added: <strong>{result.successCount}</strong> items</p>
                    {result.errorCount > 0 && (
                      <p>✗ Failed: <strong>{result.errorCount}</strong> items</p>
                    )}
                    <p className="mt-3 text-sm">
                      You can now view and manage these items in the Items page.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col space-y-3">
          {/* Main "Seed Everything" Button */}
          <div className="flex justify-center mb-4">
            <Button
              onClick={handleSeedAll}
              disabled={isSeeding || isSeedingWithStock || isSeedingAssets || isSeedingAll}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 px-12 py-4 text-xl font-bold shadow-lg"
            >
              {isSeedingAll ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Seeding Everything...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Seed Everything (Consumables + Assets)
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 mb-2">Or seed individually:</div>

          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleSeed}
              disabled={isSeeding || isSeedingWithStock || isSeedingAssets || isSeedingAll}
              variant="secondary"
              className="px-8 py-3 text-lg"
            >
              {isSeeding ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Seeding... ({seedInventoryItems.length} items)
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Seed Master List (No Stock)
                </>
              )}
            </Button>

            <Button
              onClick={handleSeedWithStock}
              disabled={isSeeding || isSeedingWithStock || isSeedingAssets || isSeedingAll}
              className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 text-lg"
            >
              {isSeedingWithStock ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Seeding... ({seedItemsWithStock.length} items)
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9l3-2 3 2v12" />
                  </svg>
                  Seed Consumables WITH Stock
                </>
              )}
            </Button>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleSeedAssets}
              disabled={isSeeding || isSeedingWithStock || isSeedingAssets || isSeedingAll}
              className="bg-black text-white hover:bg-gray-800 px-8 py-3 text-lg"
            >
              {isSeedingAssets ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Seeding... ({seedAssetItems.length} assets)
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Seed Assets Only
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Result for "Seed Everything" */}
        {resultAll && (
          <div className={`rounded-lg p-6 mt-6 ${
            resultAll.error 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200'
          }`}>
            {resultAll.error ? (
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
                  <p className="text-red-800">{resultAll.error}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">🎉 Complete Seed Successful!</h3>
                  <div className="space-y-2 text-purple-800">
                    <p>✓ Total items added: <strong>{resultAll.successCount}</strong></p>
                    <div className="pl-4 space-y-1 text-sm">
                      <p>• Consumables with stock: <strong>{resultAll.consumablesAdded}</strong></p>
                      <p>• Assets (Equipment & Furniture): <strong>{resultAll.assetsAdded}</strong></p>
                    </div>
                    {resultAll.errorCount > 0 && (
                      <p className="text-red-600">✗ Failed: <strong>{resultAll.errorCount}</strong> items</p>
                    )}
                    <p className="mt-3 text-sm bg-white/50 p-3 rounded">
                      <strong>Your inventory is ready!</strong> You can now:
                      <br/>• View consumables in the Items page
                      <br/>• Assign assets to rooms from the Assets page
                      <br/>• Create bundles for housekeeping
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result for items with stock */}
        {resultWithStock && (
          <div className={`rounded-lg p-6 mt-6 ${
            resultWithStock.error 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            {resultWithStock.error ? (
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
                  <p className="text-red-800">{resultWithStock.error}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Seed with Stock Completed!</h3>
                  <div className="space-y-1 text-green-800">
                    <p>✓ Successfully added: <strong>{resultWithStock.successCount}</strong> items with stock</p>
                    {resultWithStock.errorCount > 0 && (
                      <p>✗ Failed: <strong>{resultWithStock.errorCount}</strong> items</p>
                    )}
                    <p className="mt-3 text-sm">
                      Items have been added with stock levels. Check the Inventory page to view them.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result for assets */}
        {resultAssets && (
          <div className={`rounded-lg p-6 mt-6 ${
            resultAssets.error 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            {resultAssets.error ? (
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
                  <p className="text-red-800">{resultAssets.error}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Asset Seed Completed!</h3>
                  <div className="space-y-1 text-green-800">
                    <p>✓ Successfully added: <strong>{resultAssets.successCount}</strong> assets</p>
                    {resultAssets.errorCount > 0 && (
                      <p>✗ Failed: <strong>{resultAssets.errorCount}</strong> assets</p>
                    )}
                    <p className="mt-3 text-sm">
                      Equipment and furniture master items have been added. You can now assign them to rooms from the Assets page.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
