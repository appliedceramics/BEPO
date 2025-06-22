# Mobile Insulin Calculator

A mobile-first, progressive web application for insulin dose calculations designed to look and feel like a native mobile app.

## 🚀 Features

- **Mobile-First Design**: Optimized for smartphones with native app-like experience
- **Touch-Optimized Interface**: 44px+ buttons, haptic feedback, gesture-friendly interactions
- **Calculator Types**: First Meal, Other Meals, Bedtime, and 24-Hour insulin calculations
- **Settings Management**: Configurable insulin-to-carb ratios and sensitivity factors
- **Progressive Web App**: Install directly to home screen on mobile devices
- **Responsive Design**: Works seamlessly from mobile to desktop
- **Secure Authentication**: User accounts with session management
- **Real-time Calculations**: Instant insulin dose calculations based on blood glucose and carbs

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **Build Tool**: Vite
- **UI Components**: Radix UI, Shadcn/ui

## 📱 Mobile UX Features

- Safe area support for iPhone notch
- Prevented zoom on input focus
- Touch-optimized calculator keypad
- Haptic feedback simulation
- Native app styling and animations
- Gesture-friendly interactions
- Progressive Web App manifest

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/mobile-insulin-calculator.git
cd mobile-insulin-calculator
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Create .env file with your database URL
echo "DATABASE_URL=postgresql://username:password@localhost:5432/insulin_calculator" > .env
```

4. **Set up database**
```bash
npm run db:push
```

5. **Start development server**
```bash
npm run dev
```

6. **Open in browser**
Navigate to `http://localhost:5000`

## 📊 Calculator Types

### First Meal (Breakfast)
- Morning insulin calculation with customizable ratio
- Accounts for dawn phenomenon

### Other Meals (Lunch/Dinner)  
- Standard meal insulin calculation
- Configurable insulin-to-carb ratio

### Bedtime
- Correction-only insulin for nighttime
- No carb counting required

### 24-Hour (Long-Acting)
- Fixed long-acting insulin dosage
- Background insulin coverage

## ⚙️ Configuration

Access **Settings** to configure:
- Insulin-to-carb ratios for different meals
- Insulin sensitivity factor
- Target blood glucose range
- Correction factors
- Long-acting insulin dosage

## 📱 Mobile Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (⋮)
3. Select "Add to Home screen"
4. Tap "Add"

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - TypeScript type checking

### Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
├── server/                # Express backend
│   ├── auth.ts           # Authentication
│   ├── routes.ts         # API routes
│   └── db.ts             # Database connection
├── shared/               # Shared types/schemas
└── package.json
```

## 🔐 Security

- Password hashing with scrypt
- Session-based authentication
- CSRF protection
- Input validation with Zod
- SQL injection prevention with Drizzle ORM

## 🚀 Deployment

### Replit (Recommended)
1. Import repository to Replit
2. Set DATABASE_URL environment variable
3. Run `npm run db:push`
4. Deploy using Replit Deployments

### Manual Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run `npm run build`
4. Start with `npm run start`

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For support or questions, please open an issue on GitHub.

---

**Note**: This is a diabetes management tool for educational purposes. Always consult with healthcare professionals for medical decisions.