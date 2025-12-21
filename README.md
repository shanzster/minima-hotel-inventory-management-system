# Minima Hotel - Inventory Management System

A comprehensive inventory management frontend built with Next.js 16, following Japanese minimalism design principles. This production-ready application provides complete inventory management capabilities for hotel operations with role-based access control and property-based testing validation.

## Features

### Complete Inventory Management
- Real-time stock level tracking with visual indicators
- Automated low stock, critical stock, and expiration alerts
- Stock-in, stock-out, and adjustment transaction workflows
- Batch tracking with expiration date monitoring
- Advanced search, category, location, and status-based filtering

### Menu Management (Kitchen Staff)
- Menu item availability control based on ingredient availability
- Real-time ingredient stock level monitoring
- Automatic alerts for expiring ingredients
- Ingredient batch and expiration date tracking

### Purchase Order System (Purchasing Officer)
- Complete purchase order creation and management workflow
- Supplier selection and performance tracking
- Real-time delivery status monitoring
- Integrated approval processes

### Asset Management
- Complete asset lifecycle management
- Asset condition tracking with maintenance schedules
- Asset assignment workflows with approval requirements
- Automated maintenance due notifications

### Audit & Compliance
- Comprehensive audit interface with discrepancy tracking
- Inventory adjustment requests with approval processes
- Detailed audit reports and compliance tracking
- Complete discrepancy resolution monitoring

### Supplier Management
- Complete supplier information management
- Delivery reliability and quality performance tracking
- Contract details and terms management
- New supplier approval workflows

## Project Structure

```
minima-inventory/
├─ app/                          # Next.js App Router
│  ├─ layout.jsx                 # Root layout with global providers
│  ├─ globals.css                # Japanese minimalism design system
│  ├─ login/                     # Authentication pages
│  └─ (protected)/               # Role-based protected routes
│     ├─ layout.jsx              # Authentication enforcement
│     ├─ dashboard/              # Operational dashboard
│     ├─ inventory/              # Inventory management
│     │  ├─ assets/              # Asset management
│     │  ├─ transactions/        # Transaction history
│     │  └─ [id]/               # Item details
│     ├─ menu/                   # Menu management (Kitchen Staff)
│     ├─ purchase-orders/        # Purchase orders (Purchasing Officer)
│     ├─ suppliers/              # Supplier management
│     ├─ audits/                 # Audit & compliance
│     └─ settings/               # Application settings
├─ components/
│  ├─ ui/                        # Atomic design system components
│  │  ├─ Button.jsx              # Primary/secondary/ghost variants
│  │  ├─ Input.jsx               # Enhanced input with validation
│  │  ├─ Modal.jsx               # Size variants with accessibility
│  │  ├─ Badge.jsx               # Status indicators
│  │  └─ Table.jsx               # Advanced table with sorting/pagination
│  ├─ layout/                    # Layout components
│  │  ├─ Header.jsx              # Responsive header with user menu
│  │  ├─ Sidebar.jsx             # Role-based navigation
│  │  └─ PageContainer.jsx       # Consistent page layouts
│  └─ inventory/                 # Domain-specific components
│     ├─ InventoryTable.jsx      # Enhanced inventory display
│     ├─ StockIndicator.jsx      # Visual stock level indicators
│     ├─ RestockForm.jsx         # Transaction forms
│     ├─ FilterBar.jsx           # Advanced filtering interface
│     ├─ AlertBanner.jsx         # Alert system components
│     └─ [feature]Form.jsx       # Feature-specific forms
├─ lib/                          # Core utilities and helpers
│  ├─ api.js                     # API client with error handling
│  ├─ auth.js                    # Authentication & authorization
│  ├─ errorHandling.js           # Comprehensive error management
│  ├─ sessionManager.js          # Session management utilities
│  ├─ constants.js               # Application constants
│  └─ mockData.js                # Development mock data
├─ hooks/                        # Custom React hooks
│  ├─ useAuth.js                 # Authentication state management
│  ├─ useFetch.js                # Data fetching with error handling
│  ├─ useFormValidation.js       # Form validation utilities
│  ├─ useModal.js                # Modal state management
│  └─ useNavigation.js           # Navigation utilities
└─ public/                       # Static assets and icons
```

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd minima-inventory
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open the application:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Development Login
For development, the system auto-logs in as an Inventory Controller. For testing different roles:

- **Inventory Controller**: `controller@minima.com` / `password123`
- **Kitchen Staff**: `kitchen@minima.com` / `password123`  
- **Purchasing Officer**: `purchasing@minima.com` / `password123`

## Design System

