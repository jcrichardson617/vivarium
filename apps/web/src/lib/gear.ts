export const GEAR_CATEGORIES: { value: string; label: string }[] = [
  { value: "lighting", label: "Lighting & UVB" },
  { value: "heating", label: "Heating" },
  { value: "thermostat", label: "Thermostat" },
  { value: "substrate", label: "Substrate" },
  { value: "enclosure", label: "Enclosure" },
  { value: "food", label: "Food" },
  { value: "supplement", label: "Supplements" },
  { value: "monitoring", label: "Thermometers & monitoring" },
  { value: "other", label: "Other" },
];

export const categoryLabel = (c: string) => GEAR_CATEGORIES.find((x) => x.value === c)?.label ?? c;
