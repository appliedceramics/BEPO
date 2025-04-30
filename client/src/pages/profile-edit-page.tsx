import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { sexEnum, type InsertProfile, type Profile } from "@shared/schema";
import { z } from "zod";
import { useLocation, Redirect } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Navigation } from "@/components/Navigation";
import { getQueryFn } from "@/lib/queryClient";
import { useEffect } from "react";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(1, "Age is required").max(120, "Age must be valid"),
  sex: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  notifyParents: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileEditPage() {
  const { user, updateProfileMutation } = useAuth();
  const [location, navigate] = useLocation();
  
  // Fetch the user's profile
  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/profile"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Redirect if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Profile form configuration
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      age: undefined,
      sex: undefined,
      motherName: "",
      motherPhone: "",
      fatherName: "",
      fatherPhone: "",
      notifyParents: false,
    },
  });
  
  // Update form with profile data when available
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        age: profile.age,
        sex: profile.sex as "male" | "female" | "other",
        motherName: profile.motherName || "",
        motherPhone: profile.motherPhone || "",
        fatherName: profile.fatherName || "",
        fatherPhone: profile.fatherPhone || "",
        notifyParents: profile.notifyParents || false,
      });
    }
  }, [profile, form]);

  // Handle profile update
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        navigate("/");
      },
    });
  };

  // Get the notify parents value for conditional rendering
  const notifyParents = form.watch("notifyParents");

  if (profileLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-border" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="flex-1 container max-w-3xl py-10">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Your Profile</h1>
            <p className="text-muted-foreground">
              Update your personal information and notification preferences
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter your age"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Parent Notification Toggle */}
              <FormField
                control={form.control}
                name="notifyParents"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Parent Notifications
                      </FormLabel>
                      <FormDescription>
                        Enable SMS notifications to your parents after each insulin dose
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Parent Information (conditionally rendered) */}
              {notifyParents && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium">Parent Information</h3>

                  <FormField
                    control={form.control}
                    name="motherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mother's Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter mother's name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="motherPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mother's Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter with country code (e.g. +1234567890)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include country code (e.g. +1 for US)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fatherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father's Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter father's name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fatherPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father's Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter with country code (e.g. +1234567890)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include country code (e.g. +1 for US)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}