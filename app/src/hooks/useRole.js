import { useMemo } from "react";
import { useWeb3 } from "../state/Web3Provider.jsx";
import { ROLES } from "../lib/constants.js";

export default function useRole() {
  const { role, doctorId, patientId, adminAddress, isLoadingRole, roleError } = useWeb3();

  return useMemo(
    () => ({
      role,
      doctorId,
      patientId,
      adminAddress,
      isLoading: isLoadingRole,
      error: roleError,
      isAdmin: role === ROLES.ADMIN,
      isDoctor: role === ROLES.DOCTOR,
      isPatient: role === ROLES.PATIENT
    }),
    [role, doctorId, patientId, adminAddress, isLoadingRole, roleError]
  );
}
