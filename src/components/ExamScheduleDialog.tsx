import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ExamScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam?: any;
  onSuccess: () => void;
}

const ExamScheduleDialog = ({ open, onOpenChange, exam, onSuccess }: ExamScheduleDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, reset } = useForm();

  const { data: subjects } = useQuery({
    queryKey: ["subjects-for-exam"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id, subject_name, subject_code").order("subject_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ["rooms-for-exam"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("id, room_number, building").order("room_number");
      if (error) throw error;
      return data;
    },
  });

  const { data: invigilators } = useQuery({
    queryKey: ["invigilators-for-exam"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invigilators").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (exam) {
      setValue("subject_id", exam.subject_id);
      setValue("exam_date", exam.exam_date);
      setValue("start_time", exam.start_time);
      setValue("end_time", exam.end_time);
      setValue("room_id", exam.room_id);
      setValue("invigilator_id", exam.invigilator_id);
      setValue("exam_type", exam.exam_type);
      setValue("notes", exam.notes || "");
    } else {
      reset();
    }
  }, [exam, setValue, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (exam) {
        const { error } = await supabase.from("exam_schedules").update(data).eq("id", exam.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exam_schedules").insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-exams"] });
      toast({
        title: "Success",
        description: exam ? "Exam schedule updated successfully" : "Exam schedule created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save exam schedule",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exam ? "Edit Exam Schedule" : "Add Exam Schedule"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject_id">Subject *</Label>
            <Select onValueChange={(value) => setValue("subject_id", value)} value={watch("subject_id")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.subject_name} ({subject.subject_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exam_date">Exam Date *</Label>
              <Input type="date" {...register("exam_date", { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam_type">Exam Type *</Label>
              <Select onValueChange={(value) => setValue("exam_type", value)} value={watch("exam_type")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mid-Term">Mid-Term</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                  <SelectItem value="Practical">Practical</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input type="time" {...register("start_time", { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input type="time" {...register("end_time", { required: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room_id">Room *</Label>
            <Select onValueChange={(value) => setValue("room_id", value)} value={watch("room_id")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.room_number} - {room.building}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invigilator_id">Invigilator *</Label>
            <Select onValueChange={(value) => setValue("invigilator_id", value)} value={watch("invigilator_id")}>
              <SelectTrigger>
                <SelectValue placeholder="Select an invigilator" />
              </SelectTrigger>
              <SelectContent>
                {invigilators?.map((invigilator) => (
                  <SelectItem key={invigilator.id} value={invigilator.id}>
                    {invigilator.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea {...register("notes")} placeholder="Any additional notes..." rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : exam ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExamScheduleDialog;
