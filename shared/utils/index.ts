export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toFixed(2)}`;
}

export function getShortOrderId(id: string): string {
  if (!id) return '';
  return id.includes('-') ? id.split('-')[1] : id;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}
