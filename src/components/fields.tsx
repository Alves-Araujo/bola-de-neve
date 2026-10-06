import { AnimatePresence, motion, useAnimate } from 'framer-motion'
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type FocusEvent, type ReactNode } from 'react'
import { formatBRL, formatNumber, parseDecimal } from '../lib/format'

interface SliderConfig {
  min: number
  max: number
  step: number
}

interface ShellProps {
  id: string
  label: string
  error?: string
  hint?: ReactNode
  shake?: number
  right?: ReactNode
  slider: SliderConfig
  value: number
  onSlide: (v: number) => void
  children: ReactNode
}

/** Seleciona tudo ao focar, para digitar por cima sem precisar apagar. */
function selectAllOnFocus(e: FocusEvent<HTMLInputElement>) {
  const el = e.currentTarget
  requestAnimationFrame(() => el.select())
}

function FieldShell({ id, label, error, hint, shake, right, slider, value, onSlide, children }: ShellProps) {
  const [scope, animate] = useAnimate()
  const pct = Math.min(100, Math.max(0, ((value - slider.min) / (slider.max - slider.min)) * 100))

  useEffect(() => {
    if (shake && error) animate(scope.current, { x: [0, -9, 9, -6, 6, -3, 3, 0] }, { duration: 0.45 })
  }, [shake]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={scope}>
      <div
        className="field group flex items-center gap-3 px-4 pb-2 pt-2.5"
        data-invalid={Boolean(error)}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return
          document.getElementById(id)?.focus()
        }}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <label
            htmlFor={id}
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted transition-colors group-focus-within:text-accent"
          >
            {label}
          </label>
          {children}
        </div>
        {right}
      </div>
      <input
        type="range"
        className="slider mt-2"
        aria-label={`${label} (controle deslizante)`}
        min={slider.min}
        max={slider.max}
        step={slider.step}
        value={Math.min(slider.max, Math.max(slider.min, value))}
        style={{ ['--pct' as string]: `${pct}%` }}
        onChange={(e) => onSlide(Number(e.target.value))}
      />
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key="err"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden text-xs text-danger"
            role="alert"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden text-xs text-muted"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

interface MoneyFieldProps {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
  slider: SliderConfig
  error?: string
  shake?: number
}

/** Campo de dinheiro com máscara BRL: os dígitos entram pela direita (centavos), como em app de banco. */
export function MoneyField({ id, label, value, onChange, slider, error, shake }: MoneyFieldProps) {
  const ref = useRef<HTMLInputElement>(null)

  // Mantém o cursor no fim depois de reformatar (sem atrapalhar seleções feitas pelo usuário).
  useLayoutEffect(() => {
    const el = ref.current
    if (el && document.activeElement === el && el.selectionStart === el.selectionEnd) {
      const end = el.value.length
      el.setSelectionRange(end, end)
    }
  }, [value])

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 13)
    onChange(Number(digits || '0') / 100)
  }

  return (
    <FieldShell id={id} label={label} error={error} shake={shake} slider={slider} value={value} onSlide={onChange}>
      <input
        ref={ref}
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={formatBRL(value)}
        onChange={handleChange}
        onFocus={selectAllOnFocus}
        aria-invalid={Boolean(error)}
        className="num mt-0.5 font-display text-lg font-semibold"
      />
    </FieldShell>
  )
}

interface NumberFieldProps {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
  slider: SliderConfig
  decimals?: number
  right?: ReactNode
  hint?: ReactNode
  error?: string
  shake?: number
}

/** Campo numérico livre (taxa, prazo) com vírgula decimal. */
export function NumberField({ id, label, value, onChange, slider, decimals = 2, right, hint, error, shake }: NumberFieldProps) {
  const format = (v: number) => (decimals === 0 ? String(Math.round(v)) : formatNumber(v, decimals, false))
  const [text, setText] = useState(() => format(value))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setText(format(value))
  }, [value, decimals]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    let s = e.target.value.replace(/\./g, ',').replace(/[^\d,]/g, '')
    if (decimals === 0) s = s.replace(/,/g, '')
    else {
      const [whole, ...rest] = s.split(',')
      s = rest.length ? `${whole},${rest.join('').slice(0, decimals)}` : whole
    }
    s = s.slice(0, 9)
    setText(s)
    onChange(parseDecimal(s))
  }

  return (
    <FieldShell id={id} label={label} error={error} hint={hint} shake={shake} right={right} slider={slider} value={value} onSlide={onChange}>
      <input
        id={id}
        inputMode={decimals === 0 ? 'numeric' : 'decimal'}
        autoComplete="off"
        value={text}
        onChange={handleChange}
        onFocus={(e) => {
          focused.current = true
          selectAllOnFocus(e)
        }}
        onBlur={() => {
          focused.current = false
          setText(format(value))
        }}
        aria-invalid={Boolean(error)}
        className="num mt-0.5 font-display text-lg font-semibold"
      />
    </FieldShell>
  )
}
