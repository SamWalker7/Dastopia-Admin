const BASE_URL =
    "https://oy0bs62jx8.execute-api.us-east-1.amazonaws.com/Prod/v1/admin/promo-codes";

const getToken = () =>
    JSON.parse(localStorage.getItem("admin"))?.AccessToken;

export const fetchPromoCodesApi = async ({ limit, lastKey }) => {
    const token = getToken();

    let url = `${BASE_URL}?status=all&limit=${limit}`;
    if (lastKey) url += `&lastKey=${lastKey}`;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch promo codes");
    return res.json();
};

export const createPromoCodeApi = async (payload) => {
    const token = getToken();

    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    // if (!res.ok) throw new Error(res.body.message);
    return res;
};


export const updatePromoApi = async (id, payload) => {
    const token = getToken();

    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        throw new Error(
            data?.message || "Failed to update promo code"
        );
    }

    return data;
};

export const handleConfirmDelete = async (id) => {
    const token = getToken();

    try {
        const response = await fetch(
            `${BASE_URL}/${id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to delete promo code");
        }

    } catch (err) {
        console.error(err);
        throw new Error("Failed to delete promo code");
    }
};