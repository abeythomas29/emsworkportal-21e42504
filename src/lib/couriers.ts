export const COURIERS: { name: string; trackUrl: (id: string) => string }[] = [
  { name: 'Delhivery', trackUrl: (id) => `https://www.delhivery.com/track-v2/package/${encodeURIComponent(id)}` },
  { name: 'Bluedart', trackUrl: (id) => `https://www.bluedart.com/tracking?trackFor=0&trackNo=${encodeURIComponent(id)}` },
  { name: 'DTDC', trackUrl: (id) => `https://www.dtdc.in/tracking/tracking_results.asp?strCnno=${encodeURIComponent(id)}&TrkType=cnno` },
  { name: 'Ekart', trackUrl: (id) => `https://ekartlogistics.com/shipmenttrack/${encodeURIComponent(id)}` },
  { name: 'Ecom Express', trackUrl: (id) => `https://ecomexpress.in/tracking/?awb_field=${encodeURIComponent(id)}` },
  { name: 'XpressBees', trackUrl: (id) => `https://www.xpressbees.com/shipment/tracking?awbNo=${encodeURIComponent(id)}` },
  { name: 'Shadowfax', trackUrl: (id) => `https://tracker.shadowfax.in/#/?trackingId=${encodeURIComponent(id)}` },
  { name: 'India Post', trackUrl: (id) => `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?id=${encodeURIComponent(id)}` },
  { name: 'DHL', trackUrl: (id) => `https://www.dhl.com/in-en/home/tracking/tracking-express.html?tracking-id=${encodeURIComponent(id)}` },
  { name: 'FedEx', trackUrl: (id) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(id)}` },
  { name: 'ST Courier', trackUrl: (id) => `https://stcourier.com/track/shipment?ConsignmentNo=${encodeURIComponent(id)}` },
  { name: 'Professional', trackUrl: (id) => `https://www.tpcindia.com/Tracking2.aspx?id=${encodeURIComponent(id)}` },
  { name: 'Trackon', trackUrl: (id) => `https://trackon.in/Tracking/MultiTracking?TrackingNo=${encodeURIComponent(id)}` },
  { name: 'Gati', trackUrl: (id) => `https://www.gati.com/single-shipment-tracking/?dktNo=${encodeURIComponent(id)}` },
  { name: 'Shree Maruti', trackUrl: (id) => `https://shreemaruti.com/track-shipment/?docket_number=${encodeURIComponent(id)}` },
  { name: 'Maruti', trackUrl: (id) => `https://www.maruticourier.com/tracking.aspx?docno=${encodeURIComponent(id)}` },
  { name: 'Other', trackUrl: (id) => `https://www.google.com/search?q=${encodeURIComponent(id + ' tracking')}` },
];

// Aliases / common misspellings → canonical courier name
const COURIER_ALIASES: Record<string, string> = {
  'shree maruthi': 'Shree Maruti',
  'shri maruti': 'Shree Maruti',
  'shri maruthi': 'Shree Maruti',
  'sree maruti': 'Shree Maruti',
  'sree maruthi': 'Shree Maruti',
  'smcs': 'Shree Maruti',
  'shree maruti courier': 'Shree Maruti',
  'shree maruti integrated logistics': 'Shree Maruti',
  'smile': 'Shree Maruti',
  'blue dart': 'Bluedart',
  'blue-dart': 'Bluedart',
  'xpress bees': 'XpressBees',
  'ecom': 'Ecom Express',
  'ecomexpress': 'Ecom Express',
  'india post': 'India Post',
  'speed post': 'India Post',
  'dtdc express': 'DTDC',
};

export function resolveCourierName(input: string): string {
  const raw = (input || '').trim().toLowerCase();
  if (!raw) return 'Other';
  if (COURIER_ALIASES[raw]) return COURIER_ALIASES[raw];
  // exact match
  const exact = COURIERS.find((c) => c.name.toLowerCase() === raw);
  if (exact) return exact.name;
  // partial / contains match
  const partial = COURIERS.find((c) => raw.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(raw));
  if (partial) return partial.name;
  // alias contains
  for (const [alias, canonical] of Object.entries(COURIER_ALIASES)) {
    if (raw.includes(alias)) return canonical;
  }
  return 'Other';
}

export function getCourierTrackingUrl(courier: string, trackingId: string): string {
  const canonical = resolveCourierName(courier);
  const found = COURIERS.find((c) => c.name === canonical);
  return (found || COURIERS[COURIERS.length - 1]).trackUrl(trackingId);
}

export const PARCEL_STATUSES = ['pending', 'in_transit', 'delivered', 'returned'] as const;
export type ParcelStatus = typeof PARCEL_STATUSES[number];
