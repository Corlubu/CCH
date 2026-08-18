import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { AlertTriangle, Info, XCircle, CheckCircle } from "lucide-react";

type AnnouncementStyle = {
  bg: string;
  border: string;
  text: string;
  icon: React.ReactNode;
};

const defaultStyle: AnnouncementStyle = {
  bg: "bg-blue-50",
  border: "border-blue-400",
  text: "text-blue-800",
  icon: <Info className="h-5 w-5 text-blue-500" />,
};

const typeStyles: Record<string, AnnouncementStyle> = {
  danger: {
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-800",
    icon: <XCircle className="h-5 w-5 text-red-500" />,
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-400",
    text: "text-yellow-800",
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  },
  info: defaultStyle,
  success: {
    bg: "bg-green-50",
    border: "border-green-400",
    text: "text-green-800",
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
  },
};

export function AnnouncementBanner({ eventId }: { eventId?: number }) {
  const trpc = useTRPC();

  const { data: announcements } = useQuery(
    trpc.getActiveAnnouncements.queryOptions({ eventId }),
  );

  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {announcements.map((a) => {
        const style = typeStyles[a.type] ?? defaultStyle;
        return (
          <div
            key={a.id}
            className={`flex items-start gap-3 rounded-lg border-l-4 p-4 ${style.bg} ${style.border}`}
          >
            {style.icon}
            <div className={style.text}>
              {a.title && <p className="font-semibold">{a.title}</p>}
              <p className="text-sm">{a.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
