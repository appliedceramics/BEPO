import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { BepoLogo } from "@/components/BepoLogo";
import { Redirect, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { 
  CalculationsIcon, 
  TrackingIcon, 
  NotifyIcon, 
  VoiceInputIcon,
  MealPresetsIcon 
} from "@/components/FeatureIcons";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration form schema
const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  
  // If already logged in, redirect to the home page
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form configuration
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form configuration
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle login submission
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Handle registration submission
  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Forms */}
      <div className="w-full md:w-1/2 p-8 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <BepoLogo />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              BEPO Insulin Calculator
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to manage your diabetes care with ease
            </p>
          </div>

          <Tabs
            defaultValue="login"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login" className="space-y-4">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Your username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Your password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* Registration Form */}
            <TabsContent value="register" className="space-y-4">
              <Form {...registerForm}>
                <form
                  onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Your email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Create a password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm your password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Section - Feature Showcase */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-blue-50 to-green-100 p-8 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-xl space-y-6">
          <h1 className="text-3xl font-bold tracking-tight text-primary text-center mb-6">
            Manage Diabetes with Confidence
          </h1>

          {/* Feature Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feature 1: Accurate Calculations */}
            <div className="bg-white rounded-lg border-2 border-primary/20 shadow-md p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary">
              <div className="mb-3 bg-primary/10 p-2 rounded-full">
                <CalculationsIcon />
              </div>
              <h3 className="font-bold text-md text-primary mb-1">Accurate Calculations</h3>
              <p className="text-xs text-primary/80">
                Precise insulin dose calculations based on BG readings and carb intake
              </p>
            </div>
            
            {/* Feature 2: Easy Tracking */}
            <div className="bg-white rounded-lg border-2 border-accent/20 shadow-md p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-accent">
              <div className="mb-3 bg-accent/10 p-2 rounded-full">
                <TrackingIcon />
              </div>
              <h3 className="font-bold text-md text-primary mb-1">Easy Tracking</h3>
              <p className="text-xs text-primary/80">
                Keep a comprehensive log of insulin doses and blood glucose readings
              </p>
            </div>
            
            {/* Feature 3: Share with Parents */}
            <div className="bg-white rounded-lg border-2 border-primary/20 shadow-md p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary">
              <div className="mb-3 bg-primary/10 p-2 rounded-full">
                <NotifyIcon />
              </div>
              <h3 className="font-bold text-md text-primary mb-1">SMS Notifications</h3>
              <p className="text-xs text-primary/80">
                Automatically notify parents of insulin doses via SMS messages
              </p>
            </div>
            
            {/* Feature 4: Voice Input */}
            <div className="bg-white rounded-lg border-2 border-accent/20 shadow-md p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-accent">
              <div className="mb-3 bg-accent/10 p-2 rounded-full">
                <VoiceInputIcon />
              </div>
              <h3 className="font-bold text-md text-primary mb-1">Voice Input</h3>
              <p className="text-xs text-primary/80">
                Speak your blood glucose readings and carb values for easy entry
              </p>
            </div>
            
            {/* Feature 5: Meal Presets */}
            <div className="bg-white rounded-lg border-2 border-primary/20 shadow-md p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary col-span-full mx-auto max-w-[240px]">
              <div className="mb-3 bg-primary/10 p-2 rounded-full">
                <MealPresetsIcon />
              </div>
              <h3 className="font-bold text-md text-primary mb-1">Meal Presets</h3>
              <p className="text-xs text-primary/80">
                Save common foods with carb values for quick and easy selection
              </p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-primary/80">
              Join thousands of families who manage diabetes with BEPO
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}