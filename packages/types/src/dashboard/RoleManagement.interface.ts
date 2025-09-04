export interface ManageableRolesResponse {
  success: boolean;
  data: string[];
}

export interface RoleActionResponse {
  success: boolean;
  message: string;
  data: {
    account_id: number;
    nickname: string;
    steam_id: string;
    role: string;
  };
}

export interface RoleUser {
  account_id: number;
  nickname: string;
  steam_id: string;
}

export interface RoleResponse {
  success: boolean;
  data: RoleUser[];
}
