import http from './http'
import type { ApplicationStatus } from './jobs'

export type OfferStatus = 'sent' | 'accepted' | 'declined' | 'revoked'

export interface Offer {
  id: number
  application_id: number
  salary: number
  start_date: string | null
  message: string
  status: OfferStatus
  sent_at: string
  responded_at: string | null
}

export interface SeekerOffer extends Offer {
  job_id: number
  job_title: string
  company_name: string
  city: string
  application_status: ApplicationStatus
}

export interface OfferCreate {
  salary: number
  start_date: string | null
  message: string
}

export const OFFER_STATUS_META: Record<
  OfferStatus,
  { label: string; variant: 'info' | 'success' | 'neutral' | 'warning' }
> = {
  sent: { label: '待回应', variant: 'warning' },
  accepted: { label: '已接受', variant: 'success' },
  declined: { label: '已拒绝', variant: 'neutral' },
  revoked: { label: '已撤回', variant: 'neutral' },
}

export const seekerOffersApi = {
  list() {
    return http.get<SeekerOffer[]>('/seeker/offers').then((res) => res.data)
  },

  accept(id: number) {
    return http
      .post<SeekerOffer>(`/seeker/offers/${id}/accept`)
      .then((res) => res.data)
  },

  decline(id: number) {
    return http
      .post<SeekerOffer>(`/seeker/offers/${id}/decline`)
      .then((res) => res.data)
  },
}

export const employerOffersApi = {
  send(applicationId: number, payload: OfferCreate) {
    return http
      .post<Offer>(`/employer/applications/${applicationId}/offer`, payload)
      .then((res) => res.data)
  },

  revoke(applicationId: number) {
    return http
      .post<Offer>(`/employer/applications/${applicationId}/offer/revoke`)
      .then((res) => res.data)
  },
}
