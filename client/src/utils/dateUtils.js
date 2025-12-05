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
  if (!date) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(date);
  
  if (isNaN(expiryDate.getTime())) return Infinity;

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

export const isExpired = (date) => {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Create a date for tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const productDate = new Date(date);
  // Ensure we compare apples to apples (start of day)
  productDate.setHours(0, 0, 0, 0);
  
  // Returns true if date is today, tomorrow, or in the past
  return productDate <= tomorrow;
};
