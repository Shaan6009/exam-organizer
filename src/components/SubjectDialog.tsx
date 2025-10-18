import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: any;
  onSuccess: () => void;
}

const SubjectDialog = ({ open, onOpenChange, subject, onSuccess }: SubjectDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, reset } = useForm();

  const { data: courses } = useQuery({
    queryKey: ["courses-for-subject"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id, course_name, course_code").order("course_name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (subject) {
      reset({
        subject_code: subject.subject_code,
        subject_name: subject.subject_name,
        course_id: subject.course_id,
        semester: subject.semester,
        credits: subject.credits,
      });
    } else {
      reset({ subject_code: "", subject_name: "", course_id: "", semester: "", credits: "" });
    }
  }, [subject, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (subject) {
        const { error } = await supabase.from("subjects").update(data).eq("id", subject.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subjects").insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Success",
        description: subject ? "Subject updated successfully" : "Subject created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save subject", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{subject ? "Edit Subject" : "Add Subject"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject_code">Subject Code *</Label>
            <Input {...register("subject_code", { required: true })} placeholder="e.g., CS201" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject_name">Subject Name *</Label>
            <Input {...register("subject_name", { required: true })} placeholder="e.g., Data Structures" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course_id">Course *</Label>
            <Select onValueChange={(value) => setValue("course_id", value)} value={watch("course_id")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.course_name} ({course.course_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <Input type="number" {...register("semester", { required: true, min: 1 })} placeholder="e.g., 3" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credits">Credits *</Label>
              <Input type="number" {...register("credits", { required: true, min: 1 })} placeholder="e.g., 4" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : subject ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubjectDialog;
