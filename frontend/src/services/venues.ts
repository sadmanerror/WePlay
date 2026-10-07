import { Venue, VenueReservation, SportId, CreateVenueInput, VenueSlot } from '@/types';
import { mockVenues } from '../mocks/venues';
import { apiFetch } from './api-client';

const STORAGE_KEY = 'weplay_partner_venues';

function getStoredVenues(): Venue[] {
  if (typeof window === 'undefined') return [...mockVenues];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [...mockVenues];
}

function persistVenues(items: Venue[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

let venuesData: Venue[] = getStoredVenues();

export const getVenues = async (sport?: string): Promise<Venue[]> => {
  try {
    const query = sport ? `?sport=${encodeURIComponent(sport)}` : '';
    const data = await apiFetch<Venue[]>(`/venues/${query}`);
    venuesData = data;
    persistVenues(data);
    return data;
  } catch {
    venuesData = getStoredVenues();
    if (sport && sport !== 'all') {
      return venuesData.filter(v => v.sports.includes(sport as SportId));
    }
    return venuesData;
  }
};

export const getVenueById = async (id: string): Promise<Venue> => {
  try {
    return await apiFetch<Venue>(`/venues/${id}`);
  } catch {
    venuesData = getStoredVenues();
    const found = venuesData.find(v => v.id === id);
    if (!found) throw new Error('Venue not found');
    return found;
  }
};

export const createVenue = async (input: CreateVenueInput): Promise<Venue> => {
  try {
    const created = await apiFetch<Venue>('/venues/', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    venuesData = [created, ...venuesData.filter(v => v.id !== created.id)];
    persistVenues(venuesData);
    return created;
  } catch {
    venuesData = getStoredVenues();
    const venueId = `v${Date.now()}`;
    const startH = input.openingHour || 8;
    const endH = input.closingHour || 22;
    const slots: VenueSlot[] = [];

    // Generate bookable hourly slots for today/upcoming
    const today = new Date();
    for (let h = startH; h < endH; h += 2) {
      const sTime = new Date(today);
      sTime.setHours(h, 0, 0, 0);
      const eTime = new Date(today);
      eTime.setHours(h + 1, 30, 0, 0);
      const isOffPeak = h < 16;
      slots.push({
        id: `${venueId}-s-${h}`,
        venueId,
        startTime: sTime.toISOString(),
        endTime: eTime.toISOString(),
        price: isOffPeak && input.offPeakRate ? input.offPeakRate : input.hourlyRate,
        isOffPeak,
        isBooked: false,
      });
    }

    const newVenue: Venue = {
      id: venueId,
      name: input.name,
      address: input.address,
      location: input.location,
      sports: input.sports,
      hourlyRate: input.hourlyRate,
      rating: 5.0,
      isVerified: true,
      contactPerson: input.contactPerson,
      contactPhone: input.contactPhone,
      surfaceType: input.surfaceType,
      amenities: input.amenities || [],
      imageUrl: input.imageUrl || null,
      slots,
      createdAt: new Date().toISOString(),
    };

    venuesData.unshift(newVenue);
    persistVenues(venuesData);
    return newVenue;
  }
};

export const reserveVenueSlot = async (
  venueId: string,
  slotId: string
): Promise<VenueReservation> => {
  try {
    return await apiFetch<VenueReservation>(`/venues/${venueId}/slots/${slotId}/reserve`, {
      method: 'POST',
    });
  } catch {
    venuesData = getStoredVenues();
    const vIndex = venuesData.findIndex(v => v.id === venueId);
    if (vIndex === -1) throw new Error('Venue not found');
    const venue = venuesData[vIndex];
    const sIndex = (venue.slots || []).findIndex(s => s.id === slotId);
    if (sIndex === -1) throw new Error('Slot not found');
    if (venue.slots![sIndex].isBooked) throw new Error('This venue slot has already been reserved');

    venue.slots![sIndex].isBooked = true;
    persistVenues(venuesData);

    return {
      id: `res-${Date.now()}`,
      venueId,
      slotId,
      userId: 'u-me',
      amount: venue.slots![sIndex].price,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      slot: venue.slots![sIndex],
    };
  }
};