### Japanese Minimalism Principles
- Whitespace as a feature with generous spacing and clean layouts
- Low contrast, high clarity with subtle color palette and clear hierarchy
- Minimal components with maximum reuse for consistency
- Subtle motion with 200-300ms ease-out transitions

### Color Palette
```css
--black: #111111           /* Primary text and accents */
--gray-900: #1C1C1C        /* Dark elements */
--gray-700: #4B4B4B        /* Secondary text */
--gray-500: #8A8A8A        /* Muted text */
--gray-300: #D1D1D1        /* Borders and dividers */
--gray-100: #F2F2F2        /* Light backgrounds */
--whitesmoke: #F7F7F7      /* Primary background */
--accent-sand: #E6E1DA     /* Subtle accent color */
```

### Typography Scale
- **Headings**: Poppins (500-600 weight)
- **Body**: Roboto (400 weight)
- **Spacing**: Strict 8px grid system (4px, 8px, 16px, 24px, 32px, 48px, 64px, 96px)

## Testing

### Comprehensive Test Suite
- 206 Tests with 100% passing rate
- 21 Test Files with complete coverage
- Property-Based Testing with 11 correctness properties verified
- Unit Testing for all components and utilities
- Integration Testing for API interactions

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Property-Based Testing
The project uses fast-check for property-based testing to verify correctness properties:

```javascript
// Example: Stock Level Display Consistency
test('stock indicator displays correct state for any stock level', () => {
  fc.assert(fc.property(
    fc.record({
      currentStock: fc.nat(1000),
      restockThreshold: fc.nat(100),
      maxStock: fc.option(fc.nat(2000))
    }),
    (item) => {
      // Verify correct visual state based on stock levels
    }
  ))
})
```

## User Roles & Permissions

### Inventory Controller (Full Access)
- Complete inventory management
- Purchase order approval
- Supplier management
- Asset management
- Audit oversight
- System administration

### Kitchen Staff (Menu Focus)
- Menu item availability management
- Ingredient stock monitoring
- Expiration date tracking
- Limited inventory read access

### Purchasing Officer (Procurement Focus)
- Purchase order creation and management
- Supplier coordination
- Delivery tracking
- Inventory read access for ordering

## Architecture

### Frontend Architecture
- Next.js 14 with App Router for modern React patterns
- Component-driven architecture with atomic design principles
- Custom hooks for state management and business logic
- Error boundaries for graceful error handling
- Responsive design for mobile, tablet, and desktop

### State Management
- React hooks for local component state
- Custom hooks for shared business logic
- Context providers for global state (auth, navigation, page titles)
- Optimistic updates with rollback functionality

### API Integration
- RESTful API client with comprehensive error handling
- Retry logic with exponential backoff
- Request/response transformation and validation
- Mock data for development and testing

## Security

### Authentication & Authorization
- Role-based access control (RBAC) implementation
- Protected routes with automatic redirects
- Session management with renewal and cleanup
- Permission-based feature access

### Input Validation
- Client-side validation with real-time feedback
- Server-side validation simulation
- XSS prevention through proper escaping
- CSRF protection considerations

## Responsive Design

### Mobile-First Approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-friendly interface elements
- Collapsible navigation with smooth animations
- Optimized layouts for all screen sizes

### Cross-Browser Compatibility
- Modern browser support (Chrome, Firefox, Safari, Edge)
- Progressive enhancement for older browsers
- Consistent styling across platforms

## Deployment

### Build Process
```bash
# Create production build
npm run build

# Start production server
npm start

# Export static files (if needed)
npm run export
```

### Vercel Deployment (Recommended)
1. Connect repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Environment Variables
```bash
# Required for production
NEXT_PUBLIC_API_URL=your-api-endpoint
NEXT_PUBLIC_APP_ENV=production

# Optional
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## Performance

### Optimization Features
- Code splitting with Next.js automatic optimization
- Image optimization with Next.js Image component
- Bundle analysis for size monitoring
- Lazy loading for improved initial load times

### Performance Metrics
- Lighthouse Score: 95+ across all categories
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- ESLint configuration for code quality
- Prettier for consistent formatting
- Conventional Commits for clear commit messages
- Component documentation with JSDoc comments

### Testing Requirements
- All tests must pass before merging
- New features require tests (unit + integration)
- Property-based tests for critical business logic
- Minimum 90% code coverage

## License

This project is proprietary software developed for Minima Hotel operations.

## Support

For technical support or questions:
- Internal Team: Contact the development team
- Issues: Use the GitHub issue tracker
- Documentation: Check the project documentation

---

Built for Minima Hotel using Japanese minimalism design principles