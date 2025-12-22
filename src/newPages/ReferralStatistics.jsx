// src/components/ReferralStatistics.jsx
import React, { useEffect, useState } from "react";
import SummaryCard from "../components/refference-stats/SummaryCard";
import ReferralTable from "../components/refference-stats/ReferralTable";

export default function ReferralStatistics() {
    const [stats, setStats] = useState(null);
    const [referrals, setReferrals] = useState([]);

    // pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchReferralStats();
    }, [page, rowsPerPage]);

    const fetchReferralStats = async () => {
        try {
            const admin = JSON.parse(localStorage.getItem("admin"));
            const token = admin?.AccessToken;

            if (!token) {
                throw new Error("Access token missing");
            }

            const response = await fetch(
                `https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/referrals/stats`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result?.success) {
                setStats(result.data);
                setReferrals(result.data.referrals ?? []);
                setTotalCount(result.data.totalReferrals ?? 0);
            } else {
                console.error("API error:", result?.error || result);
            }
        } catch (error) {
            console.error("Failed to fetch referral stats:", error.message);
        }
    };


    if (!stats) {
        return <div className="p-6 text-gray-400">Loading referral statistics…</div>;
    }

    return (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm p-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SummaryCard title="Total Referrals" value={stats.totalReferrals} />
                <SummaryCard title="Pending Referrals" value={stats.pendingReferrals} />
                <SummaryCard title="Completed Referrals" value={stats.completedReferrals} />
                <SummaryCard
                    title="Total Commission"
                    value={stats.totalCommission}
                    suffix="Birr"
                />
            </div>

            {/* Table */}
            <ReferralTable
                referrals={referrals}
                page={page}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={setPage}
                onRowsPerPageChange={(rows) => {
                    setRowsPerPage(rows);
                    setPage(0);
                }}
            />
        </div>
    );
}
