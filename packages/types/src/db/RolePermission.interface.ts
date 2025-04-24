import { Permission } from "./Permission.interface";
import { Role } from "./Role.interface";

export interface RolePermission {
  role_id: Role["id"];
  permission_id: Permission["id"];
  created_at: string;
  updated_at: string;
}
