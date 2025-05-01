import { useAuth } from "@/hooks/use-auth";
import { BepoLogo } from "@/components/BepoLogo";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, User, LogOut, Settings, Calculator } from "lucide-react";

export function Navigation() {
  const { user, logoutMutation, isLoading } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <BepoLogo className="w-8 h-8" />
            <span className="font-bold text-lg hidden sm:inline-block">BEPO Insulin Calculator</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative rounded-full h-8 w-8 p-0">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href="/achievements" className="flex w-full cursor-pointer items-center">
                    <span className="mr-2 text-lg">🏆</span>
                    <span>Achievements</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/calculator-settings" className="flex w-full cursor-pointer items-center">
                    <Calculator className="mr-2 h-4 w-4" />
                    <span>Calculator Settings</span>
                  </Link>
                </DropdownMenuItem>

                {user.profile ? (
                  <DropdownMenuItem asChild>
                    <Link href="/profile/edit" className="flex w-full cursor-pointer items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Edit Profile</span>
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex w-full cursor-pointer items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Complete Profile</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem 
                  className="text-red-500 focus:text-red-500" 
                  disabled={logoutMutation.isPending}
                  onClick={handleLogout}
                >
                  {logoutMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/auth">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}