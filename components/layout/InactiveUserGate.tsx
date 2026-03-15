'use client'

import { useInactiveUser } from '@/hooks/useInactiveUser'
import InactiveUserModal from '@/components/ui/InactiveUserModal'

/**
 * Renders the inactive-user modal when the user returns after > 1 hour.
 * Mount in root layout so it works on all pages.
 */
export default function InactiveUserGate() {
  const { showInactiveModal, onContinue, onRefresh } = useInactiveUser()
  return (
    <InactiveUserModal
      open={showInactiveModal}
      onContinue={onContinue}
      onRefresh={onRefresh}
    />
  )
}
