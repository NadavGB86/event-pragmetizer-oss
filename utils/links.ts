import type { PlanComponent, ParticipantProfile, DateInfo } from '../types';

interface ActionLink {
  label: string;
  url: string;
  icon: 'map' | 'hotel' | 'search';
}

/**
 * Strip parenthetical suffixes from hotel names.
 * "Hotel Napa (Boutique)" → "Hotel Napa"
 */
function stripParenthetical(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export function getComponentLinks(
  component: PlanComponent,
  destination?: string,
  participants?: ParticipantProfile,
  dateInfo?: DateInfo
): ActionLink[] {
  const links: ActionLink[] = [];
  const q = encodeURIComponent(component.title);
  const dest = destination ? encodeURIComponent(destination) : '';

  // Google Maps search for all component types
  const mapsQuery = dest ? `${q}+${dest}` : q;
  links.push({
    label: 'Maps',
    url: `https://www.google.com/maps/search/${mapsQuery}`,
    icon: 'map',
  });

  // Type-specific links
  switch (component.type) {
    case 'accommodation': {
      // Clean hotel name: strip parenthetical suffixes
      const cleanName = stripParenthetical(component.title);
      const params = new URLSearchParams();
      params.set('ss', destination ? `${cleanName}, ${destination}` : cleanName);
      // Do NOT set dest_type=city — it causes Booking.com to interpret hotel name as city
      if (participants) {
        params.set('group_adults', String(participants.adults));
        params.set('no_rooms', String(participants.room_count));
        if (participants.children > 0) {
          params.set('group_children', String(participants.children));
        }
      }
      if (dateInfo?.tier === 'exact' && dateInfo.start_date && dateInfo.end_date) {
        params.set('checkin', dateInfo.start_date);
        params.set('checkout', dateInfo.end_date);
      }
      links.push({
        label: 'Booking.com',
        url: `https://www.booking.com/searchresults.html?${params.toString()}`,
        icon: 'hotel',
      });
      break;
    }
    case 'activity':
      links.push({
        label: 'Search',
        url: `https://www.google.com/search?q=${q}+${dest}+tickets+booking`,
        icon: 'search',
      });
      break;
    case 'dining':
      links.push({
        label: 'Search',
        url: `https://www.google.com/search?q=${q}+${dest}+restaurant+reservations`,
        icon: 'search',
      });
      break;
    case 'transport':
      links.push({
        label: 'Search',
        url: `https://www.google.com/search?q=${q}+book`,
        icon: 'search',
      });
      break;
  }

  return links;
}

/**
 * Extract a likely destination CITY name from plan components.
 * Prioritizes city-level extraction for better Booking.com / Maps results.
 */
export function extractDestination(components: PlanComponent[]): string | undefined {
  // 1. Try transport titles: "Flight to Barcelona", "Flights to Larnaca, Cyprus"
  const transport = components.find(c => c.type === 'transport');
  if (transport) {
    const toMatch = transport.title.match(/to\s+(.+)/i);
    if (toMatch) return toMatch[1].trim();
  }

  // 2. Try accommodation "in" pattern: "Hotel Napa Mermaid in Ayia Napa"
  const accom = components.find(c => c.type === 'accommodation');
  if (accom) {
    const inMatch = accom.title.match(/\bin\s+(.+)/i);
    if (inMatch) return inMatch[1].trim();
    // Also check details field for location
    const detailInMatch = accom.details?.match(/\bin\s+([A-Z][a-zA-Z\s,]+)/);
    if (detailInMatch) return detailInMatch[1].trim();
  }

  // 3. Try transport airport codes: "TLV-LCA" → use destination code as hint
  if (transport) {
    const codeMatch = transport.title.match(/[A-Z]{3}\s*[-–]\s*([A-Z]{3})/);
    if (codeMatch) return codeMatch[1]; // Return airport code as fallback
  }

  return undefined;
}
