import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, GraduationCap, Users, BookOpen, DoorOpen } from "lucide-react";
import { format } from "date-fns";

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [courses, subjects, rooms, invigilators, exams] = await Promise.all([
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("subjects").select("*", { count: "exact", head: true }),
        supabase.from("rooms").select("*", { count: "exact", head: true }),
        supabase.from("invigilators").select("*", { count: "exact", head: true }),
        supabase.from("exam_schedules").select("*", { count: "exact", head: true }),
      ]);

      return {
        courses: courses.count || 0,
        subjects: subjects.count || 0,
        rooms: rooms.count || 0,
        invigilators: invigilators.count || 0,
        exams: exams.count || 0,
      };
    },
  });

  const { data: upcomingExams } = useQuery({
    queryKey: ["upcoming-exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_schedules")
        .select(
          `
          *,
          subjects (subject_name, subject_code),
          rooms (room_number, building),
          invigilators (name)
        `
        )
        .gte("exam_date", new Date().toISOString().split("T")[0])
        .order("exam_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const statCards = [
    { title: "Total Courses", value: stats?.courses || 0, icon: GraduationCap, color: "text-primary" },
    { title: "Total Subjects", value: stats?.subjects || 0, icon: BookOpen, color: "text-accent" },
    { title: "Total Rooms", value: stats?.rooms || 0, icon: DoorOpen, color: "text-success" },
    { title: "Invigilators", value: stats?.invigilators || 0, icon: Users, color: "text-warning" },
    { title: "Scheduled Exams", value: stats?.exams || 0, icon: Calendar, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Exams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!upcomingExams || upcomingExams.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No upcoming exams scheduled</p>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map((exam: any) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">
                      {exam.subjects?.subject_name} ({exam.subjects?.subject_code})
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {exam.rooms?.room_number} - {exam.rooms?.building} | Invigilator: {exam.invigilators?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{format(new Date(exam.exam_date), "MMM dd, yyyy")}</p>
                    <p className="text-sm text-muted-foreground">
                      {exam.start_time} - {exam.end_time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
