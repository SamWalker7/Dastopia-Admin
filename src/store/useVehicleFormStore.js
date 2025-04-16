import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import imageCompression from "browser-image-compression";

// Helper function to compress images
const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.5, // Maximum size in MB
    maxWidthOrHeight: 1024, // Maximum width or height
    useWebWorker: true, // Use a web worker for better performance
  };
  return await imageCompression(file, options);
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
// Define the initial state of the vehicle data form
const initialVehicleData = {
  advanceNoticePeriod: "",
  calendar: "", // Keep calendar as string for now, parsing logic in submit
  carFeatures: [],
  instantBooking: false,
  price: "",
  city: "",
  category: "",
  make: "",
  otherMake: "",
  model: "",
  year: "",
  vehicleNumber: "",
  doors: "",
  fuelType: "",
  seats: "",
  color: "",
  transmission: "",
  modelSpecification: "",
  isPostedByOwner: "", // Keep isPostedByOwner as string, adjust submit logic if needed
  representativeFirstName: "",
  representativeLastName: "",
  representativePhone: "",
  representativeEmail: "",
  vehicleImageKeys: [], // Store filenames as keys for vehicle images - PERSISTED
  adminDocumentKeys: [], // Store filenames as keys for admin documents - PERSISTED
  id: "",
  location: [],
  mileage: "",
  pickUp: [], // Changed to pickUp to match schema
  dropOff: [], // Changed to dropOff to match schema
};

// Define the initial state for uploaded photos (temporary previews)
const initialUploadedPhotos = {
  // Store preview URLs (Object URLs) and keys for uploaded photos - NOT PERSISTED (TEMPORARY PREVIEWS ONLY)
  front: null,
  back: null,
  left: null,
  right: null,
  interior: null,
  additional: [],
};

