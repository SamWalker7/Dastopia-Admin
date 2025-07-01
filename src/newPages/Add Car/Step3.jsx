import React, { useState, useEffect, useCallback } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { FiEdit2, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import useVehicleFormStore from "../../store/useVehicleFormStore"; // Assuming correct path

// Helper to set time to 00:00:00.000 for consistent date comparisons
const normalizeDate = (date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return null;
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const CalendarModal = ({
  showCalendar,
  setShowCalendar,
  currentMonth,
  setCurrentMonth,
  renderCalendarDays,
  daysOfWeek,
  months,
}) => {
  if (!showCalendar) return null;

  const monthYearOptions = [];
  const D = new Date();
  D.setDate(1);
  for (let i = 0; i < 24; i++) {
    monthYearOptions.push(new Date(D.getFullYear(), D.getMonth() + i));
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-auto">
        {" "}
        {/* Adjusted max-width and padding */}
        <div className="flex items-center justify-between mb-6">
          <select
            value={`${
              months[currentMonth.getMonth()]
            } ${currentMonth.getFullYear()}`}
            onChange={(e) => {
              const [monthStr, yearStr] = e.target.value.split(" ");
              setCurrentMonth(
                new Date(parseInt(yearStr), months.indexOf(monthStr))
              );
            }}
            className="text-base font-medium focus:outline-none bg-transparent border border-gray-300 rounded-md px-2 py-1"
          >
            {monthYearOptions.map((dateOption) => {
              const monthName = months[dateOption.getMonth()];
              const year = dateOption.getFullYear();
              const optionValue = `${monthName} ${year}`;
              return (
                <option key={optionValue} value={optionValue}>
                  {optionValue}
                </option>
              );
            })}
          </select>
          <div className="flex text-sm gap-2 sm:gap-4">
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1
                  )
                )
              }
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Previous month"
            >
              <FiChevronLeft className="text-lg" />
            </button>
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1
                  )
                )
              }
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Next month"
            >
              <FiChevronRight className="text-lg" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0 mb-4">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="w-8 h-8 flex items-center justify-center text-gray-600 text-xs sm:text-sm font-semibold" // smaller text on small screens
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 text-sm gap-0 mb-6">
          {renderCalendarDays()}
        </div>
        <div className="flex justify-end gap-4">
          <button
            className="px-6 py-3 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-md"
            onClick={() => setShowCalendar(false)}
          >
            Cancel
          </button>
          <button
            className="px-6 py-3 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-md"
            onClick={() => {
              setShowCalendar(false);
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const Step3 = ({ nextStep, prevStep }) => {
  const { vehicleData, updateVehicleData } = useVehicleFormStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [tempRangeStart, setTempRangeStart] = useState(null); // Only need start for temp range
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // selectedUnavailableEntries stores objects: { date: Date } or { start: Date, end: Date } for UI
  const [selectedUnavailableEntries, setSelectedUnavailableEntries] = useState(
    () => {
      try {
        // Initialize from store: vehicleData.unavailableDates are ISO strings
        // For UI, treat each as a single unavailable date entry initially.
        // More complex range reconstruction from flat list is possible but adds significant complexity.
        return vehicleData.unavailableDates &&
          Array.isArray(vehicleData.unavailableDates)
          ? vehicleData.unavailableDates
              .map((isoString) => {
                const date = normalizeDate(new Date(isoString));
                return date ? { date } : null;
              })
              .filter(Boolean) // Remove nulls from invalid dates
          : [];
      } catch (e) {
        console.error("Error parsing unavailableDates for UI:", e);
        return [];
      }
    }
  );

  // Effect to update the Zustand store (vehicleData.unavailableDates)
  // This effect will flatten selectedUnavailableEntries into an array of ISO date strings
  useEffect(() => {
    const allUnavailableIsoDates = [];
    selectedUnavailableEntries.forEach((entry) => {
      if (entry.date) {
        // Single date entry
        if (entry.date instanceof Date && !isNaN(entry.date)) {
          allUnavailableIsoDates.push(normalizeDate(entry.date).toISOString());
        }
      } else if (entry.start && entry.end) {
        // Date range entry
        if (
          entry.start instanceof Date &&
          !isNaN(entry.start) &&
          entry.end instanceof Date &&
          !isNaN(entry.end) &&
          normalizeDate(entry.start) <= normalizeDate(entry.end)
        ) {
          let current = normalizeDate(new Date(entry.start));
          const endDate = normalizeDate(new Date(entry.end));
          while (current <= endDate) {
            allUnavailableIsoDates.push(new Date(current).toISOString());
            current.setDate(current.getDate() + 1);
          }
        }
      }
    });
    // Ensure unique dates in the store
    const uniqueIsoDates = [...new Set(allUnavailableIsoDates)].sort(); // Sort for consistency
    updateVehicleData({ unavailableDates: uniqueIsoDates });
  }, [selectedUnavailableEntries, updateVehicleData]);

  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"]; // Shorter names for small cells
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Constants (unchanged)
  const carFeatures = [
    "GPS",
    "AWD",
    "Air Conditioning",
    "Auto Parking",
    "Extra Luggage",
    "Bluetooth",
    "Leather Seats",
    "Sunroof",
    "Backup Camera",
    "Heated Seats",
  ];
  const noticePeriods = [
    "2 hours",
    "6 hours",
    "12 hours",
    "1 day",
    "2 days",
    "3 days",
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDay: firstDay.getDay() };
  };

  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return "Invalid Date";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const isDateUnavailable = useCallback(
    (date) => {
      const normalizedTargetDate = normalizeDate(date);
      if (!normalizedTargetDate) return false;

      return selectedUnavailableEntries.some((entry) => {
        if (entry.date) {
          return (
            normalizeDate(entry.date)?.getTime() ===
            normalizedTargetDate.getTime()
          );
        }
        if (entry.start && entry.end) {
          const entryStart = normalizeDate(entry.start);
          const entryEnd = normalizeDate(entry.end);
          return (
            entryStart &&
            entryEnd &&
            normalizedTargetDate >= entryStart &&
            normalizedTargetDate <= entryEnd
          );
        }
        return false;
      });
    },
    [selectedUnavailableEntries]
  );

  const handleDateSelect = (day) => {
    let selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    selectedDate = normalizeDate(selectedDate);
    if (!selectedDate) return;

    // Prevent selection of past dates
    const today = normalizeDate(new Date());
    if (selectedDate < today) return;

    const alreadyUnavailable = isDateUnavailable(selectedDate);

    if (alreadyUnavailable) {
      // User clicked an already unavailable date - make it available (deselect)
      setSelectedUnavailableEntries(
        (prevEntries) =>
          prevEntries
            .reduce((acc, entry) => {
              if (entry.date) {
                // Single date entry
                if (
                  normalizeDate(entry.date)?.getTime() !==
                  selectedDate.getTime()
                ) {
                  acc.push(entry);
                }
              } else if (entry.start && entry.end) {
                // Range entry
                const entryStart = normalizeDate(entry.start);
                const entryEnd = normalizeDate(entry.end);

                if (selectedDate >= entryStart && selectedDate <= entryEnd) {
                  // Split the range
                  if (selectedDate > entryStart) {
                    // Part before the clicked date
                    acc.push({
                      start: entryStart,
                      end: new Date(
                        selectedDate.getTime() - 86400000
                      ) /* day before */,
                    });
                  }
                  if (selectedDate < entryEnd) {
                    // Part after the clicked date
                    acc.push({
                      start: new Date(
                        selectedDate.getTime() + 86400000
                      ) /* day after */,
                      end: entryEnd,
                    });
                  }
                } else {
                  acc.push(entry); // Range does not include the selected date
                }
              }
              return acc;
            }, [])
            .filter(
              (e) =>
                e.date ||
                (e.start &&
                  e.end &&
                  normalizeDate(e.start) <= normalizeDate(e.end))
            ) // Clean up empty ranges
      );
      setTempRangeStart(null); // Reset any pending range selection
    } else {
      // User clicked an available date - make it unavailable
      if (!tempRangeStart) {
        setTempRangeStart(selectedDate); // Start of a new unavailable range/single date
      } else {
        // Complete the range
        let startDate = tempRangeStart;
        let endDate = selectedDate;
        if (startDate > endDate) [startDate, endDate] = [endDate, startDate];

        if (startDate.getTime() === endDate.getTime()) {
          // Single day selection
          setSelectedUnavailableEntries((prev) => [
            ...prev,
            { date: startDate },
          ]);
        } else {
          // Range selection
          setSelectedUnavailableEntries((prev) => [
            ...prev,
            { start: startDate, end: endDate },
          ]);
        }
        setTempRangeStart(null); // Reset temp range
      }
    }
  };

  const removeUnavailableEntry = (indexToRemove) => {
    setSelectedUnavailableEntries((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
    setTempRangeStart(null); // Reset temp range if an entry is removed
  };

  const formatUnavailableDateEntry = (entry) => {
    if (entry.date) {
      return formatDate(entry.date);
    }
    if (entry.start && entry.end) {
      if (
        normalizeDate(entry.start)?.getTime() ===
        normalizeDate(entry.end)?.getTime()
      ) {
        return formatDate(entry.start);
      }
      return `${formatDate(entry.start)} - ${formatDate(entry.end)}`;
    }
    return "Invalid Entry";
  };

  const renderCalendarDays = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
    const days = [];
    const today = normalizeDate(new Date());

    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = normalizeDate(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      );
      if (!currentDate) continue;

      const isPastDate = currentDate < today;
      const isCurrentlyUnavailable = isDateUnavailable(currentDate);
      const isTempSelectionStart =
        tempRangeStart && currentDate.getTime() === tempRangeStart.getTime();

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`
            w-8 h-8 flex items-center justify-center focus:outline focus:outline-1 
            focus:outline-blue-400 rounded-full text-xs sm:text-sm transition-all duration-200
            ${isCurrentlyUnavailable ? "bg-red-500 text-white" : ""} 
            ${
              isTempSelectionStart
                ? "bg-red-300 text-black ring-2 ring-red-500"
                : ""
            }
            ${
              !isCurrentlyUnavailable && !isTempSelectionStart && !isPastDate
                ? "hover:bg-gray-100"
                : ""
            }
            ${
              currentDate.toDateString() === today.toDateString() &&
              !isCurrentlyUnavailable &&
              !isTempSelectionStart
                ? "border-2 border-navy-900"
                : ""
            }
            ${isPastDate ? "text-gray-400 cursor-not-allowed" : "text-gray-700"}
          `}
          disabled={isPastDate}
          aria-pressed={isCurrentlyUnavailable}
          aria-label={`${formatDate(currentDate)} ${
            isCurrentlyUnavailable
              ? "(Unavailable)"
              : isPastDate
              ? "(Past date)"
              : "(Available)"
          }`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  const addFeature = (feature) => {
    if (!vehicleData.carFeatures?.includes(feature)) {
      updateVehicleData({
        carFeatures: [...(vehicleData.carFeatures || []), feature],
      });
    }
    setSearchTerm("");
  };

  const removeFeature = (feature) => {
    updateVehicleData({
      carFeatures: vehicleData.carFeatures?.filter((f) => f !== feature) || [],
    });
  };

  const filteredFeatures = carFeatures.filter((feature) =>
    feature.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const suggestions = [
    "AWD",
    "Air Conditioning",
    "Extra Luggage",
    "Auto Parking",
  ];

  // --- Validation Logic ---
  const isAdvanceNoticePeriodFilled =
    vehicleData.advanceNoticePeriod &&
    vehicleData.advanceNoticePeriod.trim() !== "";
  // No longer require specific availability dates. Empty unavailableDates means fully available.
  // const isAvailabilityDatesFilled = selectedUnavailableEntries.length > 0; // Or vehicleData.unavailableDates.length > 0
  const isInstantBookingFilled =
    typeof vehicleData.instantBooking === "boolean";
  const isPriceFilled =
    vehicleData.price !== undefined &&
    vehicleData.price !== null &&
    vehicleData.price.toString().trim() !== "" &&
    !isNaN(parseFloat(vehicleData.price)) &&
    parseFloat(vehicleData.price) >= 0;

  const allRequiredFieldsFilled =
    //isAdvanceNoticePeriodFilled &&
    // isAvailabilityDatesFilled && // This might be optional now
    // isInstantBookingFilled &&
    isPriceFilled;
  // --- End Validation Logic ---

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 bg-[#F8F8FF] p-4 sm:p-0">
      <div className="lg:mx-auto p-4 sm:p-8 md:w-full lg:w-2/3 bg-white rounded-2xl shadow-sm text-base">
        {/* Progress Bar */}
        <div className="flex items-center justify-center">
          <div className="w-3/5 border-b-4 border-[#00113D] mr-2"></div>
          <div className="w-2/5 border-b-4 border-blue-200"></div>
        </div>
        <div className="flex justify-between w-full">
          <div className="flex flex-col w-1/2 items-start">
            <p className="text-lg sm:text-xl text-gray-800 my-4 font-medium text-center mb-4">
              Step 3 of 5
            </p>
          </div>
        </div>

        {/* Car Features Section (largely unchanged) */}
        <section className="mb-12">
          <h1 className="text-2xl sm:text-3xl font-semibold mt-8">
            Car Features
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mt-2 mb-6">
            Select your car's features.
          </p>
          <div className="relative items-center justify-center flex mb-6">
            <input
              type="text"
              className="w-full p-2 border rounded-lg pr-8 text-sm sm:text-base"
              placeholder="Search features"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
            {searchTerm && (
              <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg top-full max-h-60 overflow-y-auto">
                {filteredFeatures.length > 0 ? (
                  filteredFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="p-3 sm:p-4 hover:bg-gray-100 cursor-pointer text-xs sm:text-sm"
                      onClick={() => addFeature(feature)}
                    >
                      {feature}
                    </div>
                  ))
                ) : (
                  <div className="p-3 sm:p-4 text-xs sm:text-sm text-gray-500">
                    No features found
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
            {vehicleData.carFeatures?.map((feature) => (
              <span
                key={feature}
                className="bg-blue-100 text-blue-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm"
              >
                {feature}
                <FaTimes
                  className="cursor-pointer"
                  size={10}
                  onClick={() => removeFeature(feature)}
                  aria-label={`Remove ${feature}`}
                />
              </span>
            ))}
          </div>
          <div className="mt-6">
            <p className="text-gray-600 mb-3 text-base sm:text-lg">
              Suggestions
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="border rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => addFeature(suggestion)}
                  disabled={vehicleData.carFeatures?.includes(suggestion)}
                >
                  <span>+</span> {suggestion}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Car Unavailability Section */}
        <section className="my-8">
          <h2 className="text-2xl sm:text-3xl font-semibold my-8">
            Car Unavailability
          </h2>

          {/* Advance Notice Period */}
          {/* <div className="mb-8">
            <h3 className="text-base sm:text-lg font-semibold mb-3">
              Advance Notice Period
            </h3>
            <p className="text-gray-600 text-sm sm:text-base mb-3">
              How long in advance do you need to be notified before a trip
              starts.
            </p>
            <select
              className="w-full sm:w-4/6 p-2 border rounded-lg text-xs sm:text-sm"
              value={vehicleData.advanceNoticePeriod || ""}
              onChange={(e) =>
                updateVehicleData({ advanceNoticePeriod: e.target.value })
              }
            >
              <option value="">Set period duration</option>
              {noticePeriods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
            {!isAdvanceNoticePeriodFilled && (
              <p className="text-red-500 text-xs mt-1">
                This field is required.
              </p>
            )}
          </div> */}

          {/* Set Car Unavailability Dates */}
          <div className="mb-8">
            <h3 className="text-base sm:text-lg font-semibold mb-3">
              Set Unavailable/Blocked Dates
            </h3>
            <p className="text-gray-600 text-sm sm:text-base mb-3">
              Select dates or date ranges when your car will NOT be available.
              If no dates are selected, the car is assumed to be always
              available.
            </p>
            <button
              className="w-full p-2 border rounded-lg text-left text-xs sm:text-sm flex justify-between items-center hover:bg-gray-50"
              onClick={() => setShowCalendar(true)}
            >
              <span>
                {selectedUnavailableEntries.length > 0
                  ? `${selectedUnavailableEntries.length} unavailable period(s) set`
                  : "Select unavailable dates"}
              </span>
              <FiEdit2 className="text-sm" />
            </button>
            {selectedUnavailableEntries.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedUnavailableEntries.map((entry, index) => (
                  <div
                    key={index}
                    className="bg-red-100 text-red-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm flex items-center gap-2"
                  >
                    {formatUnavailableDateEntry(entry)}
                    <FaTimes
                      className="cursor-pointer"
                      size={10}
                      onClick={() => removeUnavailableEntry(index)}
                      aria-label={`Remove unavailability: ${formatUnavailableDateEntry(
                        entry
                      )}`}
                    />
                  </div>
                ))}
              </div>
            )}
            {/*
            If making unavailable dates mandatory:
            {!isAvailabilityDatesFilled && (
              <p className="text-red-500 text-xs mt-1">
                Please select at least one unavailable date or range if applicable.
              </p>
            )}
            */}
          </div>

          <CalendarModal
            showCalendar={showCalendar}
            setShowCalendar={setShowCalendar}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            renderCalendarDays={renderCalendarDays}
            daysOfWeek={daysOfWeek}
            months={months}
          />

          {/* Instant Booking (largely unchanged) */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className={`w-12 h-6 rounded-full p-1 cursor-pointer flex items-center transition-colors duration-300 ${
                vehicleData.instantBooking ? "bg-sky-950" : "bg-gray-300"
              }`}
              onClick={() =>
                updateVehicleData({
                  instantBooking: !vehicleData.instantBooking,
                })
              }
              role="switch"
              aria-checked={!!vehicleData.instantBooking}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  updateVehicleData({
                    instantBooking: !vehicleData.instantBooking,
                  });
              }}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                  vehicleData.instantBooking ? "transform translate-x-6" : ""
                }`}
              />
            </div>
            <span
              className="text-sm sm:text-base cursor-pointer"
              onClick={() =>
                updateVehicleData({
                  instantBooking: !vehicleData.instantBooking,
                })
              }
            >
              Instant booking
            </span>
          </div>
          {/* This field might not need an error message if a default is assumed, 
               but if undefined is the initial and not allowed:
            {!isInstantBookingFilled && (
                 <p className="text-red-500 text-xs mt-1 -translate-y-6">Please specify instant booking preference.</p>
            )} */}

          {/* Pricing (largely unchanged) */}
          <div className="mb-8">
            <h3 className="text-base sm:text-lg font-semibold mb-3">Pricing</h3>
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4">
              <p className="text-xs sm:text-sm text-blue-800">
                Please be aware that a service fee will be automatically
                deducted from the price you set.
              </p>
            </div>
            <p className="text-gray-600 text-sm sm:text-base mb-3">
              Set daily price for your car.
            </p>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <span className="px-3 font-semibold text-gray-700 text-xs sm:text-sm bg-gray-50 py-2.5">
                ETB
              </span>
              <input
                type="number"
                min="0"
                className="w-full p-2 text-xs sm:text-sm outline-none"
                placeholder="Set Daily car rent price"
                value={
                  vehicleData.price === null || vehicleData.price === undefined
                    ? ""
                    : vehicleData.price
                }
                onChange={(e) => {
                  const val = e.target.value;
                  updateVehicleData({
                    price: val === "" ? "" : parseFloat(val),
                  });
                }}
              />
            </div>
            {!isPriceFilled && (
              <p className="text-red-500 text-xs mt-1">
                Please enter a valid price.
              </p>
            )}
          </div>
        </section>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row mt-4 gap-4 justify-between">
          <button
            onClick={prevStep}
            className="px-6 sm:px-8 py-3 border border-gray-300 rounded-full text-xs sm:text-sm hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={nextStep}
            className={`md:w-fit cursor-pointer w-full items-center justify-center flex text-white text-xs rounded-full px-8 py-3 mt-8  transition bg-[#00113D] hover:bg-blue-900"
            ${
              allRequiredFieldsFilled
                ? "bg-navy-900 hover:bg-navy-800"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!allRequiredFieldsFilled}
          >
            Continue
          </button>
        </div>
      </div>

      {/* Side Panel */}
      <div className="p-4 sm:p-8 lg:w-1/4 md:flex hidden text-xs sm:text-sm bg-blue-100 py-6 h-fit rounded-lg shadow-sm">
        Ensure all availability (unavailable dates) and pricing details are
        accurate. If no dates are marked as unavailable, your car will be
        considered available for booking at any time, subject to your advance
        notice period.
      </div>
    </div>
  );
};

export default Step3;
