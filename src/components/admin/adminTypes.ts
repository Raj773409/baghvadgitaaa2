export type AdminRole =
  | 'SUPER_ADMIN'
  | 'EVENT_ADMIN'
  | 'REGISTRATION_MANAGER'
  | 'FINANCE_MANAGER'
  | 'VOLUNTEER_MANAGER'
  | 'CONTENT_EDITOR'
  | 'MEDIA_MANAGER'
  | 'AUDITOR';

export type AdminModuleId =
  | 'overview'
  | 'websiteInventory'
  | 'participants'
  | 'registrations'
  | 'payments'
  | 'volunteers'
  | 'membership'
  | 'pageBuilder'
  | 'carousels'
  | 'gallery'
  | 'video'
  | 'hero'
  | 'krishnaFeature'
  | 'participationCategories'
  | 'donationConfig'
  | 'voiceScripts'
  | 'translations'
  | 'events'
  | 'schedule'
  | 'chapters'
  | 'scripture'
  | 'voice'
  | 'story'
  | 'leadership'
  | 'partners'
  | 'news'
  | 'faqs'
  | 'pages'
  | 'users'
  | 'analytics'
  | 'audit'
  | 'settings';

export interface AdminUserSession {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  mustChangePassword?: boolean;
}

export interface AdminPermissions {
  read: AdminModuleId[];
  write: AdminModuleId[];
}

export interface GatewayStatus {
  configured: boolean;
  providers: {
    razorpay: boolean;
    razorpayWebhook: boolean;
    stripe: boolean;
    customHmac: boolean;
  };
}

import type { AdminNotificationItem, ContentRevisionRecord } from '../../utils/cmsSync';

export interface DashboardPayload {
  range?: 'all' | '7d' | '30d';
  metrics: {
    totalRegistrations: number;
    totalHeadcount: number;
    verifiedParticipants: number;
    flaggedParticipants: number;
    pendingParticipants: number;
    totalDeclaredInr: number;
    capturedRevenueInr: number;
    totalVolunteers: number;
    approvedVolunteers: number;
    pendingVolunteers: number;
    totalMembers: number;
    publishedMedia: number;
    totalMedia: number;
    publishedCmsItems: number;
    totalCmsItems: number;
    adminUsersCount: number;
    totalPages?: number;
    publishedPages?: number;
    unpublishedDraftPages?: number;
    totalCarousels?: number;
    totalChapters?: number;
    totalVerses?: number;
    totalStoryScenes?: number;
  };
  notifications?: AdminNotificationItem[];
  countryBreakdown: Array<{ country: string; count: number }>;
  typeBreakdown: Array<{ type: string; count: number }>;
  recentAudit: AuditLogEntry[];
  recentRevisions?: ContentRevisionRecord[];
  gatewayStatus: GatewayStatus;
}

export interface ParticipantEntry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  noOfPersons: number;
  donationAmountInr: number;
  registrationType: string;
  country: string;
  city: string;
  assistance: { visa: boolean; accommodation: boolean; localTransport: boolean };
  events: { curtainRaiser: boolean; mahotsav: boolean };
  preferredLanguage?: string;
  familyOrGroupMembers?: string;
  organisationName?: string;
  organisationRole?: string;
  volunteerSkills?: string;
  parayanaCity?: string;
  assistanceNotes?: string;
  verificationStatus: 'pending' | 'verified' | 'flagged';
  paymentStatus: 'awaiting-gateway' | 'paid' | 'refunded';
  referenceCode: string;
  createdAt: string;
}

export interface PaymentEntry {
  id: string;
  participantId: string;
  participantName: string;
  amountInr: number;
  currency: 'INR';
  gateway: string;
  gatewayReference: string;
  gatewayOrderId: string | null;
  status: 'initiated' | 'captured' | 'refunded' | 'failed';
  createdAt: string;
}

export interface RefundEntry {
  id: string;
  paymentId: string;
  amountInr: number;
  reason: string;
  approvedBy: string;
  status: string;
  createdAt: string;
}

export interface VolunteerEntry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  department: 'hospitality' | 'translation' | 'media' | 'logistics' | 'stage';
  volunteerBadgeId: string;
  approvalStatus: 'pending' | 'approved' | 'declined';
  attendanceCount: number;
  createdAt: string;
}

