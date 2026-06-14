import { createContext, useContext, useState } from 'react'

const IntroContext = createContext({ introDone: false, setIntroDone: () => {} })

export function IntroProvider({ children }) {
  const [introDone, setIntroDone] = useState(false)
  return (
    <IntroContext.Provider value={{ introDone, setIntroDone }}>
      {children}
    </IntroContext.Provider>
  )
}

export const useIntro = () => useContext(IntroContext)