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
import { SteamLoginButton } from "@/components/steam-login";
import { DesktopLogOut } from "@/components/logout";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

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
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href="/profile">
              <UserIcon /> <span>Profile</span>
            </Link>
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

          {user ? (
            <DesktopLogOut logOutUser={() => logout()} />
          ) : (
            <DropdownMenuItem>
              <SteamLoginButton />
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
