// src/redux/actions/authActions.js

export const LOGIN_REQUEST = "LOGIN_REQUEST";
export const LOGIN_SUCCESS = "LOGIN_SUCCESS";
export const LOGIN_FAILURE = "LOGIN_FAILURE";
export const LOGOUT = "LOGOUT";
export const REFRESH_TOKEN_SUCCESS = "REFRESH_TOKEN_SUCCESS";
export const REFRESH_TOKEN_FAILURE = "REFRESH_TOKEN_FAILURE";

export const loginRequest = () => ({ type: LOGIN_REQUEST });

export const loginSuccess = (userData) => ({
  type: LOGIN_SUCCESS,
  payload: userData,
});

export const loginFailure = (error) => ({
  type: LOGIN_FAILURE,
  payload: error,
});

export const logout = () => ({ type: LOGOUT });
export const refreshTokenSuccess = (userData) => ({
  type: REFRESH_TOKEN_SUCCESS,
  payload: userData,
});

export const refreshTokenFailure = (error) => ({
  type: REFRESH_TOKEN_FAILURE,
  payload: error,
});
