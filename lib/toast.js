// Simple toast notification utility
let toastContainer = null

const createToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2'
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

const createToast = (message, type = 'success') => {
  const container = createToastContainer()
  
  const toast = document.createElement('div')
  toast.className = 'animate-slide-in'
  
  const colors = {
    success: 'border-green-500 text-green-800',
    error: 'border-red-500 text-red-800',
    warning: 'border-amber-500 text-amber-800',
    info: 'border-blue-500 text-blue-800'
  }
  
  const icons = {
    success: `<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>`,
    error: `<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>`,
    warning: `<svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
    </svg>`,
    info: `<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>`
  }
  
  toast.innerHTML = `
    <div class="bg-white border-l-4 ${colors[type]} rounded-lg shadow-2xl p-4 max-w-md min-w-[300px]">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          ${icons[type]}
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium text-gray-900 whitespace-pre-line">${message}</p>
        </div>
        <button class="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors" onclick="this.parentElement.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  `
  
  container.appendChild(toast)
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(100%)'
    toast.style.transition = 'all 0.3s ease-out'
    setTimeout(() => toast.remove(), 300)
  }, 4000)
  
  return toast
}

export const toast = {
  success: (message) => createToast(message, 'success'),
  error: (message) => createToast(message, 'error'),
  warning: (message) => createToast(message, 'warning'),
  info: (message) => createToast(message, 'info')
}

export default toast
