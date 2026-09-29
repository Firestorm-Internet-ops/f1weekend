/**
 * Getting-there guides for venues whose stored guide is for another circuit
 * (the Bahrain GP moved to Sepang). Same shape as race_content.transport_guide.
 * Kept general on purpose: race-weekend shuttle details are published by the
 * circuit closer to the event, so we point there instead of guessing.
 */
export interface VenueGuide {
  intro: string;
  options: { icon: string; title: string; details: string; bestFor: string }[];
  note?: string;
}

export const VENUE_GUIDES_2026: Record<string, VenueGuide> = {
  'bahrain-2026': {
    intro:
      'Sepang International Circuit sits right beside Kuala Lumpur International Airport (KLIA), about 45 km south of central Kuala Lumpur and 25 km south of Putrajaya. Roads to the circuit get busy before and after the sessions, so leave extra time on Saturday and Sunday.',
    options: [
      {
        icon: '🚆',
        title: 'Airport train + shuttle or short ride',
        details:
          'Take the KLIA Ekspres or KLIA Transit from KL Sentral to KLIA, then the race-weekend shuttle or a short ride-hail to the circuit. The train avoids the expressway traffic into Sepang.',
        bestFor: 'Staying in central Kuala Lumpur',
      },
      {
        icon: '🚗',
        title: 'Grab (ride-hailing)',
        details:
          'Grab is Malaysia’s main ride-hailing app and works from Kuala Lumpur, Putrajaya and the airport hotels. Expect surge pricing and long waits straight after qualifying and the race — walk away from the gates or wait out the rush.',
        bestFor: 'Groups, Putrajaya and airport hotels',
      },
      {
        icon: '🅿️',
        title: 'Driving',
        details:
          'Follow the expressways towards KLIA, then the circuit signs; it’s roughly 55–60 km by road from central Kuala Lumpur. Use the official car parks on your ticket and arrive early on race day.',
        bestFor: 'Rental car, flexible plans',
      },
      {
        icon: '✈️',
        title: 'Flying in on the weekend',
        details:
          'KLIA is minutes from the circuit, so you can land on Friday morning and still make the afternoon sessions. Leave luggage at your hotel or the airport left-luggage desk.',
        bestFor: 'Short trips',
      },
    ],
    note: 'Race-weekend shuttle routes and times for 2026 are published by the circuit — check sepangcircuit.com before you travel.',
  },
};

export function venueGuide(slug: string): VenueGuide | undefined {
  return VENUE_GUIDES_2026[slug];
}
