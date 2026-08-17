export interface PlatformOverview {
  vendorsPending: number;
  vendorsApproved: number;
  bookingsCount: number;
  ordersCount: number;
  /** Gross merchandise value across bookings and product orders, in Naira. */
  gmv: number;
}
