// import { configureStore } from "@reduxjs/toolkit";
// import vehicleReducer from "./slices/vehicleSlice";
// import userReducer from "./slices/userSlice"; // Import the new user reducer

// const store = configureStore({
//   reducer: {
//     vehicle: vehicleReducer, // Existing vehicle reducer
//     user: userReducer, // New user reducer for login and profile management
//   },
// });

// export default store;
import { createStore, applyMiddleware } from "redux";
import { thunk } from 'redux-thunk';
import { composeWithDevTools } from '@redux-devtools/extension';
import rootReducer from "../store/auth/rootReducer";

const store = createStore(
  rootReducer,
  composeWithDevTools(applyMiddleware(thunk))
);

export default store;
