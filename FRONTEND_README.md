# ERES Health Management DApp - Frontend

A fully functional, modern, and responsive frontend for the ERES Decentralized Healthcare Management System built with React.js and Web3 integration.

## 🚀 Features

### 🔐 User Authentication & Role Management

- **Wallet Integration**: MetaMask connection with automatic network switching
- **Role Detection**: Automatic detection of user roles (Admin, Doctor, Patient, Unregistered)
- **Smart Routing**: Role-based dashboard routing and access control
- **Registration System**: Separate registration flows for doctors and patients

### 👤 Patient Features

- **Patient Dashboard**: Comprehensive dashboard with overview, appointments, prescriptions, orders, and marketplace
- **Appointment Booking**: Easy appointment booking with available doctors
- **Prescription Management**: View prescribed medicines and medical history
- **Medicine Marketplace**: Browse and purchase medicines with quantity selection
- **Order Tracking**: Complete order history and tracking
- **Medical History**: Secure storage and access to medical records

### 👨‍⚕️ Doctor Features

- **Doctor Dashboard**: Professional dashboard with patient management and medicine administration
- **Appointment Management**: View and manage patient appointments
- **Prescription System**: Prescribe medicines to patients
- **Medicine Management**: Add, update, and manage medicine inventory
- **Patient Records**: Access and update patient medical history
- **Treatment Tracking**: Track successful treatments and appointments

### 🛡️ Admin Features

- **Admin Dashboard**: Complete system administration panel
- **Doctor Approval**: Approve or reject doctor registrations
- **User Management**: View all registered doctors, patients, and medicines
- **System Settings**: Update registration fees and admin addresses
- **Analytics**: System overview with statistics and metrics
- **Appointment Oversight**: Monitor all system appointments

### 💬 Communication Features

- **Chat System**: Real-time messaging between users
- **Friend List**: Manage contacts and conversations
- **Message History**: Complete conversation history
- **User Search**: Find and connect with other users

### 🔔 Notification System

- **Real-time Notifications**: Get notified about appointments, prescriptions, and system updates
- **Notification Categories**: Organized by type (appointment, prescription, medicine)
- **Read/Unread Management**: Mark notifications as read or unread
- **Filter Options**: Filter notifications by status

### 🏥 Healthcare Features

- **Doctor Directory**: Browse verified doctors with detailed profiles
- **Medicine Marketplace**: Secure medicine purchasing with blockchain verification
- **Appointment System**: Complete appointment booking and management
- **Prescription Tracking**: Digital prescription management
- **Medical Records**: Secure, immutable medical record storage

## 🛠️ Technology Stack

### Frontend

- **React.js 19.1.1**: Modern React with hooks and functional components
- **React Router DOM 7.8.2**: Client-side routing
- **React Icons 4.10.1**: Comprehensive icon library
- **React Hot Toast 2.4.1**: Beautiful toast notifications

### Web3 Integration

- **Ethers.js 5.7.2**: Ethereum blockchain interaction
- **Web3Modal 1.9.9**: Wallet connection management
- **MetaMask Integration**: Seamless wallet connectivity

### Styling & UI

- **CSS-in-JS**: Inline styles for component-specific styling
- **Responsive Design**: Mobile-first approach with grid layouts
- **Modern UI/UX**: Clean, professional healthcare-focused design
- **Accessibility**: WCAG compliant design patterns

### Data Management

- **IPFS Integration**: Decentralized file storage for images and metadata
- **Context API**: Global state management
- **Local Storage**: Client-side data persistence

