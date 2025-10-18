import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import InvigilatorDialog from "@/components/InvigilatorDialog";

const Invigilators = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvigilator, setEditingInvigilator] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invigilators, isLoading } = useQuery({
    queryKey: ["invigilators"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invigilators").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invigilators").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invigilators"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Success", description: "Invigilator deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete invigilator", variant: "destructive" });
    },
  });

  const handleEdit = (invigilator: any) => {
    setEditingInvigilator(invigilator);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this invigilator?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Invigilators</h2>
        <Button
          onClick={() => {
            setEditingInvigilator(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Invigilator
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : !invigilators || invigilators.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No invigilators found. Click "Add Invigilator" to create one.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invigilators.map((invigilator: any) => (
                  <TableRow key={invigilator.id}>
                    <TableCell className="font-medium">{invigilator.name}</TableCell>
                    <TableCell>{invigilator.email}</TableCell>
                    <TableCell>{invigilator.phone || "N/A"}</TableCell>
                    <TableCell>{invigilator.department}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(invigilator)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(invigilator.id)}>
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

      <InvigilatorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invigilator={editingInvigilator}
        onSuccess={() => {
          setDialogOpen(false);
          setEditingInvigilator(null);
        }}
      />
    </div>
  );
};

export default Invigilators;
