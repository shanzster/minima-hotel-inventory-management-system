import './globals.css'

export const metadata = {
  title: 'Minima Hotel - Inventory Management',
  description: 'Comprehensive inventory management system for Minima Hotel',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}