## 📁 Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx              # Main role detection and routing
│   ├── RegisterUser.jsx           # User registration forms
│   ├── PatientDashboard.jsx       # Patient-specific dashboard
│   ├── DoctorDashboard.jsx        # Doctor-specific dashboard
│   ├── AdminDashboard.jsx         # Admin-specific dashboard
│   ├── ChatSystem.jsx             # Real-time messaging system
│   ├── NotificationSystem.jsx     # Notification management
│   ├── Doctors.jsx                # Doctor directory
│   ├── Marketplace.jsx            # Medicine marketplace
│   ├── About.jsx                  # About page
│   ├── PatientForm.jsx            # Patient portal
│   ├── Navbar.jsx                 # Navigation component
│   └── Footer.jsx                 # Footer component
├── Context/
│   ├── index.js                   # Context provider with all contract functions
│   ├── constants.js               # Contract constants and utility functions
│   └── Healthcare.json            # Smart contract ABI
├── App.jsx                        # Main application component
├── main.jsx                       # Application entry point
└── index.css                      # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MetaMask browser extension
- ETH for transaction fees

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Health-Management-Dapp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   NEXT_PUBLIC_HEALTH_CARE=your_contract_address
   NEXT_PUBLIC_ADMIN_ADDRESS=your_admin_address
   NEXT_PUBLIC_NETWORK=holesky
   NEXT_PUBLIC_PINATA_AIP_KEY=your_pinata_key
   NEXT_PUBLIC_PINATA_SECRECT_KEY=your_pinata_secret
   NEXT_PUBLIC_OPEN_AI_KEY=your_openai_key
   NEXT_PUBLIC_DOCTOR_REGISTER_FEE=0.01
   NEXT_PUBLIC_PATIENT_REGISTER_FEE=0.005
   NEXT_PUBLIC_PATIENT_APPOINMENT_FEE=0.001
   NEXT_PUBLIC_CURRENCY=ETH
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Usage Guide

### For New Users

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask connection
2. **Choose Registration**: Select "Register as Patient" or "Register as Doctor"
3. **Complete Registration**: Fill out the registration form and pay the registration fee
4. **Access Dashboard**: Once registered, you'll be redirected to your role-specific dashboard

### For Patients

1. **Dashboard Access**: View your medical overview, appointments, and prescriptions
2. **Book Appointments**: Browse doctors and book appointments
3. **Purchase Medicines**: Buy prescribed medicines from the marketplace
4. **Track Orders**: Monitor your medicine orders and delivery status
5. **Chat**: Communicate with your doctors through the chat system

### For Doctors

1. **Patient Management**: View and manage your patients
2. **Appointment Handling**: Process patient appointments and consultations
3. **Prescription Management**: Prescribe medicines to patients
4. **Medicine Inventory**: Add and manage medicine stock
5. **Medical Records**: Update patient medical history

### For Admins

1. **Doctor Approval**: Review and approve doctor registrations
2. **System Management**: Monitor all system activities
3. **Fee Management**: Update registration and appointment fees
4. **User Oversight**: View all registered users and their activities

## 🎨 Design Features

### Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Responsive grid layouts for tablets
- **Desktop Enhanced**: Full-featured desktop experience

### User Experience

- **Intuitive Navigation**: Clear, logical navigation structure
- **Loading States**: Proper loading indicators and error handling
- **Toast Notifications**: Real-time feedback for user actions
- **Form Validation**: Comprehensive form validation and error messages

### Visual Design

- **Healthcare Theme**: Professional medical color scheme
- **Card-Based Layout**: Clean, organized information display
- **Icon Integration**: Meaningful icons for better UX
- **Typography**: Readable, accessible typography

## 🔒 Security Features

- **Wallet Integration**: Secure MetaMask integration
- **Role-Based Access**: Proper access control for different user types
- **Data Encryption**: Secure data transmission and storage
- **Input Validation**: Comprehensive input validation and sanitization

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Brave

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the documentation
- Review the code comments
- Open an issue on GitHub

## 🔮 Future Enhancements

- Mobile application
- AI-powered health recommendations
- Wearable device integration
- Advanced analytics dashboard
- Multi-language support
- Voice-to-text features

---

**Built with ❤️ for the future of healthcare**

