import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGOUT,
  REFRESH_TOKEN_SUCCESS,
  REFRESH_TOKEN_FAILURE,
} from "./authActions";

const initialState = {
  loading: false,
  isAuthenticated: false,
  user: null,
  error: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_REQUEST:
      return { ...state, loading: true, error: null };
    case LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    case LOGIN_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case REFRESH_TOKEN_SUCCESS:
      return { ...state, user: action.payload, error: null };
    case REFRESH_TOKEN_FAILURE:
      return { ...state, error: action.payload };
    case LOGOUT:
      return { ...initialState };
    default:
      return state;
  }
};

export default authReducer;
