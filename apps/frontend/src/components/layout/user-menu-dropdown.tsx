import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Settings2Icon, UserCheckIcon, UserIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { SteamLoginButton } from "../steam-login";
import { LogOut } from "../logout";
import { useAuth } from "@/context/AuthContext";

export default function UserDropdown() {
  const { user, logout } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {user ? <UserCheckIcon /> : <UserIcon />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem>
            <UserIcon /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings2Icon /> Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user && (
            <DropdownMenuItem>
              <div>User: {user.displayName}</div>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem>
            {user ? (
              <LogOut logOutUser={() => logout()} />
            ) : (
              <SteamLoginButton />
            )}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
