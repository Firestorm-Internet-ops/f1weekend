// Static map of experience slug → location info relative to Albert Park Circuit
// Circuit coordinates: -37.8497, 144.968

export interface ExperienceLocation {
    distanceKm: number
    neighborhood: string
    travelMins: number   // rough tram/walk estimate from circuit
}

export const EXPERIENCE_LOCATIONS: Record<string, ExperienceLocation> = {
    // Food & Coffee
    'melbourne-laneways-hidden-bars-food-tour':    { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15 },
    'queen-victoria-market-foodie-tour':           { distanceKm: 5.1, neighborhood: 'North Melbourne', travelMins: 18 },
    'melbourne-coffee-culture-walking-tour':       { distanceKm: 4.0, neighborhood: 'CBD', travelMins: 15 },
    'yarra-valley-wine-food-day-tour':             { distanceKm: 58, neighborhood: 'Yarra Valley', travelMins: 60 },
    'melbourne-street-food-night-market-tour':     { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15 },
    'south-melbourne-market-grazing-tour':         { distanceKm: 2.8, neighborhood: 'South Melbourne', travelMins: 10 },
    'craft-beer-brewery-walk-collingwood':         { distanceKm: 7.5, neighborhood: 'Collingwood', travelMins: 25 },

    // Culture & Art
    'melbourne-street-art-laneways-tour':          { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15 },
    'ngv-arts-precinct-guided-tour':               { distanceKm: 2.8, neighborhood: 'St Kilda Road', travelMins: 10 },
    'aboriginal-heritage-walking-tour':            { distanceKm: 3.8, neighborhood: 'CBD / Yarra', travelMins: 14 },
    'melbourne-history-architecture-walk':         { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15 },
    'old-melbourne-gaol-night-tour':               { distanceKm: 4.5, neighborhood: 'CBD', travelMins: 16 },
    'royal-botanic-gardens-guided-walk':           { distanceKm: 2.2, neighborhood: 'Royal Botanic Gardens', travelMins: 8 },
    'fitzroy-collingwood-cultural-walk':           { distanceKm: 7.5, neighborhood: 'Fitzroy', travelMins: 25 },

    // Adventure & Outdoors
    'great-ocean-road-12-apostles-day-trip':       { distanceKm: 92, neighborhood: 'Great Ocean Road', travelMins: 90 },
    'melbourne-bike-tour-bayside-st-kilda':        { distanceKm: 2.5, neighborhood: 'St Kilda', travelMins: 10 },
    'kayak-melbourne-yarra-river-paddle':          { distanceKm: 3.5, neighborhood: 'Southbank', travelMins: 12 },
    'helicopter-flight-over-melbourne':            { distanceKm: 6.0, neighborhood: 'Port Melbourne', travelMins: 20 },
    'hot-air-balloon-over-melbourne-at-sunrise':   { distanceKm: 4.5, neighborhood: 'CBD meet point', travelMins: 16 },
    'surfing-lesson-at-torquay-beach':             { distanceKm: 100, neighborhood: 'Torquay', travelMins: 90 },
    'melbourne-skydive-st-kilda-beach-landing':    { distanceKm: 2.5, neighborhood: 'St Kilda', travelMins: 10 },

    // Day Trips
    'phillip-island-penguin-parade-tour':          { distanceKm: 142, neighborhood: 'Phillip Island', travelMins: 120 },
    'mornington-peninsula-hot-springs-wine':       { distanceKm: 65, neighborhood: 'Mornington Peninsula', travelMins: 65 },
    'puffing-billy-steam-train-dandenong-ranges':  { distanceKm: 45, neighborhood: 'Dandenong Ranges', travelMins: 55 },
    'wilsons-promontory-national-park-day-trip':   { distanceKm: 218, neighborhood: 'Wilsons Promontory', travelMins: 180 },
    'yarra-valley-winery-hopping-tour':            { distanceKm: 62, neighborhood: 'Yarra Valley', travelMins: 65 },
    'healesville-sanctuary-wildlife-experience':   { distanceKm: 68, neighborhood: 'Healesville', travelMins: 70 },
    'grampians-national-park-eco-day-tour':        { distanceKm: 258, neighborhood: 'Grampians', travelMins: 210 },

    // Nightlife
    'melbourne-rooftop-bar-crawl':                 { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15 },
    'hidden-speakeasy-cocktail-tour':              { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15 },
    'melbourne-live-music-pub-crawl':              { distanceKm: 5.5, neighborhood: 'CBD / Fitzroy', travelMins: 20 },
    'melbourne-uncover-hidden-laneway-bars':       { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15 },
    'haunted-melbourne-ghost-tour':                { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15 },
    'melbourne-river-cruise-with-dinner':          { distanceKm: 3.5, neighborhood: 'Southbank', travelMins: 12 },
    'casino-southbank-evening-experience':         { distanceKm: 3.5, neighborhood: 'Southbank', travelMins: 12 },
};