// Define the initial state for uploaded documents (temporary previews)
const initialUploadedDocuments = {
  // Store preview URLs (Object URLs) and keys for uploaded documents - NOT PERSISTED (TEMPORARY PREVIEWS ONLY)
  libre: null,
  license: null,
  insurance: null,
};
const generateUniqueId = () => {
  return `vehicle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const useVehicleFormStore = create(
  persist(
    (set, get) => ({
      vehicleData: { ...initialVehicleData, id: generateUniqueId() }, // Initialize with a unique ID
      uploadedPhotos: { ...initialUploadedPhotos },
      uploadedDocuments: { ...initialUploadedDocuments }, // --- Token Refresh Logic ---

      refreshAccessToken: async () => {
        const storedUser = localStorage.getItem("customer");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const refreshToken = user?.RefreshToken;

        if (!refreshToken) {
          console.error("No refresh token available."); // Handle case where refresh token is missing (e.g., user needs to re-login)
          throw new Error("Refresh token is missing"); // Or handle differently, maybe redirect to login
        }

        try {
          const refreshResponse = await fetch(
            "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/auth/update_refresh_token", // Refresh token endpoint
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ refreshToken: refreshToken }),
            }
          );

          if (!refreshResponse.ok) {
            console.error(
              "Failed to refresh access token:",
              refreshResponse.status,
              await refreshResponse.text()
            );
            localStorage.removeItem("customer"); // Clear stored user data on refresh failure as refresh token might be invalid too
            throw new Error("Failed to refresh access token"); // Or handle differently, maybe redirect to login
          }

          const refreshedTokens = await refreshResponse.json(); // Update tokens in localStorage and Zustand store

          const updatedUser = { ...user, ...refreshedTokens };
          localStorage.setItem("customer", JSON.stringify(updatedUser));
          return refreshedTokens.accessToken; // Return the new access token
        } catch (error) {
          console.error("Error during token refresh:", error);
          throw error; // Re-throw to be caught by the original API call
        }
      }, // Function to make API calls with automatic token refresh

      apiCallWithRetry: async (url, options, retryCount = 0) => {
        const storedUser = localStorage.getItem("customer");
        const user = storedUser ? JSON.parse(storedUser) : null;
        let accessToken = user?.AccessToken;

        if (!accessToken) {
          throw new Error(
            "Access token is missing. User might not be logged in."
          ); // Handle no access token
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...options.headers, // Include any additional headers from options
        };

        try {
          const response = await fetch(url, { ...options, headers });

          if (response.status === 401 || response.status === 403) {
            if (retryCount < 1) {
              // Limit retry to prevent infinite loops
              const newAccessToken = await get().refreshAccessToken();
              if (newAccessToken) {
                return get().apiCallWithRetry(url, options, retryCount + 1); // Retry with new token
              }
            } // If refresh fails or retries are exhausted, propagate the error
            throw new Error("Unauthorized or token expired and refresh failed");
          }

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              "API Error:",
              response.status,
              errorText,
              `URL: ${url}`,
              `Options: ${JSON.stringify(options)}`
            );
            throw new Error(
              `HTTP error! status: ${response.status}, message: ${errorText}`
            );
          }

          return await response.json(); // Or response, depending on what you need
        } catch (error) {
          console.error(
            "API call failed:",
            error,
            `URL: ${url}`,
            `Options: ${JSON.stringify(options)}`
          );
          throw error;
        }
      }, // --- Actions using apiCallWithRetry --- // Action to update vehicle data

      updateVehicleData: (newData) => {
        set((state) => ({
          vehicleData: { ...state.vehicleData, ...newData },
        }));
      }, // Action to get a pre-signed URL for vehicle image upload

      getPresignedUrl: async (vehicleId, filename, contentType, operation) => {
        const url =
          "https://xo55y7ogyj.execute-api.us-east-1.amazonaws.com/prod/add_vehicle";

        const options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation, // Either "getPresignedUrl" or "getAdminPresignedUrl"
            vehicleId,
            filename,
            contentType,
          }),
        };

        try {
          const data = await get().apiCallWithRetry(url, options);
          console.log("Presigned URL data:", data);
          return { url: data.body.url, key: data.body.key }; // Return both URL & key
        } catch (error) {
          console.error("Error fetching presigned URL:", error);
          throw error;
        }
      },

      uploadToPreSignedUrl: async (preSignedUrl, file, contentType) => {
        try {
          const response = await fetch(preSignedUrl, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: file,
          });
          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              "Error uploading file to presigned URL:",
              response.status,
              errorText
            );
            throw new Error(
              `File upload failed: ${response.status} ${errorText}`
            );
          }
          return true; // Upload successful
        } catch (error) {
          console.error("Error uploading to presigned URL:", error);
          throw error;
        }
      }, // Action to upload a vehicle image

      uploadVehicleImage: async (file, key) => {
        try {
          const vehicleId = get().vehicleData.id;
          if (!vehicleId) {
            throw new Error("Vehicle ID is not set. Cannot upload image.");
          }

          const filename = file.name;
          const contentType = file.type; // Get pre-signed URL first, now returns URL and key

          const preSignedData = await get().getPresignedUrl(
            vehicleId,
            filename,
            contentType,
            "getPresignedUrl"
          );
          const preSignedUrl = preSignedData.url;
          const imageKey = preSignedData.key; // Extract the key // Compress the image

          const compressedFile = await compressImage(file); // Upload to S3 using pre-signed URL

          await get().uploadToPreSignedUrl(
            preSignedUrl,
            compressedFile,
            contentType
          ); // Convert the compressed file to a base64 string for preview

          const base64 = await fileToBase64(compressedFile);

          set((state) => ({
            vehicleData: {
              ...state.vehicleData,
              vehicleImageKeys: [
                ...state.vehicleData.vehicleImageKeys,
                imageKey, // Store imageKey in vehicleImageKeys
              ],
            },
            uploadedPhotos: {
              ...state.uploadedPhotos,
              [key]:
                key === "additional"
                  ? [
                      ...state.uploadedPhotos.additional,
                      { base64: base64, key: imageKey }, // Store imageKey in uploadedPhotos
                    ]
                  : { base64: base64, key: imageKey }, // Store imageKey in uploadedPhotos
            },
          }));
        } catch (error) {
          console.error("Error uploading vehicle image:", error);
        }
      }, // Action to upload an admin document

      uploadAdminDocument: async (file, key) => {
        try {
          const vehicleId = get().vehicleData.id;
          if (!vehicleId) {
            throw new Error("Vehicle ID is not set. Cannot upload document.");
          } // For documents, store only metadata (name and size)

          set((state) => ({
            vehicleData: {
              ...state.vehicleData,
              adminDocumentKeys: [
                ...state.vehicleData.adminDocumentKeys,
                file.name,
              ],
            },
            uploadedDocuments: {
              ...state.uploadedDocuments,
              [key]: { name: file.name, size: file.size, key: file.name },
            },
          }));
        } catch (error) {
          console.error("Error uploading admin document:", error);
        }
      }, // Action to delete a vehicle image (removes from store, not from S3 in this version)
      deleteVehicleImage: (key, imageKey) => {
        set((state) => {
          const updatedPhotos = { ...state.uploadedPhotos };
          const updatedVehicleImageKeys =
            state.vehicleData.vehicleImageKeys.filter((k) => k !== imageKey);

          if (key === "additional") {
            updatedPhotos.additional = updatedPhotos.additional.filter(
              (img) => img.key !== imageKey
            );
          } else {
            updatedPhotos[key] = null;
          }

          return {
            vehicleData: {
              ...state.vehicleData,
              vehicleImageKeys: updatedVehicleImageKeys,
            },
            uploadedPhotos: updatedPhotos,
          };
        });
      }, // Action to delete an admin document (removes from store, not from S3 in this version)

      deleteAdminDocument: (key, documentKey) => {
        set((state) => {
          const updatedDocuments = { ...state.uploadedDocuments };
          const updatedAdminDocumentKeys =
            state.vehicleData.adminDocumentKeys.filter(
              (k) => k !== documentKey
            );
          updatedDocuments[key] = null;

          return {
            vehicleData: {
              ...state.vehicleData,
              adminDocumentKeys: updatedAdminDocumentKeys,
            },
            uploadedDocuments: updatedDocuments,
          };
        });
      }, // Action to update a vehicle image (replaces existing one in store and S3)

      updateVehicleImage: async (file, key, oldImageKey) => {
        try {
          const vehicleId = get().vehicleData.id;
          if (!vehicleId)
            throw new Error("Vehicle ID is not set. Cannot update image.");
          const filename = file.name;
          const contentType = file.type; // Get pre-signed URL first, now returns URL and key

          const preSignedData = await get().getPresignedUrl(
            vehicleId,
            filename,
            contentType,
            "getPresignedUrl"
          );
          const preSignedUrl = preSignedData.url;
          const imageKey = preSignedData.key; // Extract the key // Upload to S3 using pre-signed URL

          await get().uploadToPreSignedUrl(preSignedUrl, file, contentType);

          const previewUrl = URL.createObjectURL(file); // Create Object URL for preview (TEMPORARY)

          set((state) => {
            const updatedPhotos = { ...state.uploadedPhotos };
            const updatedVehicleImageKeys =
              state.vehicleData.vehicleImageKeys.filter(
                (k) => k !== oldImageKey
              );

            if (key === "additional") {
              updatedPhotos.additional = updatedPhotos.additional.map((img) =>
                img.key === oldImageKey
                  ? { base64: previewUrl, key: imageKey } // Store imageKey here
                  : img
              );
            } else {
              updatedPhotos[key] = { base64: previewUrl, key: imageKey }; // Store imageKey here
            }

            return {
              vehicleData: {
                ...state.vehicleData,
                vehicleImageKeys: [...updatedVehicleImageKeys, imageKey], // Add new imageKey
              },
              uploadedPhotos: updatedPhotos,
            };
          });
        } catch (error) {
          console.error("Error updating vehicle image:", error);
        }
      }, // Action to update an admin document (replaces existing one in store and S3)

      updateAdminDocument: async (file, key, oldDocumentKey) => {
        try {
          const vehicleId = get().vehicleData.id;
          if (!vehicleId)
            throw new Error("Vehicle ID is not set. Cannot update document.");
          const filename = file.name;
          const contentType = file.type;
          const preSignedUrl = await get().getPresignedUrl(
            vehicleId,
            filename,
            contentType,
            "getPresignedUrl"
          );
          await get().uploadToPreSignedUrl(preSignedUrl, file, contentType);

          const previewUrl = URL.createObjectURL(file); // Create Object URL for preview (TEMPORARY)

          set((state) => {
            const updatedDocuments = { ...state.uploadedDocuments };
            const updatedAdminDocumentKeys =
              state.vehicleData.adminDocumentKeys.filter(
                (k) => k !== oldDocumentKey
              );

            updatedDocuments[key] = {
              name: file.name,
              key: filename,
              previewUrl: previewUrl,
            }; // Store temporary preview URL

            return {
              vehicleData: {
                ...state.vehicleData,
                adminDocumentKeys: [...updatedAdminDocumentKeys, filename], // Add new filename
              },
              uploadedDocuments: updatedDocuments,
            };
          });
        } catch (error) {
          console.error("Error updating admin document:", error);
        }
      }, // Action to submit the vehicle listing to the API

      submitVehicleListing: async () => {
        const vehicleData = get().vehicleData; // Calendar parsing and transformation

        console.log("Raw vehicleData.calendar:", vehicleData.calendar); // ADD THIS LINE

        let parsedCalendar = vehicleData.calendar;
        if (typeof vehicleData.calendar === "string" && vehicleData.calendar) {
          try {
            parsedCalendar = JSON.parse(vehicleData.calendar);
            console.log("Parsed parsedCalendar:", parsedCalendar); // ADD THIS LINE
          } catch (e) {
            console.error("Error parsing calendar string:", e);
            parsedCalendar = [];
          }
        } else if (!vehicleData.calendar) {
          parsedCalendar = [];
        }
        const transformedCalendarEvents = parsedCalendar.map(
          (event, index) => ({
            eventId: `evt-${index + 1}`, // Generate a simple event ID
            startDate: event.start, // Corrected: use event.start
            endDate: event.end, // Corrected: use event.end
            status: event.status || "available", // Default status if not provided
            source: "manual", // Assuming source is manual for now
          })
        ); // Location transformation - remain the same

        console.log(
          "Vehicle Data before mapping pickUp/dropOff:",
          get().vehicleData
        ); // ADD THIS LINE
        const transformedPickUp = vehicleData.pickUp.map(
          // Line 489
          (loc) => [loc.position.lat, loc.position.lng]
        );
        const transformedDropOff = vehicleData.dropOff.map((loc) => [
          loc.position.lat,
          loc.position.lng,
        ]); // Prepare incoming data for the API request

        console.log("Transformed Calendar Events:", transformedCalendarEvents); // ADD THIS LINE
        console.log(
          "Vehicle Data before mapping pickUp/dropOff:",
          get().vehicleData
        );
        const incomingData = {
          city: vehicleData.city || "string",
          category: vehicleData.category || "string",
          make: vehicleData.make || "string",
          mileage: vehicleData.mileage ? vehicleData.mileage : "string",
          events: transformedCalendarEvents, // Use transformed calendar events as an object

          carFeatures: vehicleData.carFeatures || [],
          advanceNoticePeriod: vehicleData.advanceNoticePeriod || "string",
          instantBooking: vehicleData.instantBooking || false,
          price: vehicleData.price || "string",
          pickUp: transformedPickUp, // Changed to transformedPickUp
          dropOff: transformedDropOff, // Changed to transformedDropOff
          otherMake: vehicleData.otherMake || "string",
          model: vehicleData.model || "string",
          year: vehicleData.year || "string",
          vehicleNumber: vehicleData.vehicleNumber || "string",
          doors: vehicleData.doors || "4", // Ensure integer or default 4 (string in schema)
          fuelType: vehicleData.fuelType || "string",
          seats: vehicleData.seats || "0", // Ensure integer or default 0 (string in schema)
          color: vehicleData.color || "string",
          id: vehicleData.id || "string",
          transmission: vehicleData.transmission || "string",
          modelSpecification: vehicleData.modelSpecification || "string",
          isPostedByOwner: vehicleData.isPostedByOwner || "false", // Keep as string, default "false"
          representativeFirstName:
            vehicleData.representativeFirstName || "string",
          representativeLastName:
            vehicleData.representativeLastName || "string",
          representativePhone: vehicleData.representativePhone || "string",
          representativeEmail: vehicleData.representativeEmail || "string",
          vehicleImageKeys: vehicleData.vehicleImageKeys || [], // Use vehicleImageKeys with S3 keys
          adminDocumentKeys: vehicleData.adminDocumentKeys || [],
          location: vehicleData.location || [0, 0], // Ensure location array or default [0,0]
        };

        try {
          const responseData = await get().apiCallWithRetry(
            "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/vehicle", // Replace with your actual API endpoint
            {
              method: "POST",
              body: JSON.stringify(incomingData),
            }
          );

          console.log("Vehicle listing submitted successfully:", responseData);

          return responseData;
        } catch (error) {
          console.error("Failed to submit vehicle listing:", error);
          throw error;
        }
      },
      resetStore: () => {
        set({
          vehicleData: { ...initialVehicleData },
          uploadedPhotos: { ...initialUploadedPhotos },
          uploadedDocuments: { ...initialUploadedDocuments },
        });
      },
    }),
    {
      name: "vehicle-form-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        vehicleData: state.vehicleData,
        uploadedPhotos: state.uploadedPhotos,
        uploadedDocuments: state.uploadedDocuments,
      }),
    }
  )
);

export default useVehicleFormStore;
