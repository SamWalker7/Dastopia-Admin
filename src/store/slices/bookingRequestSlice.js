import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
  bookingRequests: [],
  loading: false,
  error: null,
};

const fetchBookingRequests = createAsyncThunk(
  "bookingRequest/fetchBookingRequests",
  async (_, { rejectWithValue }) => {}
);

const approveBooking = createAsyncThunk(
  "bookingRequest/approveBooking",
  async (_, { rejectWithValue }) => {}
);

const denyBooking = createAsyncThunk(
  "bookingRequest/denyBooking",
  async (_, { rejectWithValue }) => {}
);

const bookingSlice = createSlice({
  name: "bookingRequest",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookingRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookingRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.bookingRequests = action.payload;
      })
      .addCase(fetchBookingRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default bookingSlice.reducer
