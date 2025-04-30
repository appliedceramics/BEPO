import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { sexEnum, type InsertProfile } from "@shared/schema";
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
import { BepoLogo } from "@/components/BepoLogo";

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

export default function ProfilePage() {
  const { user, updateProfileMutation } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // If user already has a profile, redirect to home
  if (user.profile) {
    return <Redirect to="/" />;
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

  // Handle profile creation/update
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        navigate("/");
      },
    });
  };

  // Get the notify parents value for conditional rendering
  const notifyParents = form.watch("notifyParents");

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Form */}
      <div className="w-full md:w-1/2 p-8 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <BepoLogo />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              Complete Your Profile
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your information to personalize your experience
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        defaultValue={field.value}
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

              <Button
                type="submit"
                className="w-full"
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
            </form>
          </Form>
        </div>
      </div>

      {/* Right Section - Info */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-blue-50 to-green-100 p-12 flex items-center justify-center">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Why Complete Your Profile?
          </h1>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-100 p-1">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Personalized Experience</h3>
                <p className="text-sm text-muted-foreground">
                  We'll use your age and gender to provide more relevant insights about your diabetes management
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-100 p-1">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Keep Parents Updated</h3>
                <p className="text-sm text-muted-foreground">
                  Adding parent contact details enables automatic SMS notifications about your insulin doses
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-100 p-1">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Safety and Support</h3>
                <p className="text-sm text-muted-foreground">
                  Your profile information helps ensure you get the support you need when managing your diabetes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}