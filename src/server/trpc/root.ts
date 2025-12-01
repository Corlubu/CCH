import {
  createCallerFactory,
  createTRPCRouter,
} from "~/server/trpc/main";
import { login } from "~/server/trpc/procedures/login";
import { createEvent } from "~/server/trpc/procedures/createEvent";
import { getActiveEvents } from "~/server/trpc/procedures/getActiveEvents";
import { registerCitizen } from "~/server/trpc/procedures/registerCitizen";
import { generateQRCode } from "~/server/trpc/procedures/generateQRCode";
import { getEventBySession } from "~/server/trpc/procedures/getEventBySession";
import { getDashboardStats } from "~/server/trpc/procedures/getDashboardStats";
import { getRecentRegistrations } from "~/server/trpc/procedures/getRecentRegistrations";
import { getAllEvents } from "~/server/trpc/procedures/getAllEvents";
import { updateEventStatus } from "~/server/trpc/procedures/updateEventStatus";
import { getEventDetails } from "~/server/trpc/procedures/getEventDetails";
import { updateRegistrationCheckIn } from "~/server/trpc/procedures/updateRegistrationCheckIn";
import { getAllUsers } from "~/server/trpc/procedures/getAllUsers";
import { getFeaturedQRCode } from "~/server/trpc/procedures/getFeaturedQRCode";
import { getUserProfile } from "~/server/trpc/procedures/getUserProfile";
import { updateUserProfile } from "~/server/trpc/procedures/updateUserProfile";
import { getUserPreferences } from "~/server/trpc/procedures/getUserPreferences";
import { updateUserPreferences } from "~/server/trpc/procedures/updateUserPreferences";
import { getUserRegistrations } from "~/server/trpc/procedures/getUserRegistrations";
import { createCitizen } from "~/server/trpc/procedures/createCitizen";
import { updateCitizen } from "~/server/trpc/procedures/updateCitizen";
import { toggleCitizenStatus } from "~/server/trpc/procedures/toggleCitizenStatus";
import { createStaff } from "~/server/trpc/procedures/createStaff";
import { updateStaff } from "~/server/trpc/procedures/updateStaff";
import { toggleStaffStatus } from "~/server/trpc/procedures/toggleStaffStatus";
import { searchRegistrations } from "~/server/trpc/procedures/searchRegistrations";
import { searchMyRegistrations } from "~/server/trpc/procedures/searchMyRegistrations";
import { exportCitizenData } from "~/server/trpc/procedures/exportCitizenData";
import { exportRegistrationDataExcel } from "~/server/trpc/procedures/exportRegistrationDataExcel";
import { getRegistrationCooldownSettings } from "~/server/trpc/procedures/getRegistrationCooldownSettings";
import { updateRegistrationCooldownSettings } from "~/server/trpc/procedures/updateRegistrationCooldownSettings";
import { autoCompleteExpiredEvents } from "~/server/trpc/procedures/autoCompleteExpiredEvents";
import { getAllCitizenProfiles } from "~/server/trpc/procedures/getAllCitizenProfiles";
import { exportCitizenProfilesToCSV } from "~/server/trpc/procedures/exportCitizenProfilesToCSV";

export const appRouter = createTRPCRouter({
  login,
  createEvent,
  getActiveEvents,
  registerCitizen,
  generateQRCode,
  getEventBySession,
  getDashboardStats,
  getRecentRegistrations,
  getAllEvents,
  updateEventStatus,
  getEventDetails,
  updateRegistrationCheckIn,
  getAllUsers,
  getFeaturedQRCode,
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  getUserRegistrations,
  createCitizen,
  updateCitizen,
  toggleCitizenStatus,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  searchRegistrations,
  searchMyRegistrations,
  exportCitizenData,
  exportRegistrationDataExcel,
  getRegistrationCooldownSettings,
  updateRegistrationCooldownSettings,
  autoCompleteExpiredEvents,
  getAllCitizenProfiles,
  exportCitizenProfilesToCSV,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