export interface MembershipEntry {
  id: string;
  memberName: string;
  email: string;
  tier: 'patron' | 'lifetime' | 'institutional' | 'youth-fellow';
  country: string;
  status: 'active' | 'pending';
  createdAt: string;
}

export interface MediaEntry {
  id: string;
  kind: 'image' | 'video';
  category: 'mahabharata' | 'devis' | 'temples' | 'manuscripts' | 'festival' | 'teaser';
  title: string;
  description: string;
  language: string;
  copyright: string;
  source: string;
  altText: string;
  url: string;
  focalPoint: string;
  published: boolean;
  createdAt: string;
}

export interface CmsEntry {
  id: string;
  section:
    | 'hero'
    | 'krishnaFeature'
    | 'participationCategories'
    | 'donationConfig'
    | 'voiceScripts'
    | 'translations'
    | 'events'
    | 'schedule'
    | 'chapters'
    | 'scripture'
    | 'voice'
    | 'story'
    | 'leadership'
    | 'partners'
    | 'news'
    | 'faqs'
    | 'pages';
  title: string;
  subtitle: string;
  body: string;
  language: 'en' | 'hi' | 'te' | 'sa';
  status: 'published' | 'draft' | 'pending-review';
  meta: Record<string, string>;
  updatedAt: string;
}

export interface AdminUserEntry {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  mustChangePassword: boolean;
  passwordUpdatedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  module: string;
  targetId: string;
  summary: string;
}

export interface SystemSettingsEntry {
  registrationOpen: boolean;
  requireVolunteerApproval: boolean;
  maintenanceBanner: string;
  defaultVoiceGender: 'female' | 'male';
  backupRetentionDays: number;
}

export interface BackupEntry {
  fileName: string;
  sizeBytes: number;
  modifiedAt: string;
}

export const ADMIN_MODULE_GROUPS: ReadonlyArray<{
  group: string;
  items: ReadonlyArray<{ id: AdminModuleId; label: string }>;
}> = [
  {
    group: 'Command Operations',
    items: [
      { id: 'overview', label: 'Executive Dashboard' },
      { id: 'websiteInventory', label: 'Website Inventory (28 Routes)' },
      { id: 'participants', label: 'Participants' },
      { id: 'registrations', label: 'Registrations' },
      { id: 'payments', label: 'Payments & Refunds' },
      { id: 'volunteers', label: 'Volunteers' },
      { id: 'membership', label: 'Memberships' },
    ],
  },
  {
    group: 'Website & Page CMS',
    items: [
      { id: 'pageBuilder', label: 'Page Builder Studio' },
      { id: 'carousels', label: 'Carousel Manager' },
      { id: 'gallery', label: 'Media Image Library' },
      { id: 'video', label: 'Video & Audio Studio' },
    ],
  },
  {
    group: 'Scripture, 3D Story & Collections',
    items: [
      { id: 'chapters', label: '18 Gita Chapters' },
      { id: 'scripture', label: 'Scripture & Shloka Bank' },
      { id: 'story', label: '3D Story & GLB Inspector' },
      { id: 'events', label: 'Events Program' },
      { id: 'schedule', label: 'Schedule Ledger' },
      { id: 'participationCategories', label: 'Movement Pathways' },
      { id: 'leadership', label: 'Leadership Directory' },
      { id: 'partners', label: 'Organizing Partners' },
      { id: 'news', label: 'Announcements & Press' },
      { id: 'faqs', label: 'Official FAQs' },
    ],
  },
  {
    group: 'Localization & Voice',
    items: [
      { id: 'hero', label: 'Hero Headlines (Legacy CMS)' },
      { id: 'krishnaFeature', label: 'Sacred Showcase Copy' },
      { id: 'donationConfig', label: 'Donation Tiers' },
      { id: 'voiceScripts', label: 'Voice Prompts' },
      { id: 'translations', label: 'Multilingual Overrides' },
      { id: 'voice', label: 'Voice & Audio Settings' },
      { id: 'pages', label: 'Custom Page Notes' },
    ],
  },
  {
    group: 'Governance & Security',
    items: [
      { id: 'users', label: 'Users & RBAC Roles' },
      { id: 'analytics', label: 'Analytics & Reports' },
      { id: 'audit', label: 'Audit Logs' },
      { id: 'settings', label: 'Settings & Backups' },
    ],
  },
];
