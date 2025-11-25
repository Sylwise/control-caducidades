export const isDateValid = (dateString) => {
  if (!dateString) return false;
  try {
    const selectedDate = new Date(dateString);
    if (isNaN(selectedDate.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  } catch {
    return false;
  }
};

export const getDaysUntilExpiry = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(date);
  expiryDate.setHours(0, 0, 0, 0);
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const isExpiringSoon = (date) => {
  if (!date) return false;
  const today = new Date();
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(today.getDate() + 14);

  today.setHours(0, 0, 0, 0);
  twoWeeksFromNow.setHours(23, 59, 59, 999);

  const productDate = new Date(date);
  return productDate <= twoWeeksFromNow;
};
