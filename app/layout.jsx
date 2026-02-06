import './globals.css'

export const metadata = {
  title: 'Minima Hotel - Inventory Management',
  description: 'Comprehensive inventory management system for Minima Hotel',
  icons: {
    icon: '/icons/images/logo.png',
    shortcut: '/icons/images/logo.png',
    apple: '/icons/images/logo.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}