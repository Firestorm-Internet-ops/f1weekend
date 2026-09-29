import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSeasonRaces, unmappedRaces } from './next-season';
import type { JolpicaRace } from './jolpica';

const jr = (round: string, circuitId: string, raceName: string, date: string, fp1?: string): JolpicaRace => ({
  round, raceName, date,
  Circuit: { circuitId, circuitName: '', Location: { lat: '0', long: '0', locality: '', country: '' } },
  ...(fp1 ? { FirstPractice: { date: fp1, time: '01:30:00Z' } } : {}),
});

test('next season maps onto our race keys; unknown circuits are reported, not guessed', () => {
  const races = [
    jr('1', 'albert_park', 'Australian Grand Prix', '2027-03-14', '2027-03-12'),
    jr('4', 'bahrain', 'Bahrain Grand Prix', '2027-04-11'),
    jr('9', 'new_street_circuit', 'Somewhere Grand Prix', '2027-06-20'),
  ];
  assert.deepEqual(toSeasonRaces(2027, races), [
    { key: 'melbourne', season: 2027, round: 1, name: 'Australian Grand Prix', startDate: '2027-03-12', raceDate: '2027-03-14' },
    { key: 'bahrain', season: 2027, round: 4, name: 'Bahrain Grand Prix', startDate: '2027-04-09', raceDate: '2027-04-11' },
  ]);
  assert.deepEqual(unmappedRaces(races), ['Somewhere Grand Prix (new_street_circuit)']);
});
