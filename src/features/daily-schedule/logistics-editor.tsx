"use client";

import { Input } from "@/components/ui/input";
import { DriverSelector } from "@/features/daily-schedule/driver-selector";
import type { DriverOption } from "@/features/daily-schedule/driver-options";

export function LogisticsEditor({
  driverOptions,
  driverEmployeeId,
  equipmentVehicle,
  disabled,
  onDriverChange,
  onEquipmentVehicleChange,
}: {
  driverOptions: DriverOption[];
  driverEmployeeId: string | null;
  equipmentVehicle: string;
  disabled: boolean;
  onDriverChange: (employeeId: string | null) => void;
  onEquipmentVehicleChange: (value: string) => void;
}) {
  const driver = driverOptions.find(
    (option) => option.employeeId === driverEmployeeId,
  );

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Driver</p>
        <DriverSelector
          options={driverOptions}
          value={driverEmployeeId}
          disabled={disabled}
          onValueChange={onDriverChange}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Equipment / Vehicle
        </label>
        <Input
          value={equipmentVehicle}
          maxLength={200}
          disabled={disabled}
          placeholder="e.g. Bus 01, Pickup 03"
          onChange={(event) => onEquipmentVehicleChange(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Driver Name</p>
        <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm">
          {driver?.employeeName ?? "—"}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Driver Mobile</p>
        <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm">
          {driver?.mobileNumber ?? "—"}
        </div>
      </div>
    </div>
  );
}
