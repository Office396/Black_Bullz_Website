# BlackBullz Website Clone

A complete gaming and software download website built with Next.js, featuring a dark theme with red accents.

## Features

### Core Functionality
- **Homepage**: Displays 12 items by default (15 for Android games layout)
- **Category Filtering**: PC Games, Android Games, Software with intelligent tab switching
- **Search System**: Intelligent search with category filters
- **Individual Game Pages**: Detailed information with category-specific requirements
- **Admin Portal**: Full CRUD operations with login authentication
- **Comments System**: User comments on individual game pages
- **Responsive Design**: Mobile-first approach with optimized layouts

### Admin Portal Features
- **Login System**: Secure admin authentication with changeable credentials
- **Flexible Forms**: Category-specific fields (system requirements for PC/Software, Android requirements for mobile games, key features for software only)
- **Item Management**: Add, edit, delete items with search functionality
- **Trending Control**: Checkbox to control what appears in trending section
- **Upload Date Tracking**: Automatic date tracking for new items

### Design Features
- **Custom Bull Logo**: Dangerous black bull with red horns
- **Loading Animation**: Running black bull video for page transitions
- **Dark Theme**: Gray/black background with red accent colors
- **Responsive Grid**: Adaptive layouts for different screen sizes
- **Visual Feedback**: Hover effects, transitions, and loading states

## File Structure

### Core Components
- `components/header.tsx` - Navigation header with logo and search
- `components/sidebar.tsx` - Trending games and quick links
- `components/game-grid.tsx` - Main grid display with pagination
- `components/game-details.tsx` - Individual game page layout
- `components/loading-screen.tsx` - Full-screen loading animation
- `components/loading-spinner.tsx` - Component-level loading indicator

### Admin Components
- `components/admin-login.tsx` - Authentication form
- `components/admin-dashboard.tsx` - Main admin interface
- `components/admin-item-form.tsx` - Add/edit item form with category-specific fields
- `components/admin-item-list.tsx` - Manage existing items with search
- `components/admin-settings.tsx` - Change admin credentials

### Pages
- `app/page.tsx` - Homepage with game grid
- `app/categories/page.tsx` - Category overview with counts
- `app/latest/page.tsx` - Latest releases
- `app/contact/page.tsx` - Contact form
- `app/search/page.tsx` - Search results with filters
- `app/game/[id]/page.tsx` - Individual game pages
- `app/admin/portal/page.tsx` - Admin portal entry

### Search & Filter Components
- `components/search-results.tsx` - Search results with category filters
- `components/comments.tsx` - User comments system

## How to Upload Items

1. **Access Admin Portal**: Navigate to `/admin/portal`
2. **Login**: Use admin credentials (default: admin/admin123)
3. **Add New Item**: Click "Add New Item" button
4. **Fill Form**: Complete category-specific fields:
   - **All Categories**: Title, category, developer, description, rating, image URL
   - **PC Games/Software**: System requirements (minimum/recommended)
   - **Android Games**: Android requirements (OS version, RAM, storage, processor)
   - **Software Only**: Key features list
5. **Set Trending**: Check "Show in Trending" to display in sidebar
6. **Add Downloads**: Provide download links with names and sizes
7. **Save**: Click "Save Item" to add to website

## Category-Specific Fields

### PC Games
- System Requirements (OS, Processor, Memory, Graphics, Storage)
- No key features section
- Full system specifications for minimum and recommended

### Android Games
- Android Requirements (OS version, RAM, Storage, Processor)
- No system requirements or key features
- Optimized for mobile specifications

### Software
- System Requirements (same as PC Games)
- Key Features list (unique selling points)
- Professional software specifications

## Data Storage

Items are stored in localStorage for demo purposes. In production, this would be replaced with a proper database system.

## Customization

### Changing Item Display Count
- Homepage: Modify `itemsPerPage` in `components/game-grid.tsx` (currently 12)
- Android Layout: Automatically shows 15 items when Android Games tab is active

### Modifying Admin Credentials
- Use the Settings tab in admin portal
- Default credentials: username: `admin`, password: `admin123`

### Adding New Categories
- Update category options in `components/admin-item-form.tsx`
- Add corresponding logic for category-specific fields
- Update tab filters in `components/game-grid.tsx`

## Technical Details

### Loading System
- Full-screen loading animation on initial page load
- Component-level loading for individual sections
- Running bull video animation for visual appeal

### Responsive Design
- Mobile-first approach with breakpoints
- Adaptive grid layouts (3-5 columns for Android, 2-4 for others)
- Optimized touch interactions for mobile devices

### Search Intelligence
- Searches titles, descriptions, and tags
- Category-specific filtering
- Real-time results with debouncing

This website provides a complete gaming and software download experience with professional admin management capabilities.
