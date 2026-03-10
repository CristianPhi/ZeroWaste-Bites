import Image from "next/image"

type AppLogoProps = {
  alt?: string
  className?: string
  priority?: boolean
}

export function AppLogo({
  alt = "ZeroWaste Bites",
  className = "h-16 w-auto",
  priority = false,
}: AppLogoProps) {
  return (
    <>
      <Image
        src="/images/Logo.png"
        alt={alt}
        width={180}
        height={36}
        priority={priority}
        className={`${className} dark:hidden`}
      />
      <Image
        src="/images/Logo DrakTheme No Background.png"
        alt={alt}
        width={180}
        height={36}
        priority={priority}
        className={`hidden ${className} dark:block`}
      />
    </>
  )
}
