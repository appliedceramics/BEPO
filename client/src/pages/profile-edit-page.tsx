import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { sexEnum, bgUnitEnum, type InsertProfile, type Profile, type BgUnit } from "@shared/schema";
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
import { Loader2, HelpCircle } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import { getQueryFn } from "@/lib/queryClient";
import { useEffect } from "react";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(1, "Age is required").max(120, "Age must be valid"),
  sex: z.enum(["male", "female"], {
    required_error: "Please select a gender",
  }),
  weight: z.coerce.number().min(1, "Weight must be at least 1").max(300, "Weight must be valid").optional(),
  bgUnit: z.enum(["mmol/L", "mg/dL"], {
    required_error: "Please select a blood glucose unit",
  }).default("mmol/L"),
  // Parent/caregiver contact information
  parent1Name: z.string().optional(),
  parent1Phone: z.string().optional(),
  parent1Email: z.string().optional(),
  parent2Name: z.string().optional(),
  parent2Phone: z.string().optional(),
  parent2Email: z.string().optional(),
  caregiverName: z.string().optional(),
  caregiverPhone: z.string().optional(),
  caregiverEmail: z.string().optional(),
  // Notification preferences
  notifyContacts: z.boolean().default(false),
  notificationMethod: z.enum(["sms", "email", "push"]).default("sms"),
  // Legacy fields for backward compatibility
  motherName: z.string().optional(),
  fatherName: z.string().optional(),
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
      weight: undefined,
      bgUnit: "mmol/L",
      // Parent/caregiver contact information
      parent1Name: "",
      parent1Phone: "",
      parent1Email: "",
      parent2Name: "",
      parent2Phone: "",
      parent2Email: "",
      caregiverName: "",
      caregiverPhone: "",
      caregiverEmail: "",
      // Notification preferences
      notifyContacts: false,
      notificationMethod: "sms",
      // Legacy fields
      motherName: "",
      fatherName: "",
      notifyParents: false,
    },
  });
  
  // Update form with profile data when available
  useEffect(() => {
    if (profile) {
      // Create a typed reset object with only valid fields
      const resetData: Partial<ProfileFormValues> = {
        name: profile.name,
        age: profile.age,
        sex: profile.sex as "male" | "female",
        weight: profile.weight ? Number(profile.weight) : undefined,
        bgUnit: profile.bgUnit as "mmol/L" | "mg/dL" || "mmol/L",
        // Parent/caregiver contact information
        parent1Name: profile.parent1Name || "",
        parent1Phone: profile.parent1Phone || "",
        parent1Email: profile.parent1Email || "",
        parent2Name: profile.parent2Name || "",
        parent2Phone: profile.parent2Phone || "",
        parent2Email: profile.parent2Email || "",
        caregiverName: profile.caregiverName || "",
        caregiverPhone: profile.caregiverPhone || "",
        caregiverEmail: profile.caregiverEmail || "",
        // Notification preferences
        notifyContacts: profile.notifyContacts || false,
        notificationMethod: (profile.notificationMethod as "sms" | "email" | "push") || "sms"
      };
      
      // Set legacy fields if we're in a transition period and the profile has them
      // This is just for backward compatibility during migration
      if ('motherName' in profile && typeof profile.motherName !== 'undefined') {
        Object.assign(resetData, {
          motherName: profile.motherName || "",
        });
      }
      
      if ('fatherName' in profile && typeof profile.fatherName !== 'undefined') {
        Object.assign(resetData, {
          fatherName: profile.fatherName || "",
        });
      }
      
      if ('notifyParents' in profile) {
        Object.assign(resetData, {
          notifyParents: profile.notifyParents || false
        });
      }
      
      form.reset(resetData);
    }
  }, [profile, form]);

  // Handle profile update
  const onSubmit = (data: ProfileFormValues) => {
    // Log form data before submission
    console.log("Submitting profile data:", data);
    
    // Convert number fields to string format expected by the API
    const formData = {
      ...data,
      weight: data.weight !== undefined ? String(data.weight) : undefined,
      // Clean empty string values from parent/caregiver fields
      parent1Name: data.parent1Name || undefined,
      parent1Phone: data.parent1Phone || undefined,
      parent1Email: data.parent1Email || undefined,
      parent2Name: data.parent2Name || undefined,
      parent2Phone: data.parent2Phone || undefined,
      parent2Email: data.parent2Email || undefined,
      caregiverName: data.caregiverName || undefined,
      caregiverPhone: data.caregiverPhone || undefined,
      caregiverEmail: data.caregiverEmail || undefined
    };
    
    // Log processed form data
    console.log("Processed form data:", formData);
    
    updateProfileMutation.mutate(formData, {
      onSuccess: (profile) => {
        console.log("Profile updated successfully:", profile);
        navigate("/");
      },
      onError: (error) => {
        console.error("Profile update error:", error);
      }
    });
  };

  // For backward compatibility during the transition period
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
      
      <div className="flex-1 flex justify-center items-start py-10">
        <div className="w-full max-w-2xl space-y-6 px-4">
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
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter your weight in kg"
                          {...field}
                          value={field.value === undefined ? '' : field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : Number(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Used for personalized meal recommendations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bgUnit"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center space-x-2">
                        <FormLabel>Blood Glucose Unit</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-2 max-w-xs">
                                <p><strong>mmol/L</strong>: Millimoles per liter. Used in Canada, Europe, and most countries.</p>
                                <p><strong>mg/dL</strong>: Milligrams per deciliter. Used in the US and some other countries.</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood glucose unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mmol/L">mmol/L</SelectItem>
                          <SelectItem value="mg/dL">mg/dL</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This will affect how blood glucose values are displayed throughout the app
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact Notification Toggle */}
              <FormField
                control={form.control}
                name="notifyContacts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Contact Notifications
                      </FormLabel>
                      <FormDescription>
                        Enable notifications to parents/caregivers after each insulin dose
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

              {/* Get the notify contacts value for conditional rendering */}
              {form.watch("notifyContacts") && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Contact Information</h3>
                    <FormField
                      control={form.control}
                      name="notificationMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Notification Method</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="push">Push Notifications</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Parent 1 Information */}
                  <div className="rounded-md border p-4 space-y-4">
                    <h4 className="font-medium">Parent 1 / Primary Contact</h4>
                    <FormField
                      control={form.control}
                      name="parent1Name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter parent's name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parent1Phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
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
                      name="parent1Email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter email address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Parent 2 Information */}
                  <div className="rounded-md border p-4 space-y-4">
                    <h4 className="font-medium">Parent 2 / Secondary Contact</h4>
                    <FormField
                      control={form.control}
                      name="parent2Name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter parent's name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parent2Phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
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
                      name="parent2Email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter email address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Caregiver Information */}
                  <div className="rounded-md border p-4 space-y-4">
                    <h4 className="font-medium">Care Giver / Additional Contact</h4>
                    <FormField
                      control={form.control}
                      name="caregiverName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter caregiver's name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="caregiverPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
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
                      name="caregiverEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter email address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Push Notification Info */}
                  {form.watch("notificationMethod") === "push" && (
                    <div className="rounded-md border-l-4 border-blue-500 bg-blue-50 p-4">
                      <p className="text-sm text-blue-700">
                        <strong>Push Notifications:</strong> Parents or caregivers will need to log in to their own account
                        and subscribe to notifications from this device to receive push notifications.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Push notification settings */}
              <PushNotificationSettings />
              
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