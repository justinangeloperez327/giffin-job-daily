export type LogisticsEditableFields = {
  driverEmployeeId: string | null;
  equipmentVehicle: string;
};

export function logisticsEditableFieldsFrom({
  driverEmployeeId,
  equipmentVehicle,
}: {
  driverEmployeeId?: string | null;
  equipmentVehicle?: string | null;
}): LogisticsEditableFields {
  return {
    driverEmployeeId: driverEmployeeId ?? null,
    equipmentVehicle: equipmentVehicle ?? "",
  };
}
