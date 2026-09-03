export type Plan = "free" | "pro" | "team";
export type UserRole = "user" | "admin";
export type PresentationStatus = "draft" | "generating" | "completed" | "failed";
export type SourceType = "prompt" | "document" | "text";

export interface MetricItem {
  value: string;
  label: string;
}

export interface ColumnData {
  title?: string;
  points?: string[];
}

export interface ChartData {
  type: string;
  labels: string[];
  data: number[];
  title: string;
}

export interface SlideImage {
  url: string;
  alt?: string;
  source?: string;
}

export interface Slide {
  id: string;
  index: number;
  layout: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  metrics?: MetricItem[];
  left_column?: ColumnData;
  right_column?: ColumnData;
  quote?: string;
  quote_author?: string;
  image?: SlideImage | null;
  image_prompt?: string;
  chart?: ChartData | null;
  icon?: string | null;
  speaker_notes?: string;
  background?: string;
  transition?: string;
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
  muted: string;
  headingFont: string;
  bodyFont: string;
  gradient: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  plan: Plan;
  ppt_count_month?: number;
  ppt_count_reset_date?: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  brand_kit?: Record<string, unknown>;
  locale?: string;
  onboarding_completed?: boolean;
  plan_expires_at?: string | null;
  last_login_at?: string | null;
  is_banned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Presentation {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  theme_id?: string | null;
  art_style?: string;
  slides_data: Slide[];
  slide_count: number;
  status: PresentationStatus;
  source_type?: SourceType | null;
  source_content?: string | null;
  language?: string;
  custom_theme?: ThemeConfig | null;
  is_public: boolean;
  share_token?: string;
  view_count?: number;
  thumbnail_url?: string | null;
  folder_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  thumbnail_url?: string | null;
  theme_config: ThemeConfig;
  art_style: string;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface PricingPlan {
  id: string;
  plan_name: Plan;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: Record<string, unknown>;
  is_active: boolean;
}