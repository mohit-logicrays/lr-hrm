import Link from "next/link";
import Image from "next/image";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="LR home">
      <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-md">
        <Image
          src="/lr_icon.png"
          alt="Logic Rays logo"
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
        />
      </span>
      <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
        Logic Rays
      </span>
    </Link>
  );
}
