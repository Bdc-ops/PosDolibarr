export interface Client {
  id: number;
  ref: string;
  name: string;
  firstname?: string;
  address?: string;
  zip?: string;
  town?: string;
  country?: string;
  phone?: string;
  email?: string;
  commercial_id?: number;
  commercial_name?: string;
  sector?: string;
  latitude?: number;
  longitude?: number;
  status: number;
}

export interface Invoice {
  id: number;
  ref: string;
  ref_client?: string;
  client_name?: string;
  date_creation: string;
  date_lim_reglement?: string;
  total_ht: number;
  total_ttc: number;
  status: string;
  commercial_id?: number;
  commercial_name?: string;
}

export interface Order {
  id: number;
  ref: string;
  ref_client?: string;
  client_name?: string;
  date_creation: string;
  date_livraison?: string;
  total_ht: number;
  total_ttc: number;
  status: string;
  commercial_id?: number;
  commercial_name?: string;
}

export interface Quote {
  id: number;
  ref: string;
  ref_client?: string;
  client_name?: string;
  date_creation: string;
  date_validite?: string;
  total_ht: number;
  total_ttc: number;
  status: string;
  commercial_id?: number;
  commercial_name?: string;
}

export interface Commercial {
  id: number;
  login?: string;
  name?: string;
  firstname?: string;
  email?: string;
}
