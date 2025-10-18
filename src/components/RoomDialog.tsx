import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: any;
  onSuccess: () => void;
}

const RoomDialog = ({ open, onOpenChange, room, onSuccess }: RoomDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (room) {
      reset(room);
    } else {
      reset({ room_number: "", building: "", capacity: "" });
    }
  }, [room, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (room) {
        const { error } = await supabase.from("rooms").update(data).eq("id", room.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("rooms").insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Success",
        description: room ? "Room updated successfully" : "Room created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save room", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{room ? "Edit Room" : "Add Room"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room_number">Room Number *</Label>
            <Input {...register("room_number", { required: true })} placeholder="e.g., A101" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="building">Building *</Label>
            <Input {...register("building", { required: true })} placeholder="e.g., Block A" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity *</Label>
            <Input type="number" {...register("capacity", { required: true, min: 1 })} placeholder="e.g., 60" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : room ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDialog;
