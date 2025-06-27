import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Add custom styles for hiding scrollbars while maintaining scroll functionality
const hideScrollbarStyle = `
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

// Add inline style for hiding scrollbars
const scrollbarHideStyle = {
  scrollbarWidth: "none" as "none",  /* Firefox */
  msOverflowStyle: "none" as "none",  /* IE and Edge */
};

// Message interface for dashboard
interface Message {
  id: number;
  heading: string;
  powerteam: string;
  message: string;
  attachment: string | null;
  createdAt: string;
  updatedAt: string;
  chapterId: number | null;
}

// Chapter Meeting interface for dashboard
interface ChapterMeeting {
  id: number;
  date: string;
  meetingTime: string;
  meetingTitle: string;
  meetingVenue: string;
  chapterId: number;
  createdAt: string;
  updatedAt: string;
}

// Training interface for dashboard
interface Training {
  id: number;
  trainingDate: string;
  trainingTopic: string;
  createdAt: string;
  updatedAt: string;
}

// UpcomingBirthday interface for dashboard
interface UpcomingBirthday {
  id: number;
  memberName: string;
  dateOfBirth: string;
  chapterId: number | null;
  organizationName: string;
  businessCategory: string;
  chapter: {
    name: string | null;
  } | null;
  daysUntilBirthday: number;
  upcomingBirthday: string;
}

import bannerImage from "@/images/banner.jpg";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  Bell,
  FlaskConical,
  LayoutDashboard,
  Menu,
  MoveRight,
  Users,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShimmerButton } from "@/components/ui/shimmer-button"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
 import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";
import userAvatar from "@/images/Profile.jpg";

// Updated data structure based on your requirements
const recentTests = [
  {
    id: "T001",
    contact_person: "John Doe",
    follow_up_remark: "Schedule Meetings",
    status: "Completed",
    follow_up_type: "High",
  },
  {
    id: "T002",
    contact_person: "Jane Smith",
    follow_up_remark: "Maintain Records",
    status: "Completed",
    follow_up_type: "Medium",
  },
  {
    id: "T003",
    contact_person: "Bob Johnson",
    follow_up_remark: "Campus Cleanliness",
    status: "In Progress",
    follow_up_type: "Low",
  },
  {
    id: "T004",
    contact_person: "Alice Brown",
    follow_up_remark: "Assist Students",
    status: "Completed",
    follow_up_type: "Medium",
  },
  {
    id: "T005",
    contact_person: "Charlie Davis",
    follow_up_remark: "Organize Events",
    status: "Completed",
    follow_up_type: "High",
  },
];

const testVolumeData = [
  { name: "Jan", tests: 165 },
  { name: "Feb", tests: 180 },
  { name: "Mar", tests: 200 },
  { name: "Apr", tests: 220 },
  { name: "May", tests: 195 },
  { name: "Jun", tests: 210 },
];

export default function ResponsiveLabDashboard() {
  const navigate = useNavigate();
  const [businessTotal, setBusinessTotal] = useState(0);
  const [referencesCount, setReferencesCount] = useState(0);
  const [totalVisitorsCount, setTotalVisitorsCount] = useState(0);
  const [oneToOneCount, setOneToOneCount] = useState(0);
  const [memberGivenReferencesCount, setMemberGivenReferencesCount] = useState(0);
  const [memberReceivedReferencesCount, setMemberReceivedReferencesCount] = useState(0);
  const [chapterBusinessGenerated, setChapterBusinessGenerated] = useState(0);
  const [chapterReferencesCount, setChapterReferencesCount] = useState(0);
  const [chapterVisitorsCount, setChapterVisitorsCount] = useState(0);
  const [chapterOneToOneCount, setChapterOneToOneCount] = useState(0);
  const [myLeads, setMyLeads] = useState(0);
  const user = localStorage.getItem("user");
  const User = user ? JSON.parse(user) : null;
  const [leads, setLeads] = useState([]);
  const [meetings, setMeetings] = useState<ChapterMeeting[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([]);

  const [openLeadsCount, setOpenLeadsCount] = useState(0);
  const [followUpLeadsCount, setFollowUpLeadsCount] = useState(0);

  // Fetch business total
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/statistics/business-generated');
        const data = await response.json();
        setBusinessTotal(data.total || 0);
      } catch (error) {
        console.error('Error fetching business data:', error);
        setBusinessTotal(0);
      }
    };
    
    fetchData();
  }, []);

  // Fetch references count
  useEffect(() => {
    const fetchReferencesCount = async () => {
      try {
        const response = await fetch('/api/statistics/references-count');
        const data = await response.json();
        setReferencesCount(data.total || 0);
      } catch (error) {
        console.error('Error fetching references count:', error);
        setReferencesCount(0);
      }
    };
    
    fetchReferencesCount();
  }, []);

  // Fetch total visitors count
  useEffect(() => {
    const fetchTotalVisitorsCount = async () => {
      try {
        const response = await fetch('/api/statistics/total-visitors');
        const data = await response.json();
        setTotalVisitorsCount(data.total || 0);
      } catch (error) {
        console.error('Error fetching total visitors count:', error);
        setTotalVisitorsCount(0);
      } 
    };
    
    fetchTotalVisitorsCount();
  }, []);

  // Fetch one-to-one count
  useEffect(() => {
    const fetchOneToOneCount = async () => {
      try {
        const response = await fetch('/api/statistics/one-to-one');
        const data = await response.json();
        setOneToOneCount(data.total || 0);
      } catch (error) {
        console.error('Error fetching one-to-one count:', error);
        setOneToOneCount(0);
      }
    };
    
    fetchOneToOneCount();
  }, []);

  // Fetch member's given references count
  useEffect(() => {
    const fetchMemberGivenReferences = async () => {
      if (User && User.member && User.member.id) {
        try {
          const response = await fetch(`/api/statistics/member-given-references/${User.member.id}`);
          const data = await response.json();
          setMemberGivenReferencesCount(data.total || 0);
        } catch (error) {
          console.error('Error fetching member given references count:', error);
          setMemberGivenReferencesCount(0);
        }
      }
    };
    
    fetchMemberGivenReferences();
  }, [User]);

  // Fetch member's received references count
  useEffect(() => {
    const fetchMemberReceivedReferences = async () => {
      if (User && User.member && User.member.id) {
        try {
          const response = await fetch(`/api/statistics/member-received-references/${User.member.id}`);
          const data = await response.json();
          setMemberReceivedReferencesCount(data.total || 0);
        } catch (error) {
          console.error('Error fetching member received references count:', error);
          setMemberReceivedReferencesCount(0);
        }
      }
    };
    
    fetchMemberReceivedReferences();
  }, [User]);

  // Fetch chapter's business generated amount
  useEffect(() => {
    const fetchChapterBusinessGenerated = async () => {
      if (User && User.member && User.member.chapterId) {
        try {
          const response = await fetch(`/api/statistics/chapter-business-generated/${User.member.chapterId}`);
          const data = await response.json();
          setChapterBusinessGenerated(data.total || 0);
        } catch (error) {
          console.error('Error fetching chapter business generated data:', error);
          setChapterBusinessGenerated(0);
        }
      }
    };
    
    fetchChapterBusinessGenerated();
  }, [User]);

  // Fetch chapter's references count
  useEffect(() => {
    const fetchChapterReferencesCount = async () => {
      if (User && User.member && User.member.chapterId) {
        try {
          const response = await fetch(`/api/statistics/chapter-references-count/${User.member.chapterId}`);
          const data = await response.json();
          setChapterReferencesCount(data.total || 0);
        } catch (error) {
          console.error('Error fetching chapter references count:', error);
          setChapterReferencesCount(0);
        }
      }
    };
    
    fetchChapterReferencesCount();
  }, [User]);

  // Fetch chapter's visitors count
  useEffect(() => {
    const fetchChapterVisitorsCount = async () => {
      if (User && User.member && User.member.chapterId) {
        try {
          const response = await fetch(`/api/statistics/chapter-visitors-count/${User.member.chapterId}`);
          const data = await response.json();
          setChapterVisitorsCount(data.total || 0);
        } catch (error) {
          console.error('Error fetching chapter visitors count:', error);
          setChapterVisitorsCount(0);
        }
      }
    };
    
    fetchChapterVisitorsCount();
  }, [User]);

  // Fetch chapter one-to-one count
  useEffect(() => {
    const fetchChapterOneToOneCount = async () => {
      try {
        if (User?.member?.chapterId) {
          const response = await fetch(`/api/statistics/chapter-one-to-one-count/${User.member.chapterId}`);
          const data = await response.json();
          setChapterOneToOneCount(data.total || 0);
        } else {
          setChapterOneToOneCount(0);
        }
      } catch (error) {
        console.error('Error fetching chapter one-to-one count:', error);
        setChapterOneToOneCount(0);
      }
    };
    
    fetchChapterOneToOneCount();
  }, [User?.member?.chapterId]);

  // Fetch recent messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        let endpoint = '/api/statistics/recent-messages';
        
        // If user has a member ID, fetch both global and chapter-specific messages
        if (User?.member?.id) {
          endpoint = `/api/statistics/member-messages/${User.member.id}`;
        }
        
        const response = await fetch(endpoint);
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      }
    };
    
    fetchMessages();
  }, [User?.member?.id]);

  // Fetch chapter meetings
  useEffect(() => {
    const fetchChapterMeetings = async () => {
      try {
        let endpoint = '/api/statistics/chapter-meetings';
        
        // If user has a member ID, fetch meetings for member's chapter
        if (User?.member?.id) {
          endpoint = `/api/statistics/member-chapter-meetings/${User.member.id}`;
        } else if (User?.member?.chapterId) {
          // Fallback to direct chapter ID if available
          endpoint = `/api/statistics/chapter-meetings/${User.member.chapterId}`;
        } else {
          // If no chapter info, don't fetch
          setMeetings([]);
          return;
        }
        
        const response = await fetch(endpoint);
        const data = await response.json();
        setMeetings(data.meetings || []);
      } catch (error) {
        console.error('Error fetching chapter meetings:', error);
        setMeetings([]);
      }
    };
    
    fetchChapterMeetings();
  }, [User?.member?.id, User?.member?.chapterId]);

  // Fetch trainings - simple approach, no filtering
  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const response = await fetch('/api/statistics/trainings');
        const data = await response.json();
        setTrainings(data.trainings || []);
      } catch (error) {
        console.error('Error fetching trainings:', error);
        setTrainings([]);
      }
    };
    
    fetchTrainings();
  }, []);

  // Fetch upcoming birthdays
  useEffect(() => {
    const fetchUpcomingBirthdays = async () => {
      try {
        const response = await fetch('/api/statistics/upcoming-birthdays');
        const data = await response.json();
        setUpcomingBirthdays(data.birthdays || []);
      } catch (error) {
        console.error('Error fetching upcoming birthdays:', error);
        setUpcomingBirthdays([]);
      }
    };
    
    fetchUpcomingBirthdays();
  }, []);

  return (
    <div className="flex h-screen ">
      {/* Sidebar for larger screens */}
      {/* <Sidebar className="hidden md:block w-64 shadow-md" /> */}

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto p-4 md:p-8"
        style={scrollbarHideStyle}
      >
        <div className="flex justify-between items-center mb-6">
          <img src={bannerImage} alt="Welcome Banner 2024" className="w-full rounded-lg shadow-md" />
         
        </div>

        {User?.role !== "admin" && (
        <div className="flex justify-center gap-3 items-center mb-6">
 
          <ShimmerButton className="shadow-2xl" onClick={() => navigate('/references/create')}> 
         <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
        Give Reference
        </span>
      </ShimmerButton>
      <ShimmerButton className="shadow-2xl" onClick={() => navigate('/dashboard/done-deal')}>
        <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
        Mark Done Deal 
        </span>
      </ShimmerButton>
      <ShimmerButton 
        className="shadow-2xl" 
        onClick={() => navigate('/one-to-ones')}
      >
        <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
        One To One Request
        </span>
      </ShimmerButton>
          </div>
        )}

   
          <h1 className="text-xl font-bold text-start bg-gradient-to-r from-blue-600 to-white-400 text-white px-3 py-1   rounded mb-1 mt-2">
          BBNG
          </h1>

 


        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Reference Shared
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referencesCount}</div>
            </CardContent>
          </Card>
        <Card className="bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          BBNG Business Generated
        </CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">₹{businessTotal.toLocaleString()}</div>
      </CardContent>
    </Card>
          <Card className="bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                One to One
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{oneToOneCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
              Total Visitors
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVisitorsCount}</div>
            </CardContent>
          </Card>
        </div>
        {User?.role !== "admin" && (
          <>

        <h1 className="text-xl font-bold text-start bg-gradient-to-r from-blue-600 to-white-400 text-white px-3 py-1   rounded mb-1 mt-2">
    CHAPTER
  </h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
              {User?.member?.chapter?.name || ''} References Shared


              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chapterReferencesCount}</div>
            </CardContent>
          </Card>
        <Card className="bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
{User?.member?.chapter?.name || ''} Business Generated
        </CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">₹{chapterBusinessGenerated.toLocaleString()}</div>
      </CardContent>
    </Card>
          <Card className="bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
              {User?.member?.chapter?.name || ''} One 2 One

              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chapterOneToOneCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
              {User?.member?.chapter?.name || ''} Visitors

              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chapterVisitorsCount}</div>
            </CardContent>
          </Card>
        </div>
        
        


        <h1 className="text-xl font-bold text-start bg-gradient-to-r from-blue-600 to-white-400 text-white px-3 py-1   rounded mb-1 mt-2">
           SELF
         </h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
              Business Received

              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{}</div>
            </CardContent>
          </Card>
          <Card className="bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
              Business Given

              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{}</div>
            </CardContent>
          </Card>
          <Card className="bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
              References Recevied

              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memberReceivedReferencesCount}</div>
            </CardContent>
          </Card>
        <Card className="bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
Reference Given        </CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{memberGivenReferencesCount}</div>
      </CardContent>
    </Card>

        </div>
      </>
      )}



        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4 ">
          <Card className="col-span-full lg:col-span-4 overflow-x-auto bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className={`${messages.length > 3 ? 'max-h-[300px] overflow-y-auto' : 'overflow-x-auto'} space-y-4`}>
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div key={message.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">{message.heading}</h4>
                        <p className="text-xs text-muted-foreground">{message.powerteam}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{message.message}</p>
                    {message.attachment && (
                      <p className="mt-2 text-xs text-blue-500">
                        <a href={message.attachment} target="_blank" rel="noopener noreferrer">
                          View Attachment
                        </a>
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No messages to display</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="col-span-full lg:col-span-3 overflow-x-auto bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform">
            <CardHeader>
              <CardTitle>My Meetings</CardTitle>
              {/* <CardDescription>Chapter Meetings</CardDescription> */}
            </CardHeader>
            <CardContent className={`${meetings.length > 3 ? 'max-h-[300px] overflow-y-auto' : 'overflow-x-auto'} space-y-4`}>
              {meetings.length > 0 ? (
                meetings.map((meeting) => (
                  <div key={meeting.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">{meeting.meetingTitle}</h4>
                        <p className="text-xs text-muted-foreground">{meeting.meetingVenue}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">
                          {new Date(meeting.date).toLocaleDateString()}
                        </span>
                        <p className="text-xs">{meeting.meetingTime}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No meetings to display</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4 ">
          <Card className="col-span-full lg:col-span-4 overflow-x-auto bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform">
            <CardHeader>
              <CardTitle>Training</CardTitle>
            </CardHeader>
            <CardContent 
              className={`${trainings.length > 3 ? 'max-h-[300px] overflow-y-auto' : 'overflow-x-auto'} space-y-4`}
              style={trainings.length > 3 ? scrollbarHideStyle : {}}
            >
              {trainings.length > 0 ? (
                trainings.map((training) => (
                  <div key={training.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">{training.trainingTopic}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">
                          {new Date(training.trainingDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No upcoming trainings</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className=" col-span-full lg:col-span-3 overflow-x-auto bg-accent/40 shadow-lg hover:shadow-2xl transition-shadow transform hover:scale-105 transition-transform">
            <CardHeader>
              <CardTitle>Upcomming Birthdays</CardTitle>
            </CardHeader>
            <CardContent 
              className={`${upcomingBirthdays.length > 3 ? 'max-h-[300px] overflow-y-auto' : 'overflow-x-auto'} space-y-4`}
              style={upcomingBirthdays.length > 3 ? scrollbarHideStyle : {}}
            >
              {upcomingBirthdays.length > 0 ? (
                upcomingBirthdays.map((birthday) => (
                  <div key={birthday.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">{birthday.memberName}</h4>
                        <p className="text-xs text-muted-foreground">{birthday.organizationName}</p>
                        <p className="text-xs text-muted-foreground">{birthday.chapter?.name || 'No Chapter'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium">
                          {new Date(birthday.upcomingBirthday).toLocaleDateString()}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {birthday.daysUntilBirthday === 0 ? 'Today!' : 
                           birthday.daysUntilBirthday === 1 ? 'Tomorrow' : 
                           `In ${birthday.daysUntilBirthday} days`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No upcoming birthdays</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>



       

         
      </main>
    </div>
  );
}