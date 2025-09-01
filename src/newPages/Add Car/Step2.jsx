import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { IoFileTray } from "react-icons/io5";
import LibraryAddOutlined from "@mui/icons-material/LibraryAddOutlined";
import useVehicleFormStore from "../../store/useVehicleFormStore";
import { Typography } from "@mui/material";

// --- Configuration for Required Uploads ---
const requiredPhotos = [
  { key: "front", label: "Front View" },
  { key: "back", label: "Back View" },
  { key: "left", label: "Left Side" },
  { key: "right", label: "Right Side" },
  { key: "interiorFront", label: "Front Interior" },
  { key: "interiorBack", label: "Back Interior" },
];

const requiredDocuments = [
  { key: "libre", label: "Libre Document" },
  { key: "license", label: "License Document" },
  { key: "insurance", label: "Bolo Document" },
];

// --- Reusable Image Preview Component ---
const ImagePreview = ({ base64, alt }) => (
  <img
    src={base64}
    alt={alt}
    className="h-full w-full object-cover rounded-lg"
  />
);

const Step2 = ({ nextStep, prevStep }) => {
  const {
    vehicleData,
    updateVehicleData,
    uploadedPhotos,
    uploadedDocuments,
    uploadVehicleImage,
    uploadAdminDocument,
    deleteVehicleImage,
    deleteAdminDocument,
    updateVehicleImage,
    updateAdminDocument,
  } = useVehicleFormStore();

  // --- Validation Logic ---
  const isFormValid = React.useMemo(() => {
    const allPhotosUploaded = requiredPhotos.every(
      (photo) => uploadedPhotos[photo.key]?.base64
    );
    const allDocsUploaded = requiredDocuments.every(
      (doc) => uploadedDocuments[doc.key]?.name
    );

    // Check ownership status
    const isOwnerStatusSet =
      vehicleData.isPostedByOwner === "true" ||
      vehicleData.isPostedByOwner === "false";

    let isRepresentativeInfoValid = true;
    if (vehicleData.isPostedByOwner === "false") {
      isRepresentativeInfoValid =
        !!vehicleData.representativeFirstName &&
        !!vehicleData.representativeLastName &&
        !!vehicleData.representativePhone &&
        !!uploadedDocuments.powerOfAttorney?.name;
    }

    return (
      allPhotosUploaded &&
      allDocsUploaded &&
      isOwnerStatusSet &&
      isRepresentativeInfoValid
    );
  }, [vehicleData, uploadedPhotos, uploadedDocuments]);

  // --- Event Handlers ---
  const handlePhotoUpload = async (e, key) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const filesToProcess = key !== "additional" ? [files[0]] : files;
    for (const file of filesToProcess) {
      await uploadVehicleImage(file, key);
    }
    e.target.value = null;
  };

  const handleDocumentUpload = async (e, key) => {
    const file = e.target.files[0];
    if (file) await uploadAdminDocument(file, key);
    e.target.value = null;
  };

  const handleEditPhoto = async (e, key, oldImageKey) => {
    const file = e.target.files[0];
    if (file) await updateVehicleImage(file, key, oldImageKey);
    e.target.value = null;
  };

  const handleEditDocument = async (e, key, oldDocumentKey) => {
    const file = e.target.files[0];
    if (file) await updateAdminDocument(file, key, oldDocumentKey);
    e.target.value = null;
  };

  const handleDeletePhoto = (key, imageS3Key) =>
    deleteVehicleImage(key, imageS3Key);
  const handleDeleteDocument = (key, documentS3Key) =>
    deleteAdminDocument(key, documentS3Key);

  // --- Specific Handlers for Representative Flow ---
  const handleRepChange = (e) => {
    const { name, value } = e.target;
    updateVehicleData({ [name]: value });
  };

  const handlePoaUpload = (e) => handleDocumentUpload(e, "powerOfAttorney");
  const handlePoaEdit = (e) =>
    handleEditDocument(
      e,
      "powerOfAttorney",
      uploadedDocuments.powerOfAttorney?.key
    );
  const handleDeletePoa = () =>
    handleDeleteDocument(
      "powerOfAttorney",
      uploadedDocuments.powerOfAttorney?.key
    );

  const handleContinueClick = () => {
    if (isFormValid) {
      nextStep();
    } else {
      alert(
        "Please upload all required files and fill in all required fields to continue."
      );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 bg-[#F8F8FF]">
      <div className="mx-auto p-6 md:p-10 w-full lg:w-2/3 bg-white rounded-2xl shadow-sm">
        {/* Progress Bar & Step Counter */}
        <div className="flex items-center">
          <div className="w-2/5 border-b-4 border-[#00113D]"></div>
          <div className="w-3/5 border-b-4 border-gray-200"></div>
        </div>
        <Typography variant="body1" className="text-gray-800 my-4 font-medium">
          Step 2 of 5
        </Typography>

        {/* Photos Section */}
        <div className="mb-10">
          <Typography
            variant="h4"
            component="h1"
            className="font-semibold my-8 !text-2xl md:!text-3xl"
          >
            Upload Photos
          </Typography>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {requiredPhotos.map(({ key, label }) => (
              <div
                key={key}
                className={`relative border-2 border-dashed rounded-lg h-28 md:h-32 group transition-all ${
                  uploadedPhotos[key]?.base64
                    ? "border-gray-300"
                    : "border-gray-400 bg-gray-50"
                }`}
              >
                {uploadedPhotos[key]?.base64 ? (
                  <>
                    <ImagePreview
                      base64={uploadedPhotos[key].base64}
                      alt={label}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleEditPhoto(e, key, uploadedPhotos[key].key)
                          }
                        />
                        <FaEdit className="text-white text-xl hover:text-blue-300" />
                      </label>
                      <FaTrash
                        className="text-white text-xl cursor-pointer hover:text-red-500"
                        onClick={() =>
                          handleDeletePhoto(key, uploadedPhotos[key].key)
                        }
                      />
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-center p-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, key)}
                    />
                    <IoFileTray className="text-gray-500 mb-1" size={20} />
                    <p className="text-xs text-gray-600 font-medium">
                      {label} <span className="text-red-500">*</span>
                    </p>
                  </label>
                )}
              </div>
            ))}
            <label className="relative border-2 border-dashed border-gray-400 bg-gray-50 rounded-lg h-28 md:h-32 group transition-all flex flex-col items-center justify-center cursor-pointer text-center p-2 hover:border-blue-500 hover:bg-gray-100">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                multiple
                onChange={(e) => handlePhotoUpload(e, "additional")}
              />
              <LibraryAddOutlined className="text-gray-500 mb-1" />
              <p className="text-xs text-gray-600 font-medium">
                Additional Images{" "}
                <span className="font-normal">(Optional)</span>
              </p>
            </label>
            {uploadedPhotos.additional?.map((img, idx) => (
              <div
                key={img.key || idx}
                className="relative border-2 border-solid border-gray-300 rounded-lg h-28 md:h-32 group"
              >
                <ImagePreview base64={img.base64} alt={`additional-${idx}`} />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleEditPhoto(e, "additional", img.key)
                      }
                    />
                    <FaEdit className="text-white text-xl hover:text-blue-300" />
                  </label>
                  <FaTrash
                    className="text-white text-xl cursor-pointer hover:text-red-500"
                    onClick={() => handleDeletePhoto("additional", img.key)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents Section */}
        <div className="mb-10">
          <Typography
            variant="h4"
            component="h2"
            className="font-semibold mb-8 mt-16 !text-2xl md:!text-3xl"
          >
            Upload Documents
          </Typography>
          <div className="space-y-4">
            {requiredDocuments.map(({ key, label }) => (
              <div
                key={key}
                className="flex flex-col md:flex-row justify-between items-center w-full gap-4"
              >
                <Typography
                  variant="body1"
                  className="font-medium text-gray-700"
                >
                  {label} <span className="text-red-500">*</span>
                </Typography>
                <div className="relative border-2 border-dashed rounded-lg group w-full md:w-2/3 h-16">
                  {uploadedDocuments[key]?.name ? (
                    <div className="flex items-center justify-center w-full h-full px-4 text-center">
                      <p className="text-blue-600 font-medium truncate">
                        {uploadedDocuments[key].name}
                      </p>
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) =>
                              handleEditDocument(
                                e,
                                key,
                                uploadedDocuments[key].key
                              )
                            }
                          />
                          <FaEdit className="text-white text-xl hover:text-blue-300" />
                        </label>
                        <FaTrash
                          className="text-white text-xl cursor-pointer hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(
                              key,
                              uploadedDocuments[key].key
                            );
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center cursor-pointer w-full h-full text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload(e, key)}
                      />
                      <IoFileTray size={16} className="mr-2" />
                      <span className="text-blue-600 font-medium mr-1">
                        Click to upload
                      </span>{" "}
                      a file
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- NEW: Ownership & Representative Section --- */}
        <div className="mt-16">
          <Typography
            variant="h4"
            component="h2"
            className="font-semibold mb-8 !text-2xl md:!text-3xl"
          >
            Ownership Information
          </Typography>
          <div className="p-4 border border-gray-200 rounded-lg">
            <label className="block text-gray-700 text-lg font-medium mb-4">
              Are you the owner of the car?{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-8 mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="isPostedByOwner"
                  value="true"
                  checked={vehicleData.isPostedByOwner === "true"}
                  onChange={(e) =>
                    updateVehicleData({ isPostedByOwner: e.target.value })
                  }
                  className="h-5 w-5 text-[#00113D] focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-gray-700">Yes, I am the owner</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="isPostedByOwner"
                  value="false"
                  checked={vehicleData.isPostedByOwner === "false"}
                  onChange={(e) =>
                    updateVehicleData({ isPostedByOwner: e.target.value })
                  }
                  className="h-5 w-5 text-[#00113D] focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-gray-700">
                  No, I am a representative
                </span>
              </label>
            </div>

            {vehicleData.isPostedByOwner === "false" && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  Representative Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <input
                    type="text"
                    name="representativeFirstName"
                    placeholder="First Name *"
                    value={vehicleData.representativeFirstName || ""}
                    onChange={handleRepChange}
                    required
                    className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    name="representativeLastName"
                    placeholder="Last Name *"
                    value={vehicleData.representativeLastName || ""}
                    onChange={handleRepChange}
                    required
                    className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    name="representativePhone"
                    placeholder="Phone Number *"
                    value={vehicleData.representativePhone || ""}
                    onChange={handleRepChange}
                    required
                    className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    name="representativeEmail"
                    placeholder="Email (Optional)"
                    value={vehicleData.representativeEmail || ""}
                    onChange={handleRepChange}
                    className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <h3 className="text-lg font-medium mb-4 text-gray-800">
                  Power of Attorney <span className="text-red-500">*</span>
                </h3>
                <div
                  className={`relative border-2 border-dashed p-4 rounded-lg flex items-center justify-center cursor-pointer group w-full ${
                    uploadedDocuments.powerOfAttorney?.name
                      ? "border-gray-300 bg-white"
                      : " bg-gray-50"
                  }`}
                >
                  {uploadedDocuments.powerOfAttorney?.name ? (
                    <>
                      <div className="text-blue-500 underline truncate">
                        {uploadedDocuments.powerOfAttorney.name}
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                        <label className="cursor-pointer mx-2">
                          <input
                            type="file"
                            className="hidden"
                            onChange={handlePoaEdit}
                          />
                          <FaEdit className="text-white text-xl hover:text-blue-300" />
                        </label>
                        <FaTrash
                          className="text-white text-xl cursor-pointer mx-2 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePoa();
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <label className="flex items-center justify-center cursor-pointer w-full h-full text-sm text-gray-500">
                      <input
                        id="upload-poa-doc"
                        type="file"
                        className="hidden"
                        onChange={handlePoaUpload}
                      />
                      <div className="bg-gray-200 py-2 mx-2 rounded-lg px-4">
                        <IoFileTray size={14} />
                      </div>
                      <span className="text-blue-500 underline mr-2">
                        Click here
                      </span>{" "}
                      to upload
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center mt-12 md:mt-16 gap-4">
          <button
            onClick={prevStep}
            className="w-full md:w-auto text-black font-semibold rounded-full px-8 py-3 transition bg-gray-200 hover:bg-gray-300"
          >
            Back
          </button>
          <button
            onClick={handleContinueClick}
            className={`md:w-fit cursor-pointer w-full items-center justify-center flex text-white text-xs rounded-full px-8 py-3 mt-8  transition bg-[#00113D] hover:bg-blue-900"
            ${
              isFormValid
                ? "bg-[#00113D] hover:bg-blue-900 cursor-pointer"
                : "bg-gray-400 cursor-not-allowed opacity-70"
            }`}
            disabled={!isFormValid}
          >
            Continue
          </button>
        </div>
      </div>

      <div className="p-6 w-full lg:w-1/4 bg-blue-100 rounded-lg md:flex hidden flex-col h-fit">
        <Typography variant="h6" className="font-semibold mb-2">
          Photo & Document Guidelines
        </Typography>
        <Typography variant="body2" className="text-gray-700">
          Upload clear, well-lit images. Ensure all legal documents are uploaded
          and legible. If you are not the owner, you must provide representative
          details and a signed Power of Attorney.
        </Typography>
      </div>
    </div>
  );
};

export default Step2;
