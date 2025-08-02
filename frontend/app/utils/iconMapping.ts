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
  X as Close
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
  
  // Özellik ikonları
  'trending': TrendingUp,
  'message': MessageCircle,
  'calendar': Calendar,
  'star': Star,
  'alert': AlertCircle,
  
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
  'youtube': Youtube,
  'facebook': Facebook,
  'linkedin': Linkedin,
  
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