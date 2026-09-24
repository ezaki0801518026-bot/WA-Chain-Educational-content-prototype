import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import ProfileSetup from '../components/ProfileSetup.jsx'
import { readProfile } from '../utils/profile.js'

// The reader's five answers, and the one dialog that edits them, shared by
// every page: the home page asks on the first visit and offers to change
// them later, and the menu opens the same dialog from anywhere.
const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => readProfile())
  const [setupOpen, setSetupOpen] = useState(false)
  const openSetup = useCallback(() => setSetupOpen(true), [])
  const closeSetup = useCallback(() => setSetupOpen(false), [])

  const value = useMemo(
    () => ({ profile, setProfile, setupOpen, openSetup, closeSetup }),
    [profile, setupOpen, openSetup, closeSetup],
  )

  return (
    <ProfileContext.Provider value={value}>
      {children}
      {setupOpen && (
        <ProfileSetup
          initial={profile}
          onDone={(saved) => {
            setProfile(saved)
            setSetupOpen(false)
          }}
          onClose={closeSetup}
        />
      )}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const value = useContext(ProfileContext)
  if (!value) throw new Error('useProfile needs a ProfileProvider')
  return value
}
