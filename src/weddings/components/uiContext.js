import { createContext, useContext } from 'react'

// Shell-level actions any section can use: toasts, the sign-in sheet and
// moving between sections.
export const UICtx = createContext(null)
export const useUI = () => useContext(UICtx)
