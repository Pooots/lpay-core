export type SuperAdminUser = {
  uuid: string
  email: string
  first_name: string
  last_name: string | null
  full_name: string
  status: string
}

export type SuperAdminLoginCredentials = {
  email: string
  password: string
}

export type SuperAdminAuthResponse = {
  access_token: string
  token_type: string
  expires_in: number
  admin_user: SuperAdminUser
  role: string
  is_admin: boolean
}
