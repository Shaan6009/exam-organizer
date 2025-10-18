import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SubjectDialog from "@/components/SubjectDialog";

const Subjects = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*, courses (course_name)")
        .order("subject_name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Success", description: "Subject deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete subject", variant: "destructive" });
    },
  });

  const handleEdit = (subject: any) => {
    setEditingSubject(subject);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure? This will also delete all related exam schedules.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Subjects</h2>
        <Button
          onClick={() => {
            setEditingSubject(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : !subjects || subjects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No subjects found. Click "Add Subject" to create one.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Code</TableHead>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject: any) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.subject_code}</TableCell>
                    <TableCell>{subject.subject_name}</TableCell>
                    <TableCell>{subject.courses?.course_name}</TableCell>
                    <TableCell>{subject.semester}</TableCell>
                    <TableCell>{subject.credits}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(subject)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(subject.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <SubjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subject={editingSubject}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingSubject(null);
        }}
      />
    </div>
  );
};

export default Subjects;
