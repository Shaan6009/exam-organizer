import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface InvigilatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invigilator?: any;
  onSuccess: () => void;
}

const InvigilatorDialog = ({ open, onOpenChange, invigilator, onSuccess }: InvigilatorDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (invigilator) {
      reset(invigilator);
    } else {
      reset({ name: "", email: "", phone: "", department: "" });
    }
  }, [invigilator, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (invigilator) {
        const { error } = await supabase.from("invigilators").update(data).eq("id", invigilator.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("invigilators").insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invigilators"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Success",
        description: invigilator ? "Invigilator updated successfully" : "Invigilator created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save invigilator", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{invigilator ? "Edit Invigilator" : "Add Invigilator"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input {...register("name", { required: true })} placeholder="e.g., Dr. John Smith" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input type="email" {...register("email", { required: true })} placeholder="e.g., john.smith@college.edu" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input {...register("phone")} placeholder="e.g., +1-555-0101" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Input {...register("department", { required: true })} placeholder="e.g., Computer Science" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : invigilator ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InvigilatorDialog;
