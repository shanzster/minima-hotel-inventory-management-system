'use client'

export default function Error({ error, reset }) {
  return (
    <div className="p-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-heading font-medium mb-4 text-gray-900">
          Something went wrong
        </h2>
        <p className="text-gray-500 mb-6">
          {error.message || 'An error occurred while loading the inventory.'}
        </p>
        <button
          onClick={() => reset()}
          className="bg-black text-white hover:bg-gray-900"
        >
          Try again
        </button>
      </div>
    </div>
  )
}