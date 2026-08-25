import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2"
      aria-label="LR home"
    >
      <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-sm font-bold text-white">
        LR
      </span>
      <span className="text-lg font-bold tracking-tight text-text-primary">
        LR
      </span>
    </Link>
  );
}
