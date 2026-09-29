/**
 * Light Google Maps style for the site: roads clearly visible, calm land and
 * water, and none of the clutter — no route-number shields, business pins
 * or transit icons. Place names stay so people can orient themselves.
 */
export const LIGHT_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#F3F2EE' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5F5F6B' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }, { weight: 3 }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },

  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#D5D2CA' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#2E2E38' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },

  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#DDEBD5' }] },
  { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'off' }] },

  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E0DDD5' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }, // route-number shields
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#FBE3B6' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#EBC98A' }] },
  { featureType: 'road.arterial', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },

  { featureType: 'transit', stylers: [{ visibility: 'off' }] },

  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C9DDEB' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6C8BA3' }] },
];
