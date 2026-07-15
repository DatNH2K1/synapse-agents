import React from "react";
import Select from "./Select";

interface FormSelectProps {
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { value: string } }) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export default function FormSelect({
  label,
  value,
  defaultValue,
  onChange,
  options,
  className = "",
}: FormSelectProps) {
  // Use state to track the value only if it is uncontrolled
  const [localValue, setLocalValue] = React.useState(
    defaultValue || (options[0]?.value ?? ""),
  );

  // Derive the active value based on control status
  const currentValue = value !== undefined ? value : localValue;

  const handleChange = (val: string) => {
    if (value === undefined) {
      setLocalValue(val);
    }
    if (onChange) {
      onChange({ target: { value: val } });
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
          {label}
        </label>
      )}
      <Select
        value={currentValue}
        onChange={handleChange}
        options={options}
        className={className}
      />
    </div>
  );
}
