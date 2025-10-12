export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT'
});

export const NETWORK = import.meta.env.VITE_DEFAULT_NETWORK || 'holesky';
export const DEFAULT_ADMIN_ADDRESS = (
  import.meta.env.VITE_ADMIN_ADDRESS || "0xEa8315C53CC5C324e3F516d51bF91153aD94E40A"
).toLowerCase();
