import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { IoFileTray } from "react-icons/io5";
import LibraryAddOutlined from "@mui/icons-material/LibraryAddOutlined";
import useVehicleFormStore from "../../store/useVehicleFormStore";

const Step2 = ({ nextStep, prevStep }) => {
  const {
    vehicleData,
    uploadedPhotos,
    uploadedDocuments,
    uploadVehicleImage,
    uploadAdminDocument,
    deleteVehicleImage,
    deleteAdminDocument,
    updateVehicleImage,
    updateAdminDocument,
  } = useVehicleFormStore();

  const [localUploadedPhotos, setLocalUploadedPhotos] =
    useState(uploadedPhotos);
  const [localUploadedDocuments, setLocalUploadedDocuments] =
    useState(uploadedDocuments);

  // Sync local state with central state
  useEffect(() => {
    setLocalUploadedPhotos(uploadedPhotos);
  }, [uploadedPhotos]);

  useEffect(() => {
    setLocalUploadedDocuments(uploadedDocuments);
  }, [uploadedDocuments]);

  // --- Validation Logic ---
  const requiredPhotoKeys = [
    "front",
    "back",
    "left",
    "right",
    "Front Interior",
    "Back Interior",
  ];
  const requiredDocumentKeys = ["libre", "license", "insurance"];

  const isFormValid = React.useMemo(() => {
    const allRequiredPhotosUploaded = requiredPhotoKeys.every(
      (key) => uploadedPhotos[key]?.base64
    );
    const allRequiredDocumentsUploaded = requiredDocumentKeys.every(
      (key) => uploadedDocuments[key]?.name
    );
    return allRequiredPhotosUploaded && allRequiredDocumentsUploaded;
  }, [uploadedPhotos, uploadedDocuments]);

  // --- Handlers (Unchanged) ---
  const handlePhotoUpload = async (e, key) => {
    const files = Array.from(e.target.files);
    const filesToProcess =
      requiredPhotoKeys.includes(key) && files.length > 0 ? [files[0]] : files;
    if (filesToProcess.length === 0) return;
    for (const file of filesToProcess) {
      await uploadVehicleImage(file, key);
    }
    e.target.value = null;
  };

  const handleDocumentUpload = async (e, key) => {
    const file = e.target.files[0];
    if (file) {
      await uploadAdminDocument(file, key);
    }
    e.target.value = null;
  };

  const handleDeletePhoto = (key, imageKey) => {
    deleteVehicleImage(key, imageKey);
  };

  const handleDeleteDocument = (key, documentKey) => {
    deleteAdminDocument(key, documentKey);
  };

  const handleEditPhoto = async (e, key, oldImageKey) => {
    const file = e.target.files[0];
    if (file) {
      await updateVehicleImage(file, key, oldImageKey);
    }
    e.target.value = null;
  };

  const handleEditDocument = async (e, key, oldDocumentKey) => {
    const file = e.target.files[0];
    if (file) {
      await updateAdminDocument(file, key, oldDocumentKey);
    }
    e.target.value = null;
  };

  const renderImagePreview = (base64, alt) => {
    return (
      <img
        src={base64}
        alt={alt}
        className="h-full w-full object-cover rounded-lg"
      />
    );
  };

  const handleContinueClick = () => {
    if (isFormValid) {
      nextStep();
    } else {
      console.log("Step 2 is not valid. Please upload all required files.");
    }
  };

  return (
    <div className="flex gap-10 bg-[#F8F8FF]">
      <div className="mx-auto p-8 md:w-2/3 w-full bg-white rounded-2xl shadow-sm">
        {/* Progress Bar and Heading (Unchanged) */}
        <div className="flex items-center justify-center">
          <div className="w-2/5 border-b-4 border-[#00113D] mr-2"></div>
          <div className="w-3/5 border-b-4 border-blue-200"></div>
        </div>
        <div className="flex justify-between w-full">
          <div className="flex flex-col w-1/2 items-start">
            <p className="text-xl text-gray-800 my-4 font-medium text-center mb-4">
              Steps 2 of 5
            </p>
          </div>
        </div>

        {/* Photos Section (Unchanged) */}
        <div className="mb-10">
          <h2 className="text-3xl font-semibold my-8">Upload Photos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {requiredPhotoKeys.map((key) => (
              <div
                key={key}
                className={`relative border-2 border-dashed rounded-lg h-16 md:h-32 group ${
                  localUploadedPhotos[key]?.base64
                    ? "border-gray-300 bg-white"
                    : " bg-gray-50"
                }`}
              >
                {localUploadedPhotos[key]?.base64 ? (
                  <>
                    {renderImagePreview(localUploadedPhotos[key].base64, key)}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                      <label className="cursor-pointer mx-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleEditPhoto(
                              e,
                              key,
                              localUploadedPhotos[key].key
                            )
                          }
                        />
                        <FaEdit className="text-white text-xl hover:text-blue-300" />
                      </label>
                      <FaTrash
                        className="text-white text-xl cursor-pointer mx-2 hover:text-red-500"
                        onClick={() =>
                          handleDeletePhoto(key, localUploadedPhotos[key].key)
                        }
                      />
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, key)}
                    />
                    <div className="text-gray-500 text-base">
                      <div className="flex items-center justify-center">
                        <div className="bg-gray-200 py-2 mx-2 rounded-lg px-4">
                          <IoFileTray size={14} />
                        </div>
                        <p
                          className={`text-sm ${
                            localUploadedPhotos[key]?.base64
                              ? "text-gray-400"
                              : ""
                          }`}
                        >
                          {key} <span className="text-red-500">*</span>
                        </p>
                      </div>
                    </div>
                  </label>
                )}
              </div>
            ))}
            <div className="relative rounded-lg h-16 md:h-32 flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 bg-gray-50">
              <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  multiple
                  onChange={(e) => handlePhotoUpload(e, "additional")}
                />
                <div className="text-gray-500 text-xl">
                  <span className="flex items-center justify-center text-sm">
                    <LibraryAddOutlined
                      style={{ fontSize: 20 }}
                      className="mr-2"
                    />
                    Additional Images (Optional)
                  </span>
                </div>
              </label>
            </div>
            {localUploadedPhotos.additional &&
              localUploadedPhotos.additional.map((img, idx) => (
                <div
                  key={img.key || idx}
                  className="relative border-2 border-dashed border-gray-300 rounded-lg h-40 group"
                >
                  {renderImagePreview(img.base64, `additional-${idx}`)}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                    <label className="cursor-pointer mx-2">
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
                      className="text-white text-xl cursor-pointer mx-2 hover:text-red-500"
                      onClick={() => handleDeletePhoto("additional", img.key)}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Documents Section */}
        <div className="md:mb-0 mb-8">
          <h2 className="text-3xl font-semibold mb-8 mt-16">
            Upload Documents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requiredDocumentKeys.map((key) => (
              <div
                key={key}
                className="flex md:flex-row flex-col justify-center items-center w-full"
              >
                <div
                  className={`text-gray-700 w-full md:w-72 mb-4 md:mb-0 mx-4 md:text-base text-lg font-medium capitalize ${
                    localUploadedDocuments[key]?.name ? "" : ""
                  }`}
                >
                  {key} Document <span className="text-red-500">*</span>
                </div>
                <div
                  className={`relative border-2 border-dashed p-4 rounded-lg flex items-center justify-center cursor-pointer group w-full ${
                    localUploadedDocuments[key]?.name
                      ? "border-gray-300 bg-white"
                      : " bg-gray-50"
                  }`}
                  onClick={() =>
                    !localUploadedDocuments[key]?.name &&
                    document.getElementById(`upload-${key}-doc`).click()
                  }
                >
                  {/* *** CHANGE HERE: Removed accept attribute *** */}
                  <input
                    id={`upload-${key}-doc`}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleDocumentUpload(e, key)}
                  />
                  {localUploadedDocuments[key]?.name ? (
                    <>
                      <div className="text-blue-500 underline truncate">
                        {localUploadedDocuments[key].name}
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                        <label className="cursor-pointer mx-2">
                          {/* *** CHANGE HERE: Removed accept attribute *** */}
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) =>
                              handleEditDocument(
                                e,
                                key,
                                localUploadedDocuments[key].key
                              )
                            }
                          />
                          <FaEdit className="text-white text-xl hover:text-blue-300" />
                        </label>
                        <FaTrash
                          className="text-white text-xl cursor-pointer mx-2 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(
                              key,
                              localUploadedDocuments[key].key
                            );
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500 flex items-center justify-center text-sm">
                      <div className="bg-gray-200 py-2 mx-2 rounded-lg px-4">
                        <IoFileTray size={14} />
                      </div>
                      <span className="text-blue-500 underline mr-2">
                        Click here
                      </span>
                      to upload
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons (Unchanged) */}
        <div className="w-full justify-between items-end gap-4 flex-col md:flex-row flex">
          <button
            onClick={prevStep}
            className="md:w-fit w-full text-black text-base rounded-full px-16 py-2 md:my-16 transition bg-white border hover:bg-blue-200"
          >
            Back
          </button>
          <button
            onClick={nextStep}
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
      <div className="p-8 w-1/4 hidden md:flex font-light bg-blue-200 py-10 h-fit">
        Please upload clear pictures of the car. Make sure you have at least 6
        images covering all corners. Also, upload the required vehicle
        documents.
      </div>
    </div>
  );
};

export default Step2;
