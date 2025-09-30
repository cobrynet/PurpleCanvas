import { memo, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";

interface StableTextareaProps {
  id: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  "data-testid"?: string;
}

// Memoized textarea that never loses focus during re-renders
export const StableTextarea = memo(({ 
  id, 
  placeholder, 
  value, 
  onChange, 
  rows = 4,
  required = false,
  "data-testid": dataTestId 
}: StableTextareaProps) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Textarea
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      data-testid={dataTestId}
      rows={rows}
      required={required}
      autoComplete="off"
    />
  );
});

StableTextarea.displayName = "StableTextarea";
