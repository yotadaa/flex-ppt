import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function AppButton({ icon, variant = "secondary", size = "md", className = "", children, ...props }: AppButtonProps) {
  const simpleLabel = typeof children === "string" || typeof children === "number";
  return (
    <button type="button" {...props} className={`ui-button ui-button-${variant} ui-button-${size} ${className}`.trim()}>
      {icon ? <span className="ui-button-icon">{icon}</span> : null}
      {children ? (simpleLabel ? <span className="ui-button-label">{children}</span> : children) : null}
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: ReactNode;
  compact?: boolean;
};

export function IconButton({ label, icon, compact = false, className = "", ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={props.title || label}
      {...props}
      className={`ui-icon-button ${compact ? "ui-icon-button-compact" : ""} ${className}`.trim()}
    >
      {icon}
    </button>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  icon?: ReactNode;
  inputClassName?: string;
};

export function TextField({ label, icon, className = "", inputClassName = "", ...props }: TextFieldProps) {
  const field = (
    <span className={`ui-text-field ${icon ? "has-icon" : ""} ${className}`.trim()}>
      {icon ? <span className="ui-field-icon">{icon}</span> : null}
      <input type="text" {...props} className={inputClassName} />
    </span>
  );

  if (!label) return field;
  return (
    <label className="ui-field-label">
      <span>{label}</span>
      {field}
    </label>
  );
}

type NumberStepperProps = {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  showButtons?: boolean;
};

export function NumberStepper({
  label,
  value,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  onChange,
  className = "",
  showButtons = true,
}: NumberStepperProps) {
  const clamp = (next: number) => {
    const fallback = Number.isFinite(value) ? value : 0;
    const safeNext = Number.isFinite(next) ? next : fallback;
    return Math.min(max, Math.max(min, safeNext));
  };
  const content = (
    <span className={`ui-number-stepper ${showButtons ? "" : "ui-number-stepper-plain"} ${className}`.trim()}>
      {label ? <span className="ui-number-label">{label}</span> : null}
      <input
        type="number"
        min={Number.isFinite(min) ? min : undefined}
        max={Number.isFinite(max) ? max : undefined}
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value)))}
      />
      {showButtons ? (
        <span className="ui-number-buttons">
          <button type="button" aria-label={`${label || "Nilai"} naik`} onClick={() => onChange(clamp(value + step))}>
            <ChevronUpIcon aria-hidden="true" />
          </button>
          <button type="button" aria-label={`${label || "Nilai"} turun`} onClick={() => onChange(clamp(value - step))}>
            <ChevronDownIcon aria-hidden="true" />
          </button>
        </span>
      ) : null}
    </span>
  );
  return content;
}

type SelectOption<T extends string> = {
  value: T;
  label: string;
  note?: string;
};

type SelectMenuProps<T extends string> = {
  label?: string;
  value: T;
  options: Array<SelectOption<T>>;
  onChange: (value: T) => void;
  className?: string;
};

export function SelectMenu<T extends string>({ label, value, options, onChange, className = "" }: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  const id = useId();
  const selected = options.find((item) => item.value === value) || options[0];
  const canUseDocument = typeof document !== "undefined";

  const updatePopoverPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger || typeof window === "undefined") return;

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const preferredWidth = Math.max(rect.width, 260);
    const width = Math.min(preferredWidth, window.innerWidth - viewportPadding * 2);
    const left = Math.min(Math.max(rect.left, viewportPadding), window.innerWidth - width - viewportPadding);
    const estimatedHeight = Math.min(360, options.length * 58 + 2);
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const opensUp = spaceBelow < Math.min(estimatedHeight, 180) && spaceAbove > spaceBelow;
    const availableHeight = Math.max(120, opensUp ? spaceAbove - 8 : spaceBelow - 8);

    setPopoverStyle({
      left,
      width,
      maxHeight: Math.min(estimatedHeight, availableHeight),
      ...(opensUp ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
    });
  };

  useLayoutEffect(() => {
    if (open) updatePopoverPosition();
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [open]);

  const popover = open ? (
    <div ref={popoverRef} id={id} role="listbox" className="ui-select-popover" style={popoverStyle}>
      {options.map((item) => (
        <button
          key={item.value}
          type="button"
          role="option"
          aria-selected={item.value === value}
          className={item.value === value ? "active" : ""}
          onClick={() => {
            onChange(item.value);
            setOpen(false);
          }}
        >
          <strong>{item.label}</strong>
          {item.note ? <small>{item.note}</small> : null}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className={`ui-select-wrap ${className}`.trim()} ref={ref}>
      {label ? <span className="ui-field-label-text">{label}</span> : null}
      <button
        ref={triggerRef}
        type="button"
        className="ui-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>
          <strong>{selected?.label}</strong>
          {selected?.note ? <small>{selected.note}</small> : null}
        </span>
        <ChevronDownIcon aria-hidden="true" />
      </button>
      {open && canUseDocument ? createPortal(popover, document.body) : null}
    </div>
  );
}

type SegmentedControlProps<T extends string> = {
  value: T;
  options: Array<{ value: T; label: string; icon?: ReactNode }>;
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({ value, options, onChange, className = "" }: SegmentedControlProps<T>) {
  return (
    <div className={`ui-segmented ${className}`.trim()} role="tablist">
      {options.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={item.value === value}
          className={item.value === value ? "active" : ""}
          onClick={() => onChange(item.value)}
        >
          {item.icon ? <span className="ui-button-icon">{item.icon}</span> : null}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

type ColorFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
};

export function ColorField({ label, value, onChange, icon, className = "", ...props }: ColorFieldProps) {
  return (
    <label className={`ui-field-label ${className}`.trim()}>
      {label ? <span>{label}</span> : null}
      <span className="ui-color-field">
        <input
          type="color"
          value={value}
          onInput={(event) => onChange(event.currentTarget.value)}
          onChange={(event) => onChange(event.currentTarget.value)}
          {...props}
        />
        <code>{value}</code>
        {icon ? <span className="ui-field-icon">{icon}</span> : null}
      </span>
    </label>
  );
}

export function TrafficLights() {
  return (
    <span className="traffic-lights" aria-hidden="true">
      <span className="traffic-red" />
      <span className="traffic-yellow" />
      <span className="traffic-green" />
    </span>
  );
}

export function InlineStepperButtons({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <span className="ui-inline-stepper">
      <IconButton label="Sebelumnya" compact icon={<ChevronLeftIcon aria-hidden="true" />} onClick={onPrev} />
      <IconButton label="Berikutnya" compact icon={<ChevronRightIcon aria-hidden="true" />} onClick={onNext} />
    </span>
  );
}
