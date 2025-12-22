// src/components/SummaryCard.jsx
const SummaryCard = ({ title, value, suffix = "" }) => {
    const hasValue = value !== null && value !== undefined;

    return (
        <div className="bg-white shadow rounded-xl p-4 sm:p-5 lg:p-6 flex flex-col justify-between min-h-[110px]">
            <span className="text-xs sm:text-sm text-gray-500 truncate">
                {title}
            </span>

            {hasValue ? (
                <span className="mt-2 font-bold text-gray-900 text-2xl sm:text-3xl lg:text-4xl">
                    {value}
                    {suffix && (
                        <span className="ml-1 text-sm sm:text-base font-medium text-gray-600">
                            {suffix}
                        </span>
                    )}
                </span>
            ) : (
                <span className="mt-2 text-xl sm:text-2xl font-medium text-gray-400">
                    — —
                </span>
            )}
        </div>
    );
};

export default SummaryCard;
