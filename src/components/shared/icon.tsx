"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home02Icon,
  Search01Icon,
  SparklesIcon,
  MoreHorizontalIcon,
  BellIcon,
  Message01Icon,
  UserCircleIcon,
  UserAdd02Icon,
  Ticket01Icon,
  Logout01Icon,
  Settings02Icon,
  Cancel01Icon,
  ChevronRightIcon,
  Briefcase01Icon,
  UserGroup02Icon,
  UserCheck02Icon,
  HeartIcon,
  Share07Icon,
  Comment01Icon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  DeliveredSentIcon,
  ChevronUpIcon,
  Award01Icon,
  CrownIcon,
  PlusSignIcon,
  Image01Icon,
  Upload04Icon,
  Shield01Icon,
  UserMultiple02Icon,
  Calendar03Icon,
  MapPinIcon,
  PencilEdit02Icon,
  Delete02Icon,
  CheckmarkCircle03Icon,
  AlertCircleIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";

type IconProps = { className?: string; size?: number; strokeWidth?: number };

export function Icon({ name, className, size = 22, strokeWidth }: { name: string } & IconProps) {
  const iconMap: Record<string, any> = {
    home: Home02Icon,
    search: Search01Icon,
    sparkles: SparklesIcon,
    spark: StarIcon,
    more: MoreHorizontalIcon,
    bell: BellIcon,
    chat: Message01Icon,
    user: UserCircleIcon,
    userPlus: UserAdd02Icon,
    ticket: Ticket01Icon,
    logout: Logout01Icon,
    settings: Settings02Icon,
    x: Cancel01Icon,
    chevronRight: ChevronRightIcon,
    chevronUp: ChevronUpIcon,
    briefcase: Briefcase01Icon,
    users: UserGroup02Icon,
    userCheck: UserCheck02Icon,
    heart: HeartIcon,
    share: Share07Icon,
    comment: Comment01Icon,
    thumbsUp: ThumbsUpIcon,
    thumbsDown: ThumbsDownIcon,
    send: DeliveredSentIcon,
    award: Award01Icon,
    crown: CrownIcon,
    plus: PlusSignIcon,
    image: Image01Icon,
    upload: Upload04Icon,
    shield: Shield01Icon,
    userMultiple: UserMultiple02Icon,
    calendar: Calendar03Icon,
    mapPin: MapPinIcon,
    pencil: PencilEdit02Icon,
    trash: Delete02Icon,
    check: CheckmarkCircle03Icon,
    alert: AlertCircleIcon,
  };
  const iconData = iconMap[name] || Home02Icon;
  return (
    <HugeiconsIcon
      icon={iconData}
      className={className}
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}

export { HugeiconsIcon };
