import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import ExamScheduleDialog from "@/components/ExamScheduleDialog";

const ExamSchedules = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exams, isLoading } = useQuery({
    queryKey: ["exam-schedules", searchTerm],
    queryFn: async () => {
      let query = supabase.from("exam_schedules").select(
        `
          *,
          subjects (subject_name, subject_code, courses (course_name)),
          rooms (room_number, building),
          invigilators (name)
        `
      );

      if (searchTerm) {
        query = query.or(
          `subjects.subject_name.ilike.%${searchTerm}%,subjects.subject_code.ilike.%${searchTerm}%,invigilators.name.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query.order("exam_date", { ascending: true }).order("start_time", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Success", description: "Exam schedule deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete exam schedule",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (exam: any) => {
    setEditingExam(exam);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this exam schedule?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Exam Schedules</h2>
        <Button
          onClick={() => {
            setEditingExam(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Exam
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by subject, date, or invigilator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : !exams || exams.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No exam schedules found. Click "Add Exam" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam: any) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">
                      {exam.subjects?.subject_name} ({exam.subjects?.subject_code})
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{exam.subjects?.courses?.course_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(exam)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(exam.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{format(new Date(exam.exam_date), "MMMM dd, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">
                      {exam.start_time} - {exam.end_time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room:</span>
                    <span className="font-medium">
                      {exam.rooms?.room_number}, {exam.rooms?.building}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invigilator:</span>
                    <span className="font-medium">{exam.invigilators?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{exam.exam_type}</span>
                  </div>
                  {exam.notes && (
                    <div className="mt-2 pt-2 border-t">
                      <span className="text-muted-foreground">Notes: </span>
                      <span className="font-medium">{exam.notes}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ExamScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        exam={editingExam}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingExam(null);
        }}
      />
    </div>
  );
};

export default ExamSchedules;
