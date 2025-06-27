import * as React from "react";
import {
  ArrowUpCircleIcon,
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  UsersRound,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  MessageCircle,
  Icon,
  FileText,
  UserRound,
  User,
  UserCircle,
  CreditCard,
} from "lucide-react";

import { NavMain } from "@/components/common/nav-main";
import { NavProjects } from "@/components/common/nav-projects";
import { NavUser } from "@/components/common/nav-user";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
// import { TeamSwitcher } from "@/components/common/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { appName } from "@/config";

// This is sample data.
const initialData = {
  roles: {
    super_admin: {
      projects: [

        {
          name: "Dashboard",
          url: "/dashboard",
          icon: UsersRound, 
        },
        
       
      
        {
          name: "Messages",
          url: "/messages",
          icon: MessageCircle,
        },
        {
          name: "Chapter Meetings",
          url: "/chaptermeetings",
          icon: UsersRound,
        },

        {
          name: "Chapter Visitors",
          url: "/chapter-visitors",
          icon: UsersRound,
        },
        {
          name: "Done Deal",
          url: "/dashboard/done-deal",
          icon: FileText,
        },
        {
          name: "Requirements",
          url: "/requirements",
          icon: BookOpen,
        },
        {
          name: "View Requirements",
          url: "/viewrequirements",
          icon: BookOpen,
        },
        {
          name: "One-to-One Meetings",
          url: "/one-to-ones",
          icon: BookOpen,
        },
        {
          name: "References",
          url: "/references",
          icon: BookOpen,
        }
      ],
      navMain: [
        {
          title: "Reports",
          url: "#",
          icon: PieChart,
          isActive: false,
          items: [
            { title: "Member Report", url: "/memberreports" },
            { title: "Transaction Report", url: "/transactionreports" },
            { title: "Membership Report", url: "/membershipreports" },
          ],
        },
      ],
    },
    admin: {
      projects: [
        {
          name: "Dashboard",
          url: "/dashboard",
          icon: UsersRound, 
        },
        {
          name: "Manage States",
          url: "/states",
          icon: UsersRound,
        },
        {
          name: "Manage Zones",
          url: "/zones",
          icon: UsersRound,
        },
        {
          name: "Manage Locations",
          url: "/location",
          icon: UsersRound,
        },
        {
          name: "Manage Chapters",
          url: "/chapters",
          icon: UsersRound,
        },
        {
          name: "Manage Packages",
          url: "/packages",
          icon: UsersRound,
        },
        {
          name: "Manage Members",
          url: "/members",
          icon: UsersRound,
        },
        {
          name: "Manage Memberships",
          url: "/memberships",
          icon: UsersRound,
        },
        {
          name: "Manage Categories",
          url: "/categories",
          icon: UsersRound,
        },
        {
          name: "Manage Sub-Categories",
          url: "/sub-categories",
          icon: UsersRound,
        },

        {
          name: "Manage Trainings",
          url: "/trainings",
          icon: UsersRound,
        },
        {
          name: "Manage Messages",
          url: "/messages",
          icon: UsersRound,
        },
       
      ],

      // navMain: [
      //   {
      //     title: "Masters",
      //     url: "#",
      //     icon: SquareTerminal,
      //     isActive: false,
      //     items: [
           
         
             
      //     ],
      //   },
      // ],
    },
    member: {
      projects: [],
      navMain: [
        {
          title: "My Information",
          url: "#", 
          icon: User,
          isActive: false,
          items: [
            {
              title: "My Profile",
              url: "/profile",
              icon: UserCircle,
            },
            {
              title: "My Memberships",
              url: "/memberships",
              icon: CreditCard,
            }
          ],
        }
      ],
    },
  },
  user: {
    name: "",
    email: "",
    avatar: "",
    avatarName: "",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
};

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [data, setData] = React.useState({
    ...initialData,
    projects: [] as typeof initialData.roles.super_admin.projects,
    navMain: [] as typeof initialData.roles.admin.navMain,
  });

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        parsedUser.avatarName = parsedUser.name?.charAt(0).toUpperCase() || "U";

        // Default to admin if no role is specified, then fallback to super_admin for safety
        let role =
          (parsedUser.role as keyof typeof initialData.roles) || "admin";

        // If role doesn't exist in our initialData, default to super_admin
        if (!initialData.roles[role]) {
          role = "super_admin";
        }

        const roleData = initialData.roles[role];

        setData((prevData) => ({
          ...prevData,
          projects: roleData?.projects || [],
          navMain: roleData?.navMain || [],
          user: parsedUser,
        }));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        // If there's an error, set default projects for navigation
        setData((prevData) => ({
          ...prevData,
          projects: initialData.roles.super_admin.projects,
          navMain: initialData.roles.super_admin.navMain,
        }));
      }
    } else {
      // No user in localStorage, show default navigation
      setData((prevData) => ({
        ...prevData,
        projects: initialData.roles.super_admin.projects,
        navMain: initialData.roles.super_admin.navMain,
      }));
    }
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <SidebarMenu className="flex  ">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
             <div className="flex items-center gap-2  justify-between">
             <a
              className="flex items-center gap-2"
              >
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">{appName}</span>
              </a>
              <a
              className="flex items-center gap-2"
              href="/member/search">
                <Search className="h-5 w-5 mr-2" />
               </a>
              
             </div>
            </SidebarMenuButton>
            
          </SidebarMenuItem>
          {/* <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1 bg-white"
            >
              <a href="/dashboard">
                <Search className="h-5 w-5 " />
                <Input placeholder="Search" className="border-0 " />
               </a>
              
            </SidebarMenuButton>
            
          </SidebarMenuItem> */}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.projects || []} />
        <NavMain items={data.navMain || []} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar };
