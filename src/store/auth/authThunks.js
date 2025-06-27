// src/redux/thunks/authThunks.js

import { loginRequest, loginSuccess, loginFailure } from "./authActions"; // Assuming authActions are in "../actions/authActions"
import { refreshTokenSuccess, refreshTokenFailure } from "./authActions"; // Assuming authActions are in "../actions/authActions"

export const login = (phone_number, password) => async (dispatch) => {
  dispatch(loginRequest());

  try {
    const response = await fetch(
      `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/auth/signin`,
      {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ phone_number, password }),
      }
    );

    const json = await response.json();

    if (response.ok) {
      const expiryTime = Date.now() + json.body.ExpiresIn * 1000; // expires_in is usually in seconds // Store the token and expiry time in localStorage

      localStorage.setItem("admin", JSON.stringify(json.body));
      localStorage.setItem("tokenExpiry", expiryTime); // Store the expiry time

      //  alert("You have successfully logged in");
      dispatch(loginSuccess(json.body));
      console.log(json); // Start the token refresh interval (refresh every 45 minutes)

      setTokenRefreshInterval(dispatch);
    } else {
      dispatch(loginFailure(json.body.message || "Login failed"));
    }
  } catch (error) {
    dispatch(loginFailure("Network error"));
  }
};

export const refreshToken = () => async (dispatch) => {
  const storedUser = localStorage.getItem("admin");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const refreshToken = user?.RefreshToken;
  console.log("The admin object from local storage is: ", user.RefreshToken);

  if (!storedUser) return;

  try {
    const response = await fetch(
      `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/auth/update_refresh_token`, // Endpoint to refresh token
      {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ refreshToken: user.RefreshToken }), // Send refresh token - Corrected line
      }
    );

    const json = await response.json();
    console.log("Refresh token API response:", json.body); // Log API response

    if (response.ok) {
      const { body, ...restJson } = json; // Extract 'body' and keep the rest of json
      const updatedUser = { ...user, ...restJson, ...body }; // Merge everything without nesting 'body'
      localStorage.setItem("admin", JSON.stringify(updatedUser));

      const expiryTime = Date.now() + json.body.ExpiresIn * 1000;
      localStorage.setItem("tokenExpiry", expiryTime);

      dispatch(refreshTokenSuccess(json.body)); // Dispatch the success action
      console.log("Token refreshed successfully", updatedUser);
    } else {
      dispatch(refreshTokenFailure("Failed to refresh token"));
      console.error("Failed to refresh token");
    }
  } catch (error) {
    dispatch(refreshTokenFailure("Error refreshing token"));
    console.error("Error refreshing token:", error);
  }
};

const setTokenRefreshInterval = (dispatch) => {
  const tokenExpiry = localStorage.getItem("tokenExpiry");

  if (tokenExpiry) {
    const expiryTime = parseInt(tokenExpiry, 10); // Parse as integer
    const now = Date.now();
    let timeLeft = expiryTime - now;

    if (timeLeft <= 0) {
      // Token already expired, refresh immediately
      console.log("Token already expired, refreshing immediately.");
      dispatch(refreshToken());
      timeLeft = 45 * 60 * 1000; // Set interval for subsequent refreshes (e.g., 45 minutes)
    } // Refresh 10% before expiry (e.g., if token expires in 1 hour, refresh after 54 minutes)

    const refreshInterval = timeLeft * 0.9;

    console.log(
      `Token refresh interval set to: ${refreshInterval / 60000} minutes`
    ); // Log the interval

    setInterval(() => {
      console.log("Dispatching refreshToken from interval");
      dispatch(refreshToken()); // Dispatch the action to refresh the token
    }, refreshInterval);
  } else {
    console.log("No token expiry found, refresh interval not set.");
  }
};
