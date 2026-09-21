/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  Pencil,
  Search,
  Download,
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Briefcase,
  Laptop,
  ShoppingBag,
  Utensils,
  Car,
  Receipt,
  HeartPulse,
  GraduationCap,
  PlusCircle,
  AlertCircle,
  AlertTriangle,
  Sparkle,
  PanelLeftClose,
  PanelLeftOpen,
  Gamepad2,
  Moon,
  Sun,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  LogOut,
  RefreshCw,
  LoaderCircle,
} from 'lucide-react';

const iconMap = {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  Pencil,
  Search,
  Download,
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Briefcase,
  Laptop,
  ShoppingBag,
  Utensils,
  Car,
  Receipt,
  HeartPulse,
  GraduationCap,
  PlusCircle,
  AlertCircle,
  AlertTriangle,
  Sparkle,
  PanelLeftClose,
  PanelLeftOpen,
  Gamepad2,
  Moon,
  Sun,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  LogOut,
  RefreshCw,
  LoaderCircle,
};

export type IconName = keyof typeof iconMap;

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function LucideIcon({ name, className = '', size = 18 }: LucideIconProps) {
  const IconComponent = iconMap[name as IconName] || PlusCircle;
  return <IconComponent className={className} size={size} />;
}
