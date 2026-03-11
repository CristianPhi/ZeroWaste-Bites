import Image from "next/image"

type AppLogoProps = {
  alt?: string
  className?: string
  priority?: boolean
}

export function AppLogo({
  alt = "ZeroWaste Bites",
  className = "h-10 w-auto",
  priority = false,
}: AppLogoProps) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src="/images/Logo.png"
        alt={alt}
        width={220}
        height={72}
        priority={priority}
        className="h-full w-full object-contain dark:hidden"
      />
      <Image
        src="/images/Logo DrakTheme No Background.png"
        alt={alt}
        width={220}
        height={72}
        priority={priority}
        className="hidden h-full w-full object-contain dark:block"
      />
    </span>
  )
}
