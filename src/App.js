import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import DashboardPage from './pages/DashboardPage';
import RentACarPage from './pages/RentACarPage';
import MainLayout from './Layout/MainLayout';
import AddCar from './pages/AddCar';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// src/App.js
function App() {
	const [sidebarOpen, setSidebarOpen] = useState(true); // Change this line

	// Enhanced MainLayout to include sidebar state and toggle functionality
	const EnhancedMainLayout = ({ children }) => (
		<MainLayout
			open={sidebarOpen}
			handleDrawerOpen={() => setSidebarOpen(true)}
			handleDrawerClose={() => setSidebarOpen(false)}
		>
			{children}
		</MainLayout>
	);

	let theme = createTheme({
		palette: {
			primary: {
				main: '#0052cc',
			},
			secondary: {
				main: '#edf2ff',
			},
		},
		button: {
			primary: {
				color: 'white',
				backgroundColor: '#1976d2',
			},
		},
		icon: {
			primary: {
				color: '#0052cc',
			},
		},
	});

	theme = createTheme(theme, {
		palette: {
			info: {
				main: theme.palette.secondary.main,
			},
		},
	});

	theme = responsiveFontSizes(theme);


	return (
		<ThemeProvider theme={theme}>.
			<Router>
				<Routes>
					<Route path="/" element={<LoginPage />} />
					<Route
						path="/dashboard"
						element={<EnhancedMainLayout><DashboardPage /></EnhancedMainLayout>}
					/>
					<Route
						path="/rent-a-car"
						element={<EnhancedMainLayout><RentACarPage /></EnhancedMainLayout>}
					/>
					<Route
						path="/add-car"
						element={<EnhancedMainLayout><AddCar /></EnhancedMainLayout>}
					/>
				</Routes>
			</Router>
		</ThemeProvider>
	);
}

export default App;
