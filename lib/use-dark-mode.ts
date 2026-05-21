import useDarkModeImpl from '@fisch0920/use-dark-mode'
import * as React from 'react'

export function useDarkMode() {
  const darkMode = useDarkModeImpl(true, { classNameDark: 'dark-mode' })
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return {
    isDarkMode: mounted ? darkMode.value : false,
    toggleDarkMode: darkMode.toggle
  }
}