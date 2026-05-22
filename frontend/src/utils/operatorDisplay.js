export const getOperatorDisplayName = (operator, fallback = 'Nhà xe') => {
  if (!operator) return fallback;
  if (typeof operator === 'string') return operator || fallback;
  return operator.operatorName || operator.companyName || operator.name || fallback;
};

export const getOperatorInitials = (operator, fallback = 'NX') =>
  getOperatorDisplayName(operator, fallback)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
