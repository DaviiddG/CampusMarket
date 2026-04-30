import { useRef } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

export type TransitionVariant =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "hexagon"
  | "rectangle"
  | "star"

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
  variant?: TransitionVariant
  fromCenter?: boolean
}

function getClipPaths(cx: number, cy: number, maxR: number): [string, string] {
  return [
    `circle(0px at ${cx}px ${cy}px)`,
    `circle(${maxR}px at ${cx}px ${cy}px)`,
  ]
}

export const AnimatedThemeToggler = ({
  className,
  duration = 600,
  variant = "circle",
  fromCenter = false,
  ...props
}: AnimatedThemeTogglerProps) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const btn = buttonRef.current

    // Try View Transitions if available
    // @ts-ignore
    if (btn && typeof document.startViewTransition === "function") {
      const vw = window.innerWidth
      const vh = window.innerHeight
      let cx: number, cy: number

      if (fromCenter) {
        cx = vw / 2
        cy = vh / 2
      } else {
        const r = btn.getBoundingClientRect()
        cx = r.left + r.width / 2
        cy = r.top + r.height / 2
      }

      const maxR = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy))
      const [from, to] = getClipPaths(cx, cy, maxR)

      document.documentElement.dataset.themeVt = "1"
      document.documentElement.style.setProperty("--theme-vt-dur", `${duration}ms`)

      // @ts-ignore
      const vt = document.startViewTransition(() => {
        toggleTheme()
      })

      vt.ready.then(() => {
        document.documentElement.animate(
          { clipPath: [from, to] },
          {
            duration,
            easing: "ease-in-out",
            fill: "forwards",
            pseudoElement: "::view-transition-new(root)",
          }
        )
      }).catch(() => {/* ignore */})

      vt.finished.finally(() => {
        delete document.documentElement.dataset.themeVt
        document.documentElement.style.removeProperty("--theme-vt-dur")
      })

      return
    }

    // Fallback: plain toggle without animation
    toggleTheme()
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-3 rounded-xl",
        "hover:bg-gray-100 dark:hover:bg-white/10",
        "transition-colors text-left",
        className
      )}
      {...props}
    >
      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-black dark:text-white transition-colors">
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </div>
      <span className="text-sm font-roboto font-medium text-black dark:text-white">
        {isDark ? "Modo claro" : "Modo oscuro"}
      </span>
    </button>
  )
}
