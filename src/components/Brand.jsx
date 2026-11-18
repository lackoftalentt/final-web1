export const brandName = "Fujiwara Tofu Shop";

export default function Brand({ className = "" }) {
  return (
    <img
      className={`brand-logo ${className}`.trim()}
      src="./branding/fujiwara-logo.png"
      alt="藤原とうふ店（自家用） — Fujiwara Tofu Shop"
      width="1280"
      height="177"
      decoding="async"
    />
  );
}
