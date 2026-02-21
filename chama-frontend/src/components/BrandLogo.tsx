import chamaLogo from '../assets/chama-logo.png.png'

type BrandLogoProps = {
  size?: 'sm' | 'nav' | 'md' | 'lg'
  showWordmark?: boolean
  variant?: 'light' | 'dark'
  className?: string
}

const sizeConfig = {
  sm: { img: 32, text: 'text-base' },
  nav: { img: 48, text: 'text-xl' },
  md: { img: 48, text: 'text-lg' },
  lg: { img: 80, text: 'text-2xl' },
}

export function BrandLogo({
  size = 'md',
  showWordmark = true,
  variant = 'dark',
  className = '',
}: BrandLogoProps) {
  const { img: imgSize, text: textClass } = sizeConfig[size]
  const wordmarkColor = variant === 'light' ? 'text-white' : 'text-slate-800'
  const isLight = variant === 'light'
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={chamaLogo}
        alt="Chama"
        width={imgSize}
        height={imgSize}
        className={`shrink-0 object-contain ${isLight ? 'brightness-0 invert opacity-95' : ''}`}
      />
      {showWordmark && (
        <span
          className={`font-bold tracking-tight ${textClass} ${wordmarkColor} ${isLight ? 'drop-shadow-sm' : ''}`}
        >
          CHAMA
        </span>
      )}
    </div>
  )
}
