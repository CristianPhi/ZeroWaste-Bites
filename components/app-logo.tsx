import Image from "next/image"

type AppLogoProps = {
  alt?: string
  className?: string
  priority?: boolean
}

export function AppLogo({
  alt = "ZeroWaste Bites",
  className = "",
  priority = false,
}: AppLogoProps) {
  return (
    <span className="inline-flex origin-left items-center">
      <Image
        src="/images/Logo.png"
        alt={alt}
        width={220}
        height={72}
        priority={priority}
        className={`${className} h-18! w-55! object-contain dark:hidden`}
      />
      <Image
        src="/images/Logo DrakTheme No Background.png"
        alt={alt}
        width={220}
        height={72}
        priority={priority}
        className={`hidden ${className} h-18! w-55! object-contain dark:block`}
      />
    </span>
  )
}
