// Real password-strength meter — score derived from the actual input.
export const scorePassword = (pw = '') => {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    digit: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
};

const LEVELS = [
  { label: 'Quá yếu', color: '#DC2626' },
  { label: 'Yếu', color: '#DC2626' },
  { label: 'Trung bình', color: '#E89B26' },
  { label: 'Khá', color: '#E89B26' },
  { label: 'Mạnh', color: '#047857' },
];

const PasswordStrength = ({ value = '' }) => {
  if (!value) return null;
  const { score } = scorePassword(value);
  const level = LEVELS[score];

  return (
    <div className="-mt-1 flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{ background: i < score ? level.color : '#E5E8F1' }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[12px] text-vxn-fg-5">
        <span style={{ color: level.color, fontWeight: 500 }}>
          {level.label}
        </span>
        <span>8+ ký tự · chữ hoa · số · ký tự đặc biệt</span>
      </div>
    </div>
  );
};

export default PasswordStrength;
