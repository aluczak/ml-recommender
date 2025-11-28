import { API_BASE_URL } from "../config";

type InteractionType = "view" | "click" | "add_to_cart" | "update_cart" | "pseudo_purchase";

type InteractionPayload = {
  productId: number;
  interactionType: InteractionType;
  metadata?: Record<string, unknown>;
};

export const sendInteraction = async (
  payload: InteractionPayload,
  token?: string | null
): Promise<void> => {
  const body = JSON.stringify({
    product_id: payload.productId,
    interaction_type: payload.interactionType,
    metadata: payload.metadata,
  });
  const url = `${API_BASE_URL}/interactions`;

  try {
    if (!token && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    await fetch(url, {
      method: "POST",
      headers,
      body,
      keepalive: true,
    });
  } catch {
    // Interaction logging best-effort; swallow errors to avoid breaking UX.
  }
};
