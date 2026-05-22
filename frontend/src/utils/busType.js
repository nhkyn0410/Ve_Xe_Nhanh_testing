export const BUS_TYPE_LABELS = {
  sleeper: 'Giường nằm',
  slepper: 'Giường nằm',
  seater: 'Ghế ngồi',
  seat: 'Ghế ngồi',
  limousine: 'Limousine',
  double_decker: 'Giường nằm 2 tầng',
  double_deck: 'Giường nằm 2 tầng',
  'double-decker': 'Giường nằm 2 tầng',
  'double-deck': 'Giường nằm 2 tầng',
};

export const normalizeBusTypeKey = (value = '') =>
  String(value || '').trim().toLowerCase().replace(/\s+/g, '_');

export const formatBusType = (value, fallback = 'Xe khách') => {
  const key = normalizeBusTypeKey(value);
  if (!key) return fallback;
  return BUS_TYPE_LABELS[key] || value || fallback;
};
