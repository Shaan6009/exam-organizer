import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: any;
  onSuccess: () => void;
}

const CourseDialog = ({ open, onOpenChange, course, onSuccess }: CourseDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (course) {
      reset(course);
    } else {
      reset({ course_code: "", course_name: "", department: "" });
    }
  }, [course, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (course) {
        const { error } = await supabase.from("courses").update(data).eq("id", course.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Success",
        description: course ? "Course updated successfully" : "Course created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save course", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course ? "Edit Course" : "Add Course"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course_code">Course Code *</Label>
            <Input {...register("course_code", { required: true })} placeholder="e.g., CS101" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course_name">Course Name *</Label>
            <Input {...register("course_name", { required: true })} placeholder="e.g., Computer Science" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Input {...register("department", { required: true })} placeholder="e.g., Engineering" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : course ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDialog;
