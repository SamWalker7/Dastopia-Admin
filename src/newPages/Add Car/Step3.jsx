import React, { useState, useEffect, useCallback } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { FiEdit2, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import useVehicleFormStore from "../../store/useVehicleFormStore";
import {
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

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
              className="w-8 h-8 flex items-center justify-center text-gray-600 text-xs sm:text-sm font-semibold"
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
  const [tempRangeStart, setTempRangeStart] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [selectedUnavailableEntries, setSelectedUnavailableEntries] = useState(
    () => {
      try {
        return vehicleData.unavailableDates &&
          Array.isArray(vehicleData.unavailableDates)
          ? vehicleData.unavailableDates
              .map((isoString) => {
                const date = normalizeDate(new Date(isoString));
                return date ? { date } : null;
              })
              .filter(Boolean)
          : [];
      } catch (e) {
        console.error("Error parsing unavailableDates for UI:", e);
        return [];
      }
    }
  );

  useEffect(() => {
    const allUnavailableIsoDates = [];
    selectedUnavailableEntries.forEach((entry) => {
      if (entry.date) {
        if (entry.date instanceof Date && !isNaN(entry.date)) {
          allUnavailableIsoDates.push(normalizeDate(entry.date).toISOString());
        }
      } else if (entry.start && entry.end) {
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
    const uniqueIsoDates = [...new Set(allUnavailableIsoDates)].sort();
    updateVehicleData({ unavailableDates: uniqueIsoDates });
  }, [selectedUnavailableEntries, updateVehicleData]);

  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
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
    "24 hours",
    "48 hours",
    "72 hours",
  ];
  const workingDaysOptions = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
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
    let selectedDate = normalizeDate(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    );
    if (!selectedDate) return;

    const today = normalizeDate(new Date());
    if (selectedDate < today) return;

    if (isDateUnavailable(selectedDate)) {
      setSelectedUnavailableEntries((prevEntries) =>
        prevEntries
          .reduce((acc, entry) => {
            if (entry.date) {
              if (
                normalizeDate(entry.date)?.getTime() !== selectedDate.getTime()
              ) {
                acc.push(entry);
              }
            } else if (entry.start && entry.end) {
              const entryStart = normalizeDate(entry.start);
              const entryEnd = normalizeDate(entry.end);
              if (selectedDate >= entryStart && selectedDate <= entryEnd) {
                if (selectedDate > entryStart)
                  acc.push({
                    start: entryStart,
                    end: new Date(selectedDate.getTime() - 86400000),
                  });
                if (selectedDate < entryEnd)
                  acc.push({
                    start: new Date(selectedDate.getTime() + 86400000),
                    end: entryEnd,
                  });
              } else {
                acc.push(entry);
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
          )
      );
      setTempRangeStart(null);
    } else {
      if (!tempRangeStart) {
        setTempRangeStart(selectedDate);
      } else {
        let [startDate, endDate] =
          tempRangeStart > selectedDate
            ? [selectedDate, tempRangeStart]
            : [tempRangeStart, selectedDate];
        const newEntry =
          startDate.getTime() === endDate.getTime()
            ? { date: startDate }
            : { start: startDate, end: endDate };
        setSelectedUnavailableEntries((prev) => [...prev, newEntry]);
        setTempRangeStart(null);
      }
    }
  };

  const removeUnavailableEntry = (indexToRemove) => {
    setSelectedUnavailableEntries((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
    setTempRangeStart(null);
  };

  const formatUnavailableDateEntry = (entry) => {
    if (entry.date) return formatDate(entry.date);
    if (entry.start && entry.end) {
      if (
        normalizeDate(entry.start)?.getTime() ===
        normalizeDate(entry.end)?.getTime()
      )
        return formatDate(entry.start);
      return `${formatDate(entry.start)} - ${formatDate(entry.end)}`;
    }
    return "Invalid Entry";
  };

  const renderCalendarDays = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
    const days = [];
    const today = normalizeDate(new Date());

    for (let i = 0; i < startingDay; i++)
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = normalizeDate(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      );
      if (!currentDate) continue;

      const isPast = currentDate < today;
      const isUnavailable = isDateUnavailable(currentDate);
      const isTempStart =
        tempRangeStart && currentDate.getTime() === tempRangeStart.getTime();
      const isToday = currentDate.getTime() === today.getTime();

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`w-8 h-8 flex items-center justify-center rounded-full text-xs sm:text-sm transition-all duration-200
                    ${
                      isPast
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700"
                    }
                    ${isUnavailable ? "bg-red-500 text-white" : ""}
                    ${isTempStart ? "bg-red-300 ring-2 ring-red-500" : ""}
                    ${
                      !isUnavailable && !isTempStart && !isPast
                        ? "hover:bg-gray-100"
                        : ""
                    }
                    ${
                      isToday && !isUnavailable && !isTempStart
                        ? "border-2 border-blue-600"
                        : ""
                    }
                `}
          disabled={isPast}
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

  const handleWorkingDaysChange = (day) => {
    const currentDays = vehicleData.driverWorkingDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    updateVehicleData({ driverWorkingDays: newDays });
  };

  const filteredFeatures = carFeatures.filter((f) =>
    f.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const suggestions = [
    "AWD",
    "Air Conditioning",
    "Extra Luggage",
    "Auto Parking",
  ];

  // --- Validation Logic ---
  const isPriceFilled =
    vehicleData.price?.toString().trim() !== "" &&
    !isNaN(parseFloat(vehicleData.price)) &&
    parseFloat(vehicleData.price) >= 0;

  let driverFieldsValid = true;
  if (
    vehicleData.serviceType === "with-driver" ||
    vehicleData.serviceType === "both"
  ) {
    const isDriverPriceValid =
      vehicleData.driverPrice?.toString().trim() !== "" &&
      !isNaN(parseFloat(vehicleData.driverPrice)) &&
      parseFloat(vehicleData.driverPrice) >= 0;
    const isDriverMaxHoursValid =
      vehicleData.driverMaxHours?.toString().trim() !== "" &&
      !isNaN(parseInt(vehicleData.driverMaxHours)) &&
      parseInt(vehicleData.driverMaxHours) > 0;
    const isDriverHoursValid = vehicleData.driverHours?.trim() !== "";
    const areDriverWorkingDaysValid = vehicleData.driverWorkingDays?.length > 0;
    driverFieldsValid =
      isDriverPriceValid &&
      isDriverMaxHoursValid &&
      isDriverHoursValid &&
      areDriverWorkingDaysValid;
  }

  const allRequiredFieldsFilled = isPriceFilled && driverFieldsValid;

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 bg-[#F8F8FF] p-4 sm:p-0">
      <div className="lg:mx-auto p-4 sm:p-8 w-full lg:w-2/3 bg-white rounded-2xl shadow-sm">
        {/* Progress Bar & Step Counter */}
        <div className="flex items-center">
          <div className="w-3/5 border-b-4 border-[#00113D]"></div>
          <div className="w-2/5 border-b-4 border-gray-200"></div>
        </div>
        <Typography variant="body1" className="text-gray-800 my-4 font-medium">
          Step 3 of 5
        </Typography>
        <div className="mb-8">
          <Typography
            variant="h6"
            component="h3"
            className="font-semibold mb-2"
          >
            Set Unavailable Dates
          </Typography>
          <Typography variant="body2" className="text-gray-600 mb-3">
            Block dates when the car is NOT available. If empty, the car is
            always available.
          </Typography>
          <button
            className="w-full p-3 border rounded-lg text-left flex justify-between items-center hover:bg-gray-50"
            onClick={() => setShowCalendar(true)}
          >
            <span>
              {selectedUnavailableEntries.length > 0
                ? `${selectedUnavailableEntries.length} period(s) blocked`
                : "Select dates to block"}
            </span>
            <FiEdit2 />
          </button>
          {selectedUnavailableEntries.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedUnavailableEntries.map((entry, index) => (
                <div
                  key={index}
                  className="bg-red-100 text-red-800 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                >
                  {formatUnavailableDateEntry(entry)}
                  <FaTimes
                    className="cursor-pointer"
                    size={12}
                    onClick={() => removeUnavailableEntry(index)}
                  />
                </div>
              ))}
            </div>
          )}
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

        {/* Car Features Section */}
        <section className="mb-12">
          <Typography
            variant="h4"
            component="h1"
            className="font-semibold mt-8 !text-2xl md:!text-3xl"
          >
            Car Features
          </Typography>
          <Typography variant="body2" className="text-gray-600 mt-2 mb-6">
            Select your car's features.
          </Typography>
          <div className="relative mb-6">
            <input
              type="text"
              className="w-full p-3 border rounded-lg pr-10"
              placeholder="Search features"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            {searchTerm && (
              <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg top-full max-h-60 overflow-y-auto">
                {filteredFeatures.length > 0 ? (
                  filteredFeatures.map((f) => (
                    <div
                      key={f}
                      className="p-3 hover:bg-gray-100 cursor-pointer"
                      onClick={() => addFeature(f)}
                    >
                      {f}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-500">No features found</div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {vehicleData.carFeatures?.map((f) => (
              <span
                key={f}
                className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm"
              >
                {f}{" "}
                <FaTimes
                  className="cursor-pointer"
                  size={12}
                  onClick={() => removeFeature(f)}
                />
              </span>
            ))}
          </div>
          <div>
            <Typography variant="subtitle1" className="text-gray-700 mb-3">
              Suggestions
            </Typography>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="border rounded-full px-4 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => addFeature(s)}
                  disabled={vehicleData.carFeatures?.includes(s)}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* --- NEW: Driver Service Section --- */}
        <section className="my-12">
          <Typography
            variant="h4"
            component="h2"
            className="font-semibold mb-2 !text-2xl md:!text-3xl"
          >
            Driver Service
          </Typography>
          <Typography variant="body2" className="text-gray-600 mb-6">
            Specify if the vehicle comes with a driver.
          </Typography>

          <FormControl fullWidth size="small" className="mb-6">
            <InputLabel>Service Type</InputLabel>
            <Select
              label="Service Type"
              name="serviceType"
              value={vehicleData.serviceType || "self-drive"}
              onChange={(e) =>
                updateVehicleData({ serviceType: e.target.value })
              }
            >
              <MenuItem value="self-drive">Self-Drive</MenuItem>
              <MenuItem value="with-driver">With Driver</MenuItem>
              <MenuItem value="both">
                Both (Self-Drive and With Driver)
              </MenuItem>
            </Select>
          </FormControl>

          {(vehicleData.serviceType === "with-driver" ||
            vehicleData.serviceType === "both") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50">
              <TextField
                label="Driver's Daily Price (ETB)"
                type="number"
                size="small"
                required
                value={vehicleData.driverPrice || ""}
                onChange={(e) =>
                  updateVehicleData({ driverPrice: e.target.value })
                }
                error={!vehicleData.driverPrice}
                helperText={
                  !vehicleData.driverPrice ? "Price is required." : ""
                }
              />
              <TextField
                label="Driver's Max Daily Hours"
                type="number"
                size="small"
                required
                value={vehicleData.driverMaxHours || ""}
                onChange={(e) =>
                  updateVehicleData({ driverMaxHours: e.target.value })
                }
                error={!vehicleData.driverMaxHours}
                helperText={
                  !vehicleData.driverMaxHours ? "Max hours are required." : ""
                }
              />
              <TextField
                label="Driver's Working Hours (e.g., 8 AM - 5 PM)"
                type="text"
                size="small"
                required
                className="md:col-span-2"
                value={vehicleData.driverHours || ""}
                onChange={(e) =>
                  updateVehicleData({ driverHours: e.target.value })
                }
                error={!vehicleData.driverHours}
                helperText={
                  !vehicleData.driverHours ? "Working hours are required." : ""
                }
              />
              <div className="md:col-span-2">
                <Typography
                  variant="subtitle2"
                  className="font-medium text-gray-800 mb-2"
                >
                  Driver's Working Days *
                </Typography>
                <FormGroup row>
                  {workingDaysOptions.map((day) => (
                    <FormControlLabel
                      key={day}
                      control={
                        <Checkbox
                          checked={
                            vehicleData.driverWorkingDays?.includes(day) ||
                            false
                          }
                          onChange={() => handleWorkingDaysChange(day)}
                          name={day}
                        />
                      }
                      label={<span className="capitalize text-sm">{day}</span>}
                    />
                  ))}
                </FormGroup>
                {vehicleData.driverWorkingDays?.length === 0 && (
                  <Typography variant="caption" color="error">
                    At least one working day is required.
                  </Typography>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Car Unavailability Section */}
        <section className="my-8">
          <Typography
            variant="h4"
            component="h2"
            className="font-semibold my-8 !text-2xl md:!text-3xl"
          >
            Car Availability & Pricing
          </Typography>

          <div className="mb-8">
            <Typography
              variant="h6"
              component="h3"
              className="font-semibold mb-2"
            >
              Advance Notice Period
            </Typography>
            <Typography variant="body2" className="text-gray-600 mb-3">
              How long in advance a renter needs to book.
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Notice Period</InputLabel>
              <Select
                label="Notice Period"
                value={vehicleData.advanceNoticePeriod || "24 hours"}
                onChange={(e) =>
                  updateVehicleData({ advanceNoticePeriod: e.target.value })
                }
              >
                {noticePeriods.map((period) => (
                  <MenuItem key={period} value={period}>
                    {period}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div
              className={`w-12 h-6 rounded-full p-1 cursor-pointer flex items-center transition-colors ${
                vehicleData.instantBooking ? "bg-blue-600" : "bg-gray-300"
              }`}
              onClick={() =>
                updateVehicleData({
                  instantBooking: !vehicleData.instantBooking,
                })
              }
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  vehicleData.instantBooking ? "transform translate-x-6" : ""
                }`}
              />
            </div>
            <span
              className="cursor-pointer"
              onClick={() =>
                updateVehicleData({
                  instantBooking: !vehicleData.instantBooking,
                })
              }
            >
              Enable Instant Booking
            </span>
          </div>

          <div className="mb-8">
            <Typography
              variant="h6"
              component="h3"
              className="font-semibold mb-3"
            >
              Vehicle Daily Price
            </Typography>
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <Typography variant="body2" className="text-blue-800">
                A service fee will be automatically deducted from the price you
                set.
              </Typography>
            </div>
            <TextField
              label="Daily Rental Price"
              type="number"
              size="small"
              fullWidth
              required
              value={vehicleData.price || ""}
              onChange={(e) => updateVehicleData({ price: e.target.value })}
              error={!isPriceFilled}
              helperText={!isPriceFilled ? "A valid price is required." : ""}
              InputProps={{
                startAdornment: <span className="text-gray-600 pr-2">ETB</span>,
              }}
            />
          </div>
        </section>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row mt-8 gap-4 justify-between">
          <button
            onClick={prevStep}
            className="w-full md:w-auto text-black font-semibold rounded-full px-8 py-3 transition bg-gray-200 hover:bg-gray-300"
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
      <div className="p-6 w-full lg:w-1/4 bg-blue-100 rounded-lg md:flex hidden flex-col h-fit">
        <Typography variant="h6" className="font-semibold mb-2">
          Configuration
        </Typography>
        <Typography variant="body2" className="text-gray-700">
          Define the vehicle's features, pricing, and availability. If offering
          a driver, ensure all driver-related fields are completed accurately.
        </Typography>
      </div>
    </div>
  );
};

export default Step3;
