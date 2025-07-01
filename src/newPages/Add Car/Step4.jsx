import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { FaMapMarkerAlt, FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import { IoIosCloseCircleOutline, IoMdClose } from "react-icons/io";
import useVehicleFormStore from "../../store/useVehicleFormStore";

const GOOGLE_MAPS_API_KEY = "AIzaSyC3TxwdUzV5gbwZN-61Hb1RyDJr0PRSfW4"; // Replace with your actual API key
const libraries = ["places"];

const Step4 = ({ nextStep, prevStep }) => {
  const { vehicleData, updateVehicleData, submitVehicleListing } =
    useVehicleFormStore();

  // Initialize state for markers (objects with id, position, address, name)
  // This internal state will be transformed before updating the store
  const [internalMarkers, setInternalMarkers] = useState(() => {
    // Helper to convert store format [lat, lng] to internal format {position, name, address, id}
    const convertStoreToInternal = (storeLocations) => {
      if (!Array.isArray(storeLocations)) return [];
      return storeLocations.map((loc, index) => {
        // Assuming loc is [lat, lng] or {position: {lat, lng}, address?, name?} from previous steps
        let position, address, name;
        if (Array.isArray(loc) && loc.length === 2) {
          position = { lat: loc[0], lng: loc[1] };
          // For simple [lat,lng] arrays, address/name would need to be fetched or set to default
          // This part might need adjustment if you intend to load existing complex location objects from the store
          address = `Location at ${position.lat.toFixed(
            4
          )}, ${position.lng.toFixed(4)}`;
          name = `Location ${index + 1}`;
        } else if (loc && loc.position) {
          // If store already has object structure
          position = loc.position;
          address =
            loc.address ||
            `Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}`;
          name = loc.name || `Location ${index + 1}`;
        } else {
          // Fallback for unexpected format
          position = { lat: 0, lng: 0 };
          address = "Unknown Address";
          name = "Unknown Location";
        }
        return {
          id: loc.id || `loc-${Date.now()}-${index}`, // Use existing ID or generate one
          position,
          address,
          name,
        };
      });
    };

    return {
      pickup: convertStoreToInternal(vehicleData.pickUp), // Read from store's pickUp
      dropoff: convertStoreToInternal(vehicleData.dropOff), // Read from store's dropOff
    };
  });

  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationType, setLocationType] = useState(""); // For the modal
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [map, setMap] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Sync with store on any internal marker changes
  useEffect(() => {
    // Transform internal marker format to store format [[lat, lng], ...]
    const pickupForStore = internalMarkers.pickup.map((m) => [
      m.position.lat,
      m.position.lng,
    ]);
    const dropoffForStore = internalMarkers.dropoff.map((m) => [
      m.position.lat,
      m.position.lng,
    ]);
    // Or if your store and submission logic expect the full object:
    // const pickupForStore = internalMarkers.pickup;
    // const dropoffForStore = internalMarkers.dropoff;
    // Based on your initial store schema, it expects [[lat,lng]].
    // However, your submitVehicleListing in the store transforms it again.
    // For consistency with how Step3 might have prepared `pickUp` / `dropOff` from `vehicleData.calendar`,
    // it seems your store *actually* expects the [{position, address, name}] structure
    // for `vehicleData.pickUp` and `vehicleData.dropOff` which is then transformed for API submission.
    // Let's assume the store wants the richer object format.
    // If it strictly wants [[lat, lng]], uncomment the map lines above and comment out the direct assignment.

    updateVehicleData({
      pickUp: internalMarkers.pickup, // Use correct key: pickUp
      dropOff: internalMarkers.dropoff, // Use correct key: dropOff
    });
  }, [internalMarkers, updateVehicleData]);

  const mapStyles = {
    height: "40vh",
    width: "100%",
    borderRadius: "0.5rem",
  };

  const defaultCenter = {
    lat: 9.0233, // Addis Ababa
    lng: 38.7468,
  };

  const locationTypes = [
    "Pickup Location",
    "Drop-off Location",
    "Pickup and Drop-off", // This option adds to both
  ];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  const onMapLoad = useCallback((mapInstance) => {
    // Use useCallback
    setMap(mapInstance);
    if (window.google && window.google.maps && window.google.maps.places) {
      setPlacesService(
        new window.google.maps.places.PlacesService(mapInstance)
      );
    } else {
      console.error("Google Maps Places Service not available.");
    }
  }, []); // Empty dependency array, onLoad should only set map instance once

  const updateInternalMarkers = (newLocationWithDetails) => {
    if (!locationType) return;

    setInternalMarkers((prev) => {
      const newPickup = [...prev.pickup];
      const newDropoff = [...prev.dropoff];

      // Prevent adding duplicate locations based on position (simple check)
      const isDuplicate = (arr) =>
        arr.some(
          (loc) =>
            loc.position.lat === newLocationWithDetails.position.lat &&
            loc.position.lng === newLocationWithDetails.position.lng
        );

      if (locationType.includes("Pickup") && !isDuplicate(newPickup)) {
        newPickup.push(newLocationWithDetails);
      }
      if (locationType.includes("Drop-off") && !isDuplicate(newDropoff)) {
        newDropoff.push(newLocationWithDetails);
      }
      return { pickup: newPickup, dropoff: newDropoff };
    });
  };

  const handleMapClick = (event) => {
    if (!locationType) {
      alert("Please select a location type first (e.g., Pickup, Drop-off).");
      return;
    }
    if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
      console.error("Google Maps Geocoder not available.");
      return;
    }

    const newPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() };

    new window.google.maps.Geocoder().geocode(
      { location: newPosition },
      (results, status) => {
        if (status === "OK" && results[0]) {
          const newLocation = {
            id: `map-${Date.now().toString()}-${Math.random()
              .toString(36)
              .substr(2, 5)}`, // More unique ID
            position: newPosition,
            address: results[0].formatted_address,
            name:
              results[0].address_components.find(
                (c) =>
                  c.types.includes("point_of_interest") ||
                  c.types.includes("establishment")
              )?.long_name ||
              results[0].address_components.find((c) =>
                c.types.includes("premise")
              )?.long_name ||
              results[0].address_components[0]?.long_name ||
              results[0].formatted_address.split(",")[0],
          };
          updateInternalMarkers(newLocation);
        } else {
          console.error("Geocoder failed due to: " + status);
          const newLocation = {
            id: `map-fail-${Date.now().toString()}`,
            position: newPosition,
            address: `Lat: ${newPosition.lat.toFixed(
              4
            )}, Lng: ${newPosition.lng.toFixed(4)}`,
            name: `Location at ${newPosition.lat.toFixed(
              2
            )}, ${newPosition.lng.toFixed(2)}`,
          };
          updateInternalMarkers(newLocation);
        }
      }
    );
  };

  useEffect(() => {
    if (
      !searchQuery ||
      !window.google ||
      !window.google.maps ||
      !window.google.maps.places
    ) {
      setSuggestions([]);
      return;
    }
    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      { input: searchQuery, componentRestrictions: { country: "ET" } },
      (predictions, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      }
    );
  }, [searchQuery]);

  const handleSearchSelect = (placeId) => {
    if (!locationType) {
      alert("Please select a location type first (e.g., Pickup, Drop-off).");
      return;
    }
    if (!placesService) {
      console.error("PlacesService is not initialized.");
      return;
    }
    placesService.getDetails(
      { placeId, fields: ["geometry", "formatted_address", "name"] },
      (place, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          place &&
          place.geometry
        ) {
          const newLocation = {
            id: placeId, // Use placeId as ID from search
            position: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
            address: place.formatted_address,
            name: place.name || place.formatted_address.split(",")[0],
          };
          updateInternalMarkers(newLocation);
          map?.panTo(newLocation.position);
          map?.setZoom(15);
          setSearchQuery("");
          setSuggestions([]);
        } else {
          console.error("Place details request failed due to: " + status);
        }
      }
    );
  };

  const removeLocation = (type, idToRemove) => {
    setInternalMarkers((prev) => ({
      ...prev,
      [type]: prev[type].filter((loc) => loc.id !== idToRemove),
    }));
  };

  const clearLocations = (type) => {
    setInternalMarkers((prev) => ({ ...prev, [type]: [] }));
  };

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const myLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(myLocation);
          map?.panTo(myLocation);
          map?.setZoom(15);
        },
        (error) => alert("Location access failed: " + error.message)
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const LocationList = ({ title, locations, type }) => (
    <div className="mt-4 border border-blue-200 p-4 rounded-2xl bg-white">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
        {locations.length > 0 && (
          <button
            onClick={() => clearLocations(type)}
            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
          >
            <FaTrash /> Clear All
          </button>
        )}
      </div>
      {locations.length === 0 ? (
        <p className="text-gray-500 text-xs italic">
          No {type} locations added yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {locations.map((loc) => (
            <li
              key={loc.id}
              className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md border border-gray-200 text-xs"
            >
              <span
                className="truncate flex-1 mr-2"
                title={loc.address || loc.name}
              >
                {loc.name || loc.address}
              </span>
              <button
                onClick={() => removeLocation(type, loc.id)}
                className="text-gray-400 hover:text-red-600"
              >
                <IoIosCloseCircleOutline size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const isPickupLocationFilled = internalMarkers.pickup.length > 0;
  const isDropoffLocationFilled = internalMarkers.dropoff.length > 0;
  const allRequiredLocationsFilled =
    isPickupLocationFilled && isDropoffLocationFilled;

  const handleSubmitAndProceed = async () => {
    // Make async for submitVehicleListing
    if (!allRequiredLocationsFilled) {
      alert("Please add at least one pickup and one drop-off location.");
      return;
    }
    try {
      // The useEffect for internalMarkers already updates vehicleData in the store
      // with the correct structure. submitVehicleListing will use that.
      await submitVehicleListing(); // submitVehicleListing is async
      nextStep();
    } catch (error) {
      console.error("Failed to submit vehicle listing:", error);
      alert("There was an error submitting the listing. Please try again.");
      // Handle error appropriately (e.g., show error message to user)
    }
  };

  return (
    <div className="flex bg-[#F8F8FF] gap-10">
      <div className="mx-auto md:p-10 p-6 lg:w-2/3 w-full bg-white rounded-2xl shadow-lg text-sm">
        {/* Progress Header */}
        <div className="flex items-center justify-center">
          <div className="w-4/5 border-b-4 border-[#00113D] mr-2"></div>
          <div className="w-1/5 border-b-4 border-blue-200"></div>
        </div>
        <p className="text-lg text-gray-800 my-4 font-medium">Step 4 of 5</p>

        <h1 className="text-3xl font-semibold my-6 text-gray-800">
          Car Locations
        </h1>
        <p className="text-gray-600 mb-6">
          Specify where customers can pick up and drop off the car. You can add
          multiple locations for each.
        </p>

        <button
          onClick={() => setShowModal(true)}
          className="py-3 hover:bg-blue-50 gap-2 w-full justify-center shadow-sm border border-gray-600 items-center rounded-2xl text-base flex transition-colors duration-150 "
        >
          <FaPlus size={14} /> Add New Location
        </button>

        {(!isPickupLocationFilled || !isDropoffLocationFilled) &&
          !showModal && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs">
              {!isPickupLocationFilled && (
                <p>• Please add at least one pickup location.</p>
              )}
              {!isDropoffLocationFilled && (
                <p className={!isPickupLocationFilled ? "mt-1" : ""}>
                  • Please add at least one drop-off location.
                </p>
              )}
            </div>
          )}

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-2 text-gray-700">
            Selected Locations
          </h2>
          <div className="gap-6 grid grid-cols-1 md:grid-cols-2 w-full">
            <LocationList
              title="Pickup Locations"
              locations={internalMarkers.pickup}
              type="pickup"
            />
            <LocationList
              title="Drop-off Locations"
              locations={internalMarkers.dropoff}
              type="dropoff"
            />
          </div>
          {internalMarkers.pickup.length === 0 &&
            internalMarkers.dropoff.length === 0 &&
            !showModal && (
              <p className="text-gray-500 text-sm italic mt-4">
                No locations selected yet. Click "Add New Location" to get
                started.
              </p>
            )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-out">
            <div className="bg-white rounded-xl shadow-2xl w-full md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  Set Location on Map
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setLocationType("");
                    setSearchQuery("");
                    setSuggestions([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IoMdClose size={28} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-grow">
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Location Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    required
                  >
                    <option value="">Select location type...</option>
                    {locationTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {!locationType && (
                    <p className="text-xs text-red-500 mt-1">
                      Please select a type to add a location.
                    </p>
                  )}
                </div>
                <div className="relative mb-4">
                  <input
                    type="text"
                    className="w-full p-2.5 pl-10 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search for a location (e.g., Bole, Addis Ababa)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={!locationType}
                  />
                  <FaSearch
                    size={16}
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                      !locationType ? "text-gray-300" : "text-gray-400"
                    }`}
                  />
                  {suggestions.length > 0 && searchQuery && (
                    <ul className="absolute left-0 right-0 bg-white border border-gray-300 mt-1 rounded-md max-h-48 overflow-y-auto z-20 shadow-lg">
                      {suggestions.map((suggestion) => (
                        <li
                          key={suggestion.place_id}
                          onClick={() => {
                            if (locationType)
                              handleSearchSelect(suggestion.place_id);
                          }}
                          className="p-3 text-sm hover:bg-gray-100 cursor-pointer"
                        >
                          {suggestion.description}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Or, click directly on the map to select a location.
                </p>
                <LoadScript
                  googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                  libraries={libraries}
                  loadingElement={
                    <div className="text-center py-4">Loading Map...</div>
                  }
                >
                  <GoogleMap
                    mapContainerStyle={mapStyles}
                    zoom={currentLocation ? 13 : 6}
                    center={currentLocation || defaultCenter}
                    onClick={handleMapClick}
                    onLoad={onMapLoad}
                    options={{
                      gestureHandling: "greedy",
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                    }}
                  >
                    {internalMarkers.pickup.map((marker) => (
                      <Marker
                        key={`map-pickup-${marker.id}`}
                        position={marker.position}
                        icon={{
                          url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                        }}
                      />
                    ))}
                    {internalMarkers.dropoff.map((marker) => (
                      <Marker
                        key={`map-dropoff-${marker.id}`}
                        position={marker.position}
                        icon={{
                          url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                        }}
                      />
                    ))}
                    {currentLocation && (
                      <Marker
                        position={currentLocation}
                        title="Your Current Location"
                        icon={{
                          url: "http://maps.google.com/mapfiles/kml/paddle/blu-blank.png",
                        }}
                      />
                    )}
                  </GoogleMap>
                </LoadScript>
                <button
                  onClick={handleMyLocation}
                  className="w-full p-2.5 border flex justify-center gap-2 mt-4 items-center border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FaMapMarkerAlt size={16} /> Center Map on My Location
                </button>
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setLocationType("");
                    setSearchQuery("");
                    setSuggestions([]);
                  }}
                  className="w-full p-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Done Adding Locations
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 md:flex-row mt-10 pt-6 border-t border-gray-200 justify-between">
          <button
            onClick={prevStep}
            className="px-10 py-3 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmitAndProceed}
            className={`md:w-fit cursor-pointer w-full items-center justify-center flex text-white text-xs rounded-full px-8 py-3 mt-8  transition bg-[#00113D] hover:bg-blue-900"
             ${
               allRequiredLocationsFilled
                 ? "bg-navy-900 hover:bg-navy-800 shadow-md"
                 : "bg-gray-400 cursor-not-allowed"
             }`}
            disabled={!allRequiredLocationsFilled}
          >
            Submit Listing
          </button>
        </div>
      </div>

      <div className="p-6 w-1/3 lg:flex hidden flex-col gap-4 text-sm bg-blue-50 border border-blue-200 rounded-lg shadow-sm h-fit">
        <h3 className="font-semibold text-blue-700">Location Tips:</h3>
        <ul className="list-disc list-inside text-blue-600 space-y-1 text-xs">
          <li>Be precise with your pickup and drop-off points.</li>
          <li>
            Consider adding locations near popular landmarks or transport hubs.
          </li>
          <li>You can add multiple options for flexibility.</li>
          <li>Use the search or click directly on the map.</li>
        </ul>
        <p className="text-xs text-gray-600 mt-2">
          Clear and convenient locations improve the chances of your car being
          booked.
        </p>
      </div>
    </div>
  );
};

export default Step4;
