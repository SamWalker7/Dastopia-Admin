// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import AppRoutes from './router/routes';
import theme from './style/theme';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './App.css';
import { Provider } from 'react-redux';
import store from './store/store';

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <Provider store={store}>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <AppRoutes sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            </Router>
        </ThemeProvider>
        </Provider>
    );
}

export default App;
