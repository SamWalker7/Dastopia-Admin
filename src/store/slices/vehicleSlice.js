import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllVehicles, getDownloadUrl } from "../../api";

const initialState = {
    vehicles: [],
    loading: false,
    error: null
}

export const fetchVehicles = createAsyncThunk("vehicle/fetchVehicles", async (_, { rejectWithValue }) => {
    try {
        const response = await getAllVehicles();
        console.log(response, "response")
        return response.body;
    } catch (err) {
        return rejectWithValue(err);
    }

})

export const fetchImages = createAsyncThunk(
    'vehicles/fetchVehicleImages',
    async (vehicle, { rejectWithValue }) => {
        try {
            if (vehicle.vehicleImageKeys?.length > 0) {
                let urls = [];
                for (const image of vehicle.vehicleImageKeys) {
                    const path = await getDownloadUrl(image.key)
                    urls.push(path.body || "https://via.placeholder.com/300");
                }
                console.log("urls", urls)
                return { vehicleId: vehicle.id, images: urls };
            } else {
                return { vehicleId: vehicle.id, images: [] };
            }


        } catch (err) {
            rejectWithValue(err)
        }
    }
);

const vehicleSlice = createSlice({
    name: "vehicle",
    initialState,
    reducers: {
        clearError(state) {
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchVehicles.pending, (state) => {
            state.loading = true;
        }).addCase(fetchVehicles.fulfilled, (state, action) => {
            state.loading = false;
            console.log("fulfilled")
            state.vehicles = action.payload.map(vehicle => ({
                ...vehicle,
                status: vehicle?.isEnabled ? 'Approved' : vehicle?.isEnabled === false ? 'Declined' : 'Pending',
                images: [],
                imageLoading: true,
            }));
        }).addCase(fetchVehicles.rejected, (state, action) => {
            state.loading = false;

            state.error = action.payload
        }).addCase(fetchImages.pending, (state) => {

        }).addCase(fetchImages.fulfilled, (state, action) => {

            if (action.payload) {
                const { vehicleId, images } = action.payload;
                const vehicle = state.vehicles.find(v => v.id === vehicleId);
                if (vehicle) {
                    vehicle.images = images;
                    vehicle.imageLoading = false;
                }
            }
        }).addCase(fetchImages.rejected, (state, action) => {

            state.error = action.payload;
        })
    }
})


export default vehicleSlice.reducer;



