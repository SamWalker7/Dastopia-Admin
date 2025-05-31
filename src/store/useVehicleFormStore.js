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

// Helper function to convert file to base64 (Used for image previews)
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
  vehicleImageKeys: [], // Store S3 object keys for vehicle images - PERSISTED
  adminDocumentKeys: [], // Store S3 object keys for admin documents - PERSISTED
  id: "",
  location: [],
  mileage: "",
  pickUp: [], // Changed to pickUp to match schema
  dropOff: [], // Changed to dropOff to match schema
  plateRegion: "",
};

// Define the initial state for uploaded photos (temporary previews)
const initialUploadedPhotos = {
  // Store preview data (base64) and S3 object keys for uploaded photos - NOT PERSISTED (TEMPORARY PREVIEWS ONLY)
  front: null, // { base64: '...', key: 's3-key' }
  back: null, // { base64: '...', key: 's3-key' }
  left: null, // { base64: '...', key: 's3-key' }
  right: null, // { base64: '...', key: 's3-key' }
  interior: null, // { base64: '...', key: 's3-key' }
  additional: [], // [{ base64: '...', key: 's3-key' }]
};

// Define the initial state for uploaded documents (temporary previews)
const initialUploadedDocuments = {
  // Store preview data (name, size) and S3 object keys for uploaded documents - NOT PERSISTED (TEMPORARY PREVIEWS ONLY)
  libre: null, // { name: '...', size: ..., key: 's3-key' }
  license: null, // { name: '...', size: ..., key: 's3-key' }
  insurance: null, // { name: '...', size: ..., key: 's3-key' }
};

