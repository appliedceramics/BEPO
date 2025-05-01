import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export function EmailTest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = async () => {
    
    try {
      setLoading(true);
      const res = await apiRequest("POST", "/api/send-test-email", { email: email || undefined });
      const data = await res.json();
      
      toast({
        title: "Email Sent",
        description: "Test email sent successfully. Please check your inbox.",
        duration: 5000,
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: "Email Error",
        description: error instanceof Error ? error.message : "Failed to send test email",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="my-6">
      <CardHeader className="gap-2">
        <CardTitle className="text-lg text-primary">Email Notification Test</CardTitle>
        <CardDescription>
          Send a test email to verify your email notification settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Info className="h-4 w-4" />
              Leave the field empty to use your account email ({user?.email})
            </p>
            <div className="flex gap-2 items-center">
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Test Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
