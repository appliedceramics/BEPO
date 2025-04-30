import { useQuery, useMutation } from "@tanstack/react-query";
import { InsulinLog, InsertInsulinLog } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const LOGS_QUERY_KEY = "/api/insulin-logs";

export function useInsulinLogs() {
  const { toast } = useToast();
  
  // Fetch all insulin logs
  const { data: logs = [], isLoading, error } = useQuery<InsulinLog[]>({
    queryKey: [LOGS_QUERY_KEY],
  });

  // Create a new insulin log
  const createLogMutation = useMutation({
    mutationFn: (logData: InsertInsulinLog) => 
      apiRequest("POST", LOGS_QUERY_KEY, logData),
    onSuccess: () => {
      // Invalidate the query to refetch logs after creating a new one
      queryClient.invalidateQueries({ queryKey: [LOGS_QUERY_KEY] });
      toast({
        title: "Success",
        description: "Insulin dose logged successfully!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to log insulin dose: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete an insulin log
  const deleteLogMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `${LOGS_QUERY_KEY}/${id}`),
    onSuccess: () => {
      // Invalidate the query to refetch logs after deleting one
      queryClient.invalidateQueries({ queryKey: [LOGS_QUERY_KEY] });
      toast({
        title: "Success",
        description: "Insulin log entry deleted",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete log entry: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    logs,
    isLoading,
    error,
    createLog: createLogMutation.mutate,
    isPendingCreate: createLogMutation.isPending,
    deleteLog: deleteLogMutation.mutate,
    isPendingDelete: deleteLogMutation.isPending,
  };
}
