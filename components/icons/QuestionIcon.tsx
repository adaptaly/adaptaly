export default function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="16" cy="16" r="14" stroke="#9CA3AF" strokeWidth="2" />
      <path
        d="M13 12.5C13 10.567 14.567 9 16.5 9C18.433 9 20 10.567 20 12.5C20 13.932 19.097 15.146 17.8 15.652C17.334 15.837 17 16.282 17 16.784V18"
        stroke="#9CA3AF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="17" cy="21.5" r="1" fill="#9CA3AF" />
    </svg>
  );
}
