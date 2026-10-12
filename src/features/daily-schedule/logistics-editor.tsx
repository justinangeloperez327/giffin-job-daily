"use client";

import { useId } from "react";

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
  const vehicleId = useId();
  const driver = driverOptions.find(
    (option) => option.employeeId === driverEmployeeId,
  );

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Driver</p>
        <DriverSelector
          options={driverOptions}
          value={driverEmployeeId}
          disabled={disabled}
          onValueChange={onDriverChange}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor={vehicleId} className="text-xs font-medium text-muted-foreground">
          Equipment / Vehicle
        </label>
        <Input
          id={vehicleId}
          value={equipmentVehicle}
          maxLength={200}
          disabled={disabled}
          placeholder="e.g. Bus 01, Pickup 03"
          className="h-9 rounded-none px-2"
          onChange={(event) => onEquipmentVehicleChange(event.target.value)}
        />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Driver Name</p>
        <div className="flex h-9 items-center border bg-muted/30 px-2 text-sm">
          {driver?.employeeName ?? "—"}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Driver Mobile</p>
        <div className="flex h-9 items-center border bg-muted/30 px-2 text-sm">
          {driver?.mobileNumber ?? "—"}
        </div>
      </div>
    </div>
  );
}
