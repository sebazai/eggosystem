import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { UserCheckIcon, UserIcon, Users, BarChart3 } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { DesktopLogOut } from "../profile/DesktopLogOut";
import { SteamLoginButton } from "../profile/SteamLoginButton";
import { createNextUrl } from "@/lib/utils";

export default function UserDropdown() {
  const { user, logout } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="lg" className="h-9 w-9 lg:h-10 lg:w-10">
          {user ? (
            <UserCheckIcon className="size-4" />
          ) : (
            <UserIcon className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-66">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          {user && (
            <>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href={createNextUrl("/profile")}>
                  <UserIcon /> <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href={createNextUrl("/my-team")}>
                  <Users /> <span>Your Team</span>
                </Link>
              </DropdownMenuItem>
              {user.provider_id && (
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link href={createNextUrl(`/players/${user.provider_id}`)}>
                    <BarChart3 /> <span>Your Stats</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </>
          )}
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
