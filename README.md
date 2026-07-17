# FaceFit 💇‍♀️✨

A beautiful beauty and hair services booking application built with React Native and Expo.

## Overview
test lang po hehehe

FaceFit is a modern platform that connects customers with professional hairstylists and beauty service providers. The app features a pinkish, elegant UI design with complete authentication and role-based dashboards.

### Key Features

- ✨ **Modern Pink Theme** - Beautiful, modern pinkish color scheme throughout
- 👤 **Multi-Role Support** - Customer, Hairstylist, and Admin roles
- 🔐 **Secure Authentication** - Login and signup with role selection
- 📱 **Responsive Dashboards** - Customized dashboard for each user role
- 📅 **Appointment Management** - Book, manage, and track appointments
- ⭐ **Rating & Reviews** - Customer ratings and service feedback
- 💰 **Earnings Tracking** - Stylists can track their earnings
- 🎯 **Admin Controls** - System-wide management and monitoring

## Project Structure

> **Current architecture:** The active customer, stylist, and salon-owner flows are consolidated in `app/index.tsx`. The old mock `/dashboard` route and its separate role-specific dashboard files have been removed. Some older sections below are retained as historical project notes.

```
FaceFit/
├── app/
│   ├── index.tsx                 # Welcome/splash screen
│   ├── _layout.tsx              # Root navigation layout with auth provider
│   ├── login.tsx                # Login screen
│   ├── signup.tsx               # Sign up with role selection
│   ├── dashboard.tsx            # Main dashboard router
│   ├── dashboard-customer.tsx   # Customer dashboard
│   ├── dashboard-hairstylist.tsx# Hairstylist dashboard
│   ├── dashboard-admin.tsx      # Admin dashboard
│   └── (tabs)/                  # Tab navigation (legacy)
├── components/                  # Reusable UI components
├── context/
│   └── auth-context.tsx        # Authentication context provider
├── constants/
│   └── theme.ts                # Pinkish theme colors and styles
└── hooks/                       # Custom React hooks
```

## Authentication Flow

1. **Welcome Screen** - Initial landing page with app features
2. **Login** - Existing users can sign in with email/password
3. **Sign Up** - New users can create account and choose role:
   - **Customer** - Looking for beauty & hair services
   - **Hairstylist** - Offering beauty & hair services
   - **Admin** - System administrator (special access)
4. **Personalized Dashboard** - Role-specific dashboard displays

## User Roles & Dashboards

### 👤 Customer Dashboard
- Browse available services
- View favorite hairstylists
- Book appointments
- Track appointment history
- Rate and review services
- View personal statistics (appointments, favorites, rating)

### 💇 Hairstylist Dashboard
- Manage appointments
- View client information
- Track earnings
- Update availability
- Manage service offerings
- View performance metrics

### 🛡️ Admin Dashboard
- System overview and metrics
- Manage users and hairstylists
- View support tickets
- Monitor system health
- Manage services and categories
- View recent system activity

## Theme & Styling

The app uses a beautiful pinkish color scheme:

- **Primary Pink**: #E91E63
- **Light Pink**: #F06292
- **Dark Pink**: #C2185B
- **Accent Pink**: #FF69B4

Colors are defined in `constants/theme.ts` with light and dark mode support.

## Getting Started

### Prerequisites

- Node.js (14+)
- npm or yarn
- Expo CLI
- Expo Go app (for mobile testing)

### Installation

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Scan the QR code with your phone to open in Expo Go, or:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser

## Testing the App

### Test Credentials

Since authentication is mocked, you can use any email/password combination:

- Email: `test@example.com`
- Password: `password`

### Test Role Selection

During sign-up, choose your role:
- **Customer** - See the customer dashboard
- **Hairstylist** - See the stylist dashboard

**Note:** Admin dashboard requires manual role assignment in the auth context for testing.

## Key Screens & Navigation

| Screen | Route | Description |
|--------|-------|-------------|
| Welcome | `/` | Initial landing page |
| Login | `/login` | User login form |
| Sign Up | `/signup` | Registration with role selection |
| Dashboard | `/dashboard` | Role-based dashboard router |
| Customer Dashboard | `/dashboard-customer` | Customer UI |
| Hairstylist Dashboard | `/dashboard-hairstylist` | Stylist UI |
| Admin Dashboard | `/dashboard-admin` | Admin UI |

## Authentication Context

The app uses a context-based authentication system (`context/auth-context.tsx`):

```typescript
interface AuthContextType {
  isSignedIn: boolean;
  userRole: 'user' | 'hairstylist' | 'admin' | null;
  userName: string;
  login: (email, password, role) => void;
  signUp: (email, password, name, role) => void;
  logout: () => void;
}
```

## Component Dependencies

- **expo-router** - File-based routing
- **react-native** - Core UI framework
- **expo-image** - Image handling
- **@react-navigation** - Navigation libraries
- **expo-haptics** - Haptic feedback

## Development

### Creating New Screens

1. Create a new file in `app/` directory
2. Import themed components and styling
3. Use `useAuth()` hook for auth context
4. Use `useColorScheme()` for theme colors
5. Use `useRouter()` for navigation

### Styling

All components use the theme colors from `constants/theme.ts`. Use the `useColorScheme()` hook to access colors:

```typescript
const colors = Colors[colorScheme ?? 'light'];
```

### Adding Features

To add new features:
1. Create components in `components/`
2. Add screens in `app/`
3. Update navigation in `app/_layout.tsx`
4. Use context for shared state

## Future Enhancements

- Real payment integration
- Push notifications
- Video call consultations
- Appointment reminders
- Social features (follow stylists, share posts)
- Backend API integration
- Real-time chat support
- Advanced analytics

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Docs](https://expo.dev/routing)

## Support

For issues or questions, please reach out or create an issue in the repository.

---

**FaceFit** - Your Beauty & Hair Solution ✨💇‍♀️
