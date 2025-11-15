import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { UserCheckIcon, UserIcon, Users } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { DesktopLogOut } from "../profile/DesktopLogOut";
import { SteamLoginButton } from "../profile/SteamLoginButton";
import { ModeToggle } from "./ThemeToggle";
import { createNextUrl } from "@/lib/utils";

export default function UserDropdown() {
  const { user, logout } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {user ? <UserCheckIcon /> : <UserIcon />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-66">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            Account <ModeToggle />
          </DropdownMenuLabel>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={createNextUrl("/profile")}>
              <UserIcon /> <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={createNextUrl("/my-team")}>
              <Users /> <span>My Team</span>
            </Link>
          </DropdownMenuItem>
          {/* <DropdownMenuItem>
            <Settings2Icon /> Settings
          </DropdownMenuItem> */}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user && (
            <DropdownMenuItem>
              <div>User: {user.nickname}</div>
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
