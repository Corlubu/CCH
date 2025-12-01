/**
 * Branding Configuration
 *
 * Change the organization name and logo here to update them throughout the entire application.
 *
 * The logo is currently set to a custom image. To change it back to a Lucide icon:
 * 1. Import your desired icon from lucide-react (e.g., import { Building2, Home, Users } from "lucide-react")
 * 2. Update the Icon property in BRAND_CONFIG below
 *
 * Available icons: https://lucide.dev/icons/
 */

/**
 * Custom Logo Component
 * Renders the organization's logo image
 */
const LogoImage = ({ className = "" }: { className?: string }) => {
  return (
    <img
      src="/logo-cch.jpg"
      alt="CENTRO CRISTIANO HISPANO Logo"
      className={className}
    />
  );
};

export const BRAND_CONFIG = {
  // Organization name - appears in headers, navigation, and throughout the app
  organizationName: "CENTRO CRISTIANO HISPANO",

  // Short name - used in mobile views and compact spaces
  organizationShortName: "CENTRO CRISTIANO",

  // Copyright text in footer
  copyrightName: "CENTRO CRISTIANO HISPANO",

  // Icon component - custom logo image
  Icon: LogoImage,

  // Icon color classes (Tailwind CSS) - updated to blue to match logo
  iconColorClass: "text-blue-600",
  iconBgColorClass: "bg-blue-100",
} as const;
