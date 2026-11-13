// The admin project signs people in with the ADMIN accounts (the admins table), not with the students' accounts.
// This file keeps the old names, so every admin page and endpoint that already imports from "utils/auth.js" keeps working without any change.
export {
  requireAdmin,
  requireAdmin as requireUser,
  currentAdmin as currentUser,
  publicAdmin as publicUser,
  startAdminSession as startSession,
  endAdminSession as endSession
} from './admin-auth.js'

export const isAdmin = a => Boolean(a)
