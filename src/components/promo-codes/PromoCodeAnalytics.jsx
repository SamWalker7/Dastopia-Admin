import React, { useEffect, useState } from "react";
import { Paper, CircularProgress, Button } from "@mui/material";
import PromoCodeTable from "./PromoCodeTable";
import CreatePromoCodeDialog from "./CreatePromoCodeDialog";
import EditPromoExpiryDialog from "./EditPromoExpiryDialog";
import { fetchPromoCodesApi } from "./promoCode.api";

export default function PromoCodeAnalytics() {
    const [promoCodes, setPromoCodes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const [lastKey, setLastKey] = useState(null);
    const [pageKeys, setPageKeys] = useState({ 0: null }); 

    const [openCreate, setOpenCreate] = useState(false);
    const [selectedPromo, setSelectedPromo] = useState(null);

    // =========================
    // FETCH PROMO CODES
    // =========================

    const loadPromoCodes = async (limit, pageIndex) => {
        setLoading(true);
        try {
            const res = await fetchPromoCodesApi({
                limit,
                lastKey: pageKeys[pageIndex],
            });

            
            setPromoCodes(res?.data?.promoCodes ?? []);
            setTotalCount(res?.data?.totalCount ?? 0);
            setLastKey(res?.data?.lastKey ?? null);


            // store next page key
            if (res.data.lastKey) {
                setPageKeys((prev) => ({
                    ...prev,
                    [pageIndex + 1]: res.data.lastKey,
                }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };


    // =========================
    // INITIAL LOAD / PAGE SIZE CHANGE
    // =========================
    useEffect(() => {
        setPage(0);
        setPageKeys({ 0: null });
        loadPromoCodes(rowsPerPage, 0);
    }, [rowsPerPage]);



    // =========================
    // HANDLERS
    // =========================
    const handleChangePage = (_, newPage) => {
        setPage(newPage);
        loadPromoCodes(rowsPerPage, newPage);
    };

    const handleChangeRowsPerPage = (newRows) => {
        setRowsPerPage(newRows);
    };

    // =========================
    // UI STATES
    // =========================
    if (loading) {
        return (
            <div className="flex justify-center h-64 items-center">
                <CircularProgress />
            </div>
        );
    }


    // =========================
    // RENDER
    // =========================
    return (
        <>
            <Button
                variant="contained"
                sx={{ mb: 2 }}
                onClick={() => setOpenCreate(true)}
            >
                Create Promo Code
            </Button>

            <Paper>
                <PromoCodeTable
                    promoCodes={promoCodes || []} 
                    page={page}
                    rowsPerPage={rowsPerPage}
                    totalCount={totalCount}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    onEditEndDate={(promo) => setSelectedPromo(promo)}
                />
            </Paper>

            <CreatePromoCodeDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSuccess={() => loadPromoCodes(rowsPerPage, page)}
            />

            <EditPromoExpiryDialog
                promo={selectedPromo}
                onClose={() => setSelectedPromo(null)}
                onSuccess={() => loadPromoCodes(rowsPerPage, page)}
            />
        </>
    );
}