const generateUniqueId = () => {
  return `vehicle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const useVehicleFormStore = create(
  persist(
    (set, get) => ({
      vehicleData: { ...initialVehicleData, id: generateUniqueId() }, // Initialize with a unique ID
      uploadedPhotos: { ...initialUploadedPhotos },
      uploadedDocuments: { ...initialUploadedDocuments },

      // --- Token Refresh Logic ---
      refreshAccessToken: async () => {
        const storedUser = localStorage.getItem("admin");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const refreshToken = user?.RefreshToken;

        if (!refreshToken) {
          console.error("No refresh token available.");
          throw new Error("Refresh token is missing");
        }

        try {
          const refreshResponse = await fetch(
            "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/auth/update_refresh_token",
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
            localStorage.removeItem("admin"); // Clear stored user data on refresh failure
            throw new Error("Failed to refresh access token");
          }

          const refreshedTokens = await refreshResponse.json();
          const updatedUser = { ...user, ...refreshedTokens };
          localStorage.setItem("admin", JSON.stringify(updatedUser));
          return refreshedTokens.accessToken; // Return the new access token
        } catch (error) {
          console.error("Error during token refresh:", error);
          throw error;
        }
      },

      // Function to make API calls with automatic token refresh
      apiCallWithRetry: async (url, options, retryCount = 0) => {
        const storedUser = localStorage.getItem("admin");
        const user = storedUser ? JSON.parse(storedUser) : null;
        let accessToken = user?.AccessToken;

        if (!accessToken) {
          throw new Error(
            "Access token is missing. User might not be logged in."
          );
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...options.headers,
        };

        try {
          const response = await fetch(url, { ...options, headers });

          if (response.status === 401 || response.status === 403) {
            if (retryCount < 1) {
              const newAccessToken = await get().refreshAccessToken();
              if (newAccessToken) {
                return get().apiCallWithRetry(url, options, retryCount + 1); // Retry with new token
              }
            }
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
      },

      // --- Actions using apiCallWithRetry ---

      // Action to update vehicle data
      updateVehicleData: (newData) => {
        set((state) => ({
          vehicleData: { ...state.vehicleData, ...newData },
        }));
      },

      // Action to get a pre-signed URL for file upload (images or documents)
      getPresignedUrl: async (vehicleId, filename, contentType, operation) => {
        const url =
          "https://xo55y7ogyj.execute-api.us-east-1.amazonaws.com/prod/add_vehicle"; // Assuming this endpoint handles both image and document URL requests

        const options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation, // e.g., "getPresignedUrl" or maybe a specific one for docs if backend supports? Assuming "getPresignedUrl" works for both based on filename/context.
            vehicleId,
            filename,
            contentType,
          }),
        };

        try {
          const data = await get().apiCallWithRetry(url, options);
          console.log("Presigned URL data:", data);
          if (!data || !data.body || !data.body.url || !data.body.key) {
            throw new Error("Invalid presigned URL response structure");
          }
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
          console.log("Upload successful to presigned URL.");
          return true; // Upload successful
        } catch (error) {
          console.error("Error uploading to presigned URL:", error);
          throw error;
        }
      },

      // Action to upload a vehicle image
      uploadVehicleImage: async (file, key) => {
        try {
          const vehicleId = get().vehicleData.id;
          if (!vehicleId) {
            throw new Error("Vehicle ID is not set. Cannot upload image.");
          }

          const filename = file.name;
          const contentType = file.type;

          // Get pre-signed URL and S3 key
          const preSignedData = await get().getPresignedUrl(
            vehicleId,
            filename,
            contentType,
            "getPresignedUrl" // Assuming this operation works for images
          );
          const preSignedUrl = preSignedData.url;
          const imageS3Key = preSignedData.key; // S3 object key

          // Compress the image
          const compressedFile = await compressImage(file);

          // Upload to S3 using pre-signed URL
          await get().uploadToPreSignedUrl(
            preSignedUrl, // Correct variable name
            compressedFile,
            contentType
          );

          // Convert the compressed file to a base64 string for preview
          const base64 = await fileToBase64(compressedFile);

          set((state) => ({
            vehicleData: {
              ...state.vehicleData,
              vehicleImageKeys: [
                ...state.vehicleData.vehicleImageKeys,
                imageS3Key, // Store S3 object key in vehicleImageKeys
              ],
            },
            uploadedPhotos: {
              ...state.uploadedPhotos,
              [key]:
                key === "additional"
                  ? [
                      ...state.uploadedPhotos.additional,
                      { base64: base64, key: imageS3Key }, // Store S3 object key in uploadedPhotos preview
                    ]
                  : { base64: base64, key: imageS3Key }, // Store S3 object key in uploadedPhotos preview
            },
          }));
        } catch (error) {
          console.error("Error uploading vehicle image:", error);
          // Handle error appropriately (e.g., show user feedback)
          throw error; // Re-throw to allow calling component to catch
        }
      },

      // Action to upload an admin document
      uploadAdminDocument: async (file, key) => {
        try {
          const vehicleId = get().vehicleData.id;
          if (!vehicleId) {
            throw new Error("Vehicle ID is not set. Cannot upload document.");
          }

          const filename = file.name;
          const contentType = file.type;

          // Get pre-signed URL and S3 key
          const preSignedData = await get().getPresignedUrl(
            vehicleId,
            filename,
            contentType,
            "getPresignedUrl" // Assuming this operation works for documents too
          );
          const preSignedUrl = preSignedData.url;
          const documentS3Key = preSignedData.key; // S3 object key

          // Upload to S3 using pre-signed URL
          // Documents are typically not compressed or converted to base64 for preview
          await get().uploadToPreSignedUrl(preSignedUrl, file, contentType);

          // Update state with S3 key
          set((state) => ({
            vehicleData: {
              ...state.vehicleData,
              adminDocumentKeys: [
                ...state.vehicleData.adminDocumentKeys,
                documentS3Key, // Store S3 object key in adminDocumentKeys
              ],
            },
            uploadedDocuments: {
              ...state.uploadedDocuments,
              [key]: { name: file.name, size: file.size, key: documentS3Key }, // Store S3 object key in uploadedDocuments preview
            },
          }));
        } catch (error) {
          console.error("Error uploading admin document:", error);
          // Handle error appropriately (e.g., show user feedback)
          throw error; // Re-throw to allow calling component to catch
        }
      },

      // Action to delete a vehicle image (removes from store, not from S3 in this version)
      deleteVehicleImage: (key, imageS3Key) => {
        set((state) => {
          const updatedPhotos = { ...state.uploadedPhotos };
          const updatedVehicleImageKeys =
            state.vehicleData.vehicleImageKeys.filter((k) => k !== imageS3Key); // Filter by S3 key

          if (key === "additional") {
            updatedPhotos.additional = updatedPhotos.additional.filter(
              (img) => img.key !== imageS3Key // Filter additional by S3 key in preview state
            );
          } else {
            // For main images, set to null if the key matches
            if (updatedPhotos[key]?.key === imageS3Key) {
              updatedPhotos[key] = null;
            }
          }

          return {
            vehicleData: {
              ...state.vehicleData,
              vehicleImageKeys: updatedVehicleImageKeys,
            },
            uploadedPhotos: updatedPhotos,
          };
        });
      },

      // Action to delete an admin document (removes from store, not from S3 in this version)
      deleteAdminDocument: (key, documentS3Key) => {
        set((state) => {
          const updatedDocuments = { ...state.uploadedDocuments };
          const updatedAdminDocumentKeys =
            state.vehicleData.adminDocumentKeys.filter(
              (k) => k !== documentS3Key // Filter by S3 key
            );

          // For main documents, set to null if the key matches
          if (updatedDocuments[key]?.key === documentS3Key) {
            updatedDocuments[key] = null;
          }

          return {
            vehicleData: {
              ...state.vehicleData,
              adminDocumentKeys: updatedAdminDocumentKeys,
            },
            uploadedDocuments: updatedDocuments,
          };
        });
      },

      // Action to update a vehicle image (replaces existing one in store and S3)
      updateVehicleImage: async (file, key, oldImageS3Key) => {
        try {
          const vehicleId = get().vehicleData.id;
          if (!vehicleId)
            throw new Error("Vehicle ID is not set. Cannot update image.");

          const filename = file.name;
          const contentType = file.type;

          // Get pre-signed URL for the new image and its S3 key
          const preSignedData = await get().getPresignedUrl(
            vehicleId,
            filename,
            contentType,
            "getPresignedUrl"
          );
          const preSignedUrl = preSignedData.url;
          const newImageS3Key = preSignedData.key; // New S3 object key

          // Compress the new image
          const compressedFile = await compressImage(file);

          // Upload the new image to S3
          await get().uploadToPreSignedUrl(
            preSignedUrl, // Correct variable name
            compressedFile,
            contentType
          );

          // Convert the compressed file to base64 for preview
          const base64 = await fileToBase64(compressedFile);

          set((state) => {
            const updatedPhotos = { ...state.uploadedPhotos };
            // Remove the old S3 key and add the new S3 key to vehicleImageKeys
            const updatedVehicleImageKeys =
              state.vehicleData.vehicleImageKeys.filter(
                (k) => k !== oldImageS3Key
              );

            if (key === "additional") {
              updatedPhotos.additional = updatedPhotos.additional.map((img) =>
                img.key === oldImageS3Key
                  ? { base64: base64, key: newImageS3Key } // Update preview with new base64 and new S3 key
                  : img
              );
            } else {
              // Update main image preview with new base64 and new S3 key
              updatedPhotos[key] = { base64: base64, key: newImageS3Key };
            }

            return {
              vehicleData: {
                ...state.vehicleData,
                vehicleImageKeys: [...updatedVehicleImageKeys, newImageS3Key], // Add new S3 key
              },
              uploadedPhotos: updatedPhotos,
            };
          });

          // Note: This version does not automatically delete the old file from S3.
          // S3 cleanup logic might be needed separately or handled by backend.
        } catch (error) {
          console.error("Error updating vehicle image:", error);
          throw error; // Re-throw
        }
      },

      // Action to update an admin document (replaces existing one in store and S3)
      updateAdminDocument: async (file, key, oldDocumentS3Key) => {
        try {
          const vehicleId = get().vehicleData.id;
          if (!vehicleId)
            throw new Error("Vehicle ID is not set. Cannot update document.");

          const filename = file.name;
          const contentType = file.type;

          // Get pre-signed URL for the new document and its S3 key
          const preSignedData = await get().getPresignedUrl(
            vehicleId,
            filename,
            contentType,
            "getPresignedUrl" // Assuming this operation works for documents
          );
          const preSignedUrl = preSignedData.url;
          const newDocumentS3Key = preSignedData.key; // New S3 object key

          // Upload the new document to S3
          await get().uploadToPreSignedUrl(preSignedUrl, file, contentType);

          set((state) => {
            const updatedDocuments = { ...state.uploadedDocuments };
            // Remove the old S3 key and add the new S3 key to adminDocumentKeys
            const updatedAdminDocumentKeys =
              state.vehicleData.adminDocumentKeys.filter(
                (k) => k !== oldDocumentS3Key
              );

            // Update document preview with new name, size, and new S3 key
            updatedDocuments[key] = {
              name: file.name,
              size: file.size,
              key: newDocumentS3Key,
            };

            return {
              vehicleData: {
                ...state.vehicleData,
                adminDocumentKeys: [
                  ...updatedAdminDocumentKeys,
                  newDocumentS3Key,
                ], // Add new S3 key
              },
              uploadedDocuments: updatedDocuments,
            };
          });

          // Note: This version does not automatically delete the old file from S3.
          // S3 cleanup logic might be needed separately or handled by backend.
        } catch (error) {
          console.error("Error updating admin document:", error);
          throw error; // Re-throw
        }
      },

      // Action to submit the vehicle listing to the API
      submitVehicleListing: async () => {
        const vehicleData = get().vehicleData;

        // Calendar parsing and transformation
        let parsedCalendar = vehicleData.calendar;
        if (typeof vehicleData.calendar === "string" && vehicleData.calendar) {
          try {
            parsedCalendar = JSON.parse(vehicleData.calendar);
          } catch (e) {
            console.error("Error parsing calendar string:", e);
            parsedCalendar = [];
          }
        } else if (!vehicleData.calendar) {
          parsedCalendar = [];
        }
        const transformedCalendarEvents = Array.isArray(parsedCalendar)
          ? parsedCalendar.map(
              // Ensure parsedCalendar is an array
              (event, index) => ({
                eventId: `evt-${index + 1}`, // Generate a simple event ID
                startDate: event.start,
                endDate: event.end,
                status: event.status || "available",
                source: event.source || "manual",
              })
            )
          : []; // Default to empty array if parsing fails or is not an array

        // Location transformation
        const transformedPickUp = Array.isArray(vehicleData.pickUp)
          ? vehicleData.pickUp.map(
              // Ensure is array
              (loc) => [loc.position.lat, loc.position.lng]
            )
          : []; // Default to empty array
        const transformedDropOff = Array.isArray(vehicleData.dropOff)
          ? vehicleData.dropOff.map(
              // Ensure is array
              (loc) => [loc.position.lat, loc.position.lng]
            )
          : []; // Default to empty array

        // Prepare incoming data for the API request
        const incomingData = {
          city: vehicleData.city || "string", // Use empty string defaults
          category: vehicleData.category || "string",
          make: vehicleData.make || "string",
          mileage: vehicleData.mileage || "string",
          events: transformedCalendarEvents, // Use transformed calendar events array

          carFeatures: vehicleData.carFeatures || [],
          advanceNoticePeriod: vehicleData.advanceNoticePeriod || "string",
          instantBooking: vehicleData.instantBooking || false,
          price: vehicleData.price || "string",
          pickUp: transformedPickUp,
          dropOff: transformedDropOff,
          otherMake: vehicleData.otherMake || "string",
          model: vehicleData.model || "string",
          year: vehicleData.year || "string",
          vehicleNumber: vehicleData.vehicleNumber || "string",
          doors: vehicleData.doors || "string", // Keep as string based on initial state
          fuelType: vehicleData.fuelType || "string",
          seats: vehicleData.seats || "string", // Keep as string based on initial state
          color: vehicleData.color || "string",
          id: vehicleData.id || "string",
          transmission: vehicleData.transmission || "string",
          modelSpecification: vehicleData.modelSpecification || "string",
          isPostedByOwner: vehicleData.isPostedByOwner || "false", // Keep as string
          representativeFirstName:
            vehicleData.representativeFirstName || "string",
          representativeLastName:
            vehicleData.representativeLastName || "string",
          representativePhone: vehicleData.representativePhone || "string",
          representativeEmail: vehicleData.representativeEmail || "string",
          vehicleImageKeys: vehicleData.vehicleImageKeys || [], // These now hold S3 keys
          adminDocumentKeys: vehicleData.adminDocumentKeys || [], // These now hold S3 keys
          location:
            Array.isArray(vehicleData.location) &&
            vehicleData.location.length > 0
              ? vehicleData.location
              : [0, 0], // Ensure location array is valid or default
          plateRegion: vehicleData.plateRegion || "",
        };

        console.log("Submitting vehicle data:", incomingData); // Log final payload

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
          vehicleData: { ...initialVehicleData, id: generateUniqueId() }, // Generate new ID on reset
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
        uploadedPhotos: state.uploadedPhotos, // Persist photo previews (base64 + key)
        uploadedDocuments: state.uploadedDocuments, // Persist document previews (name, size, key)
      }),
    }
  )
);

export default useVehicleFormStore;
