// Shared types for talent discovery platform
import type { Category, Skill } from "@prisma/client";

export type SafeUser = {
  id: string;
  phone: string;
  name: string;
  role: string;
  isVerifiedBadge: boolean;
  isBanned: boolean;
  createdAt: string;
  profile: {
    id: string;
    bioShort: string;
    bioLong: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    gender: string | null;
    province: string | null;
    city: string | null;
    phoneVisible: boolean;
  } | null;
};

export type CategoryWithSkills = Category & { skills: Skill[] };

export type PostWithRelations = {
  id: string;
  content: string;
  createdAt: string;
  categoryId: string | null;
  skillId: string | null;
  categoryName: string | null;
  skillName: string | null;
  user: {
    id: string;
    name: string;
    isVerifiedBadge: boolean;
    avatarUrl: string | null;
  };
  likeCount: number;
  likedByMe: boolean;
  media: { id: string; url: string; type: string }[];
};

export type TalentListItem = {
  id: string;
  name: string;
  isVerifiedBadge: boolean;
  bioShort: string;
  avatarUrl: string | null;
  gender: string | null;
  province: string | null;
  city: string | null;
  categories: { id: string; name: string; iconUrl: string | null }[];
  followersCount: number;
};

// ─── Needs (نیازمندی‌ها) ───────────────────────────────────────
// A "Need" is a JobPost: anyone can post one, anyone can apply.

export type NeedSkill = { id: string; name: string };

export type NeedAttachment = {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
};

export type NeedListItem = {
  id: string;
  title: string;
  description: string;
  categoryName: string | null;
  province: string | null;
  city: string | null;
  status: string;
  createdAt: string;
  skills: NeedSkill[];
  applicationCount: number;
  appliedByMe: boolean;
  user: {
    id: string;
    name: string;
    isVerifiedBadge: boolean;
    avatarUrl: string | null;
  };
};

export type NeedApplication = {
  id: string;
  message: string;
  createdAt: string;
  applicant: {
    id: string;
    name: string;
    isVerifiedBadge: boolean;
    avatarUrl: string | null;
    bioShort: string | null;
  };
};

export type NeedDetail = NeedListItem & {
  description: string;
  attachments: NeedAttachment[];
  applications: NeedApplication[];
};

export type MyNeedsData = {
  posted: NeedListItem[];
  applied: {
    id: string; // application id
    message: string;
    createdAt: string;
    need: NeedListItem;
  }[];
};

export type NotificationCounts = {
  all: number;
  job_match: number;
  connection: number;
  chat: number;
  broadcast: number;
};

export type ProfileDetail = {
  id: string;
  userId: string;
  name: string;
  isVerifiedBadge: boolean;
  bioShort: string;
  bioLong: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  gender: string | null;
  province: string | null;
  city: string | null;
  phoneVisible: boolean;
  phone: string | null;
  createdAt: string;
  categories: { id: string; name: string; iconUrl: string | null; skills: { id: string; name: string }[] }[];
  experiences: {
    id: string;
    jobTitle: string;
    organization: string;
    startDate: string | null;
    endDate: string | null;
    description: string;
    categoryName: string | null;
    skillName: string | null;
  }[];
  educations: {
    id: string;
    degree: string;
    institution: string;
    year: string | null;
    description: string;
  }[];
  postCount: number;
  followersCount: number;
  followingCount: number;
  connectionStatus: "none" | "pending-sent" | "pending-received" | "accepted" | "self";
  isBanned: boolean;
};
