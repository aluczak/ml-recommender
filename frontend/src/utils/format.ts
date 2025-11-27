export const formatPrice = (amount: number, currency: string | null | undefined) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
