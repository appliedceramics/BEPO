import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { BepoLogo } from "@/components/BepoLogo";
import { BepoCalculatorLogo } from "@/components/BepoCalculatorLogo";
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
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header - Mobile Only */}
      <div className="md:hidden bg-gradient-to-r from-primary to-secondary py-6 px-4">
        <div className="flex justify-center items-center">
          <BepoCalculatorLogo className="w-14 h-14 mr-3" />
          <div>
            <h1 className="text-2xl font-bold calculator-font text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">BEPO</h1>
            <p className="text-xs text-white/90">Insulin Calculator & Log</p>
          </div>
        </div>
      </div>

      {/* Left Section - Forms */}
      <div className="w-full md:w-1/2 p-6 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6 bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
          <div className="text-center">
            <div className="hidden md:flex justify-center mb-4">
              <BepoCalculatorLogo className="w-20 h-20" />
            </div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Welcome Back!
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Let's manage diabetes together as a family
            </p>
          </div>

          <Tabs
            defaultValue="login"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-lg p-1 bg-secondary/10">
              <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Create Account
              </TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login" className="space-y-4 mt-6">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className="space-y-5"
                >
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-medium">Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your username" 
                            {...field} 
                            className="rounded-lg border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                          />
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
                        <FormLabel className="text-primary font-medium">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Your password"
                            {...field}
                            className="rounded-lg border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full rounded-lg py-6 text-lg font-medium bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  
                  <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">
                      Don't have an account yet?{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline font-medium"
                        onClick={() => setActiveTab("register")}
                      >
                        Create one
                      </button>
                    </p>
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* Registration Form */}
            <TabsContent value="register" className="space-y-4 mt-6">
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
                        <FormLabel className="text-primary font-medium">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Your email"
                            {...field}
                            className="rounded-lg border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
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
                        <FormLabel className="text-primary font-medium">Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Choose a username" 
                            {...field} 
                            className="rounded-lg border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                          />
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
                        <FormLabel className="text-primary font-medium">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Create a password"
                            {...field}
                            className="rounded-lg border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
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
                        <FormLabel className="text-primary font-medium">Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm your password"
                            {...field}
                            className="rounded-lg border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full rounded-lg py-6 text-lg font-medium bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 mt-2"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                  
                  <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline font-medium"
                        onClick={() => setActiveTab("login")}
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Section - Feature Showcase */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-100 to-green-100 p-8 items-center justify-center overflow-y-auto">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-3">
              <span className="calculator-font">BEPO</span> Insulin Calculator
            </h1>
            <p className="text-lg text-primary/80 mb-6">
              Fun for kids, peace of mind for parents
            </p>
          </div>

          {/* Feature Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Feature 1: Accurate Calculations */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border-2 border-primary/20 shadow-lg p-5 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40">
              <div className="mb-3 bg-primary/10 p-3 rounded-full">
                <CalculationsIcon />
              </div>
              <h3 className="font-bold text-lg text-primary mb-2">Accurate Calculations</h3>
              <p className="text-sm text-primary/80">
                Precise insulin dose calculations based on BG readings and carb intake
              </p>
            </div>
            
            {/* Feature 2: Easy Tracking */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border-2 border-accent/20 shadow-lg p-5 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-accent/40">
              <div className="mb-3 bg-accent/10 p-3 rounded-full">
                <TrackingIcon />
              </div>
              <h3 className="font-bold text-lg text-primary mb-2">Easy Tracking</h3>
              <p className="text-sm text-primary/80">
                Keep a comprehensive log of insulin doses and blood glucose readings
              </p>
            </div>
            
            {/* Feature 3: Share with Parents */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border-2 border-primary/20 shadow-lg p-5 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40">
              <div className="mb-3 bg-primary/10 p-3 rounded-full">
                <NotifyIcon />
              </div>
              <h3 className="font-bold text-lg text-primary mb-2">SMS Notifications</h3>
              <p className="text-sm text-primary/80">
                Automatically notify parents of insulin doses via SMS messages
              </p>
            </div>
            
            {/* Feature 4: Voice Input */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border-2 border-accent/20 shadow-lg p-5 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-accent/40">
              <div className="mb-3 bg-accent/10 p-3 rounded-full">
                <VoiceInputIcon />
              </div>
              <h3 className="font-bold text-lg text-primary mb-2">Voice Input</h3>
              <p className="text-sm text-primary/80">
                Speak your blood glucose readings and carb values for easy entry
              </p>
            </div>
            
            {/* Feature 5: Meal Presets */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border-2 border-primary/20 shadow-lg p-5 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40 col-span-full mx-auto max-w-[280px]">
              <div className="mb-3 bg-primary/10 p-3 rounded-full">
                <MealPresetsIcon />
              </div>
              <h3 className="font-bold text-lg text-primary mb-2">Meal Presets</h3>
              <p className="text-sm text-primary/80">
                Save common foods with carb values for quick and easy selection
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center py-4 px-6 bg-white/60 backdrop-blur-sm rounded-xl shadow-md">
            <div className="flex items-center justify-center mb-3">
              <span className="text-2xl mr-2">🏆</span>
              <h3 className="text-xl font-bold text-primary">Achievement System</h3>
            </div>
            <p className="text-sm text-primary/80">
              Earn fun emoji rewards as you track your health journey! Perfect for kids and young adults.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}