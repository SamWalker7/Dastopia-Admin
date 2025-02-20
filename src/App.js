import React, { useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store/store";
import "./output.css"; // Import Tailwind CSS
import PermanentDrawerLeft from "./newPages/PermanentDrawerLeft";

function App() {
  return (
    // <Provider store={store}>
    //   <ThemeProvider theme={theme}>
    //     <CssBaseline />
    //     <Router>
    //       <AppRoutes
    //         sidebarOpen={sidebarOpen}
    //         setSidebarOpen={setSidebarOpen}
    //       />
    //     </Router>
    //   </ThemeProvider>
    // </Provider>
    <Provider store={store}>
      <Router>
        <PermanentDrawerLeft />
      </Router>
    </Provider>
  );
}

export default App;
