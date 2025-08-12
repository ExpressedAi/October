import {
  Bot,
  Puzzle,
  X,
  LucideIcon,
  Settings, // Import the Settings icon
  Split, // Import the Split icon for SBS Prompting
  Brain, // Import the Brain icon for Neural Highway
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link"; // Import Link for navigation
import { useTheme } from "next-themes";

export function Sidebar() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex h-full flex-col items-center bg-sidebar p-1 text-sidebar-foreground">
      <TooltipProvider delayDuration={0}>
        {/* Top section */}
        <div className="flex flex-1 flex-col items-center space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-2 h-auto w-auto hover:bg-accent"
              >
                <Bot size={28} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">
                Switch Theme
                <span className="block text-[10px] text-muted-foreground">
                  Currently: {theme === "light" ? "Light" : "Dark"}
                </span>
              </p>
            </TooltipContent>
          </Tooltip>

          <SidebarButton icon={Brain} label="Neural Highway" href="/neural-highway" />
          <SidebarButton icon={Puzzle} label="Extensions" href="/extensions" />
          <SidebarButton icon={Split} label="SBS Prompting" href="/sbs" />
          <SidebarButton icon={Settings} label="Agent Settings" href="/agent" />
        </div>

        {/* Bottom section */}
        <div className="mt-auto flex flex-col items-center space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarFallback>J</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="right">User</TooltipContent>
          </Tooltip>

        </div>
      </TooltipProvider>
    </div>
  );
}

/* Reusable sidebar button */
function SidebarButton({ icon: Icon, label, href }: { icon: LucideIcon; label: string; href?: string }) {
  const content = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label}>
          <Icon className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

