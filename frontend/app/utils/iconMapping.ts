import React from 'react'
import {
  Wrench,
  Zap,
  Palette,
  Sparkles,
  Car,
  Snowflake,
  Shield,
  Smartphone,
  Settings,
  Star,
  HelpCircle,
  Edit,
  RotateCcw,
  Lock,
  LogOut,
  Search,
  Filter,
  ClipboardList,
  FileText,
  Trophy,
  Calendar,
  MessageCircle,
  User,
  CreditCard,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Camera,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Linkedin,
  Eye,
  EyeOff,
  Plus,
  Minus,
  X,
  Link as LinkIcon,
  ArrowRight,
  ArrowLeft,
  Home,
  Users,
  Target,
  Award,
  TrendingUp,
  TrendingDown,
  Heart,
  Clock,
  DollarSign,
  ShieldCheck,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Menu,
  Bell,
  X as Close,
  Cog,
  Truck,
  BarChart3
} from 'lucide-react';

// İsimden Lucide ikonlarına mapping
export const iconMapping = {
  // Hizmet ikonları
  'wrench': Wrench,
  'zap': Zap,
  'palette': Palette,
  'sparkles': Sparkles,
  'car': Car,
  'snowflake': Snowflake,
  'shield': Shield,
  'smartphone': Smartphone,
  'cog': Cog,
  'truck': Truck,
  
  // Özellik ikonları
  'trending': TrendingUp,
  'message': MessageCircle,
  'calendar': Calendar,
  'star': Star,
  'alert': AlertCircle,
  'bar-chart': BarChart3,
  
  // Ayarlar ikonları
  'user': User,
  'building': Building,
  'credit-card': CreditCard,
  'settings': Settings,
  'help': HelpCircle,
  'edit': Edit,
  'refresh': RotateCcw,
  'lock': Lock,
  'logout': LogOut,
  
  // Navigasyon ikonları
  'clipboard': ClipboardList,
  'file': FileText,
  'trophy': Trophy,
  
  // Arama ve filtreleme
  'search': Search,
  'filter': Filter,
  'bell': Bell,
  
  // Şehir ikonları
  'city': Building,
  'landmark': Building,
  'ocean': Globe,
  'mountain': Globe,
  'sunset': Globe,
  'factory': Building,
  
  // Sosyal medya ikonları
  'instagram': Instagram,
  'twitter': Twitter,
  'x-social': (({ size = 20, color = '#111' }: { size?: number; color?: string }) => {
    return React.createElement(
      'svg',
      { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
      React.createElement('path', { d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z', fill: color })
    )
  }), // Özel X ikonu
  'youtube': Youtube,
  'facebook': Facebook,
  'linkedin': Linkedin,
  // Extensions
  'whatsapp': MessageCircle,
  'copy': ClipboardList,
  'link': LinkIcon,
  
  // Form ikonları
  'eye': Eye,
  'eye-off': EyeOff,
  'plus': Plus,
  'minus': Minus,
  'x': X,
  'check': CheckCircle,
  'alert-circle': AlertCircle,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'menu': Menu,
  'close': Close,
  
  // Genel ikonlar
  'home': Home,
  'users': Users,
  'target': Target,
  'award': Award,
  'trending-up': TrendingUp,
  'heart': Heart,
  'clock': Clock,
  'dollar': DollarSign,
  'shield-check': ShieldCheck,
  'check-square': CheckSquare,
  'square': Square,
  'map-pin': MapPin,
  'phone': Phone,
  'mail': Mail,
  'globe': Globe,
  'camera': Camera,
  
  // HowItWorks ikonları
  'search-icon': Search,
  'users-icon': Users,
  'check-circle': CheckCircle,
  
  // Usta Ariyorum ikonları - zaten mevcut olanlar kaldırıldı
  'trending-down': TrendingDown,
  
  // En Yakın ikonları - zaten mevcut olanlar kaldırıldı
};

// İkon boyutları için preset'ler
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64
};

// İkon renkleri için preset'ler
export const iconColors = {
  primary: '#ffd600',
  secondary: '#666',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  white: '#ffffff',
  black: '#111111',
  gray: '#6b7280'
}; 