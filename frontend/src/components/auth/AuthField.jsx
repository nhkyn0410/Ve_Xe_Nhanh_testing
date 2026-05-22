import { useState } from 'react';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const ACCENT = '#E89B26';
const DANGER = '#DC2626';
const BORDER = '#DFE2EC';

/**
 * Auth form field matching the split-screen design's FieldInput:
 * label · 52px bordered box (border turns accent when focused/filled,
 * red on error) · leading icon · optional password reveal · hint/error.
 *
 * Controlled — pass `value` + `onChange(nextValue)`.
 */
const AuthField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  icon: Icon,
  hint,
  error,
  autoComplete,
  inputMode,
  maxLength,
  onKeyDown,
  autoFocus,
}) => {
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (reveal ? 'text' : 'password') : type;
  const active = focused || (value && value.length > 0);
  const borderColor = error ? DANGER : active ? ACCENT : BORDER;
  const iconColor = error ? DANGER : active ? ACCENT : '#5E6165';

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-vxn-fg-3">{label}</span>
      <div
        className="flex h-[52px] items-center gap-2.5 rounded-[10px] bg-white px-4 transition-colors"
        style={{ border: `1.5px solid ${borderColor}` }}
      >
        {Icon && <Icon style={{ fontSize: 18, color: iconColor }} />}
        <input
          name={name}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          autoFocus={autoFocus}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: 0,
            fontSize: 15,
            fontWeight: 500,
            color: '#181C22',
            fontFamily: 'inherit',
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="grid h-6 w-6 place-items-center border-0 bg-transparent p-0 text-vxn-fg-4 hover:text-vxn-fg-2"
            aria-label={reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            tabIndex={-1}
          >
            {reveal ? (
              <EyeInvisibleOutlined style={{ fontSize: 16 }} />
            ) : (
              <EyeOutlined style={{ fontSize: 16 }} />
            )}
          </button>
        )}
      </div>
      {(hint || error) && (
        <span
          className="text-[12px]"
          style={{ color: error ? DANGER : '#64748B' }}
        >
          {error || hint}
        </span>
      )}
    </label>
  );
};

export default AuthField;
