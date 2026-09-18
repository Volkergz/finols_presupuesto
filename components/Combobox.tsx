'use client';

import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

export interface ComboboxOption {
  id: number;
  label: string;
}

interface Props {
  id?: string;
  label: string;
  value: number | null;
  options: ComboboxOption[];
  placeholder?: string;
  onChange: (id: number | null) => void;
}

export default function Combobox({
  id,
  label,
  value,
  options,
  placeholder = 'Escribe para buscar…',
  onChange,
}: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => options.find((o) => o.id === value) ?? null, [options, value]);

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const inputValue = selected && !query ? selected.label : query;

  const abrir = () => {
    setQuery('');
    setHighlight(0);
    setOpen(true);
  };

  const seleccionar = (opt: ComboboxOption | null) => {
    onChange(opt?.id ?? null);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) abrir();
      else setHighlight((h) => Math.min(h + 1, filtradas.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtradas[highlight]) {
        e.preventDefault();
        seleccionar(filtradas[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const onBlur = () => {
    setTimeout(() => {
      setOpen(false);
      setQuery('');
    }, 120);
  };

  return (
    <div className="combobox">
      <label className="label" htmlFor={id}>{label}</label>
      <div className="combobox-input-wrap">
        <input
          ref={inputRef}
          id={id}
          className={`input${selected ? ' has-clear' : ''}`}
          value={inputValue}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls={`lista-${id}`}
          aria-autocomplete="list"
          aria-activedescendant={
            open && filtradas[highlight] ? `opt-${id}-${filtradas[highlight].id}` : undefined
          }
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={abrir}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
        />
        {selected && (
          <button
            type="button"
            className="combobox-clear"
            aria-label={`Quitar ${label}`}
            onClick={() => seleccionar(null)}
          >
            ×
          </button>
        )}
        {open && filtradas.length > 0 && (
          <ul className="combobox-menu" id={`lista-${id}`} role="listbox">
            {filtradas.map((opt, i) => (
              <li
                key={opt.id}
                id={`opt-${id}-${opt.id}`}
                role="option"
                aria-selected={opt.id === value}
                className={`combobox-item${i === highlight ? ' highlight' : ''}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => seleccionar(opt)}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